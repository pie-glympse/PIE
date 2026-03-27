import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { render } from "@react-email/render";
import { SetPasswordEmailTemplate } from "@/components/set-password-email-template";
import { sendEmail } from "@/lib/brevo";

interface CSVRow {
    email: string;
    firstName: string;
    lastName: string;
}

function parseCSV(text: string): CSVRow[] {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Détecter si la première ligne est un header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('email') && (firstLine.includes('prenom') || firstLine.includes('prénom') || firstLine.includes('firstname') || firstLine.includes('first name'));

    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map(line => {
        // Gérer les virgules et points-virgules comme séparateurs
        const parts = line.includes(';') ? line.split(';') : line.split(',');
        const trimmedParts = parts.map(p => p.trim().replace(/^"|"$/g, ''));

        return {
            email: trimmedParts[0] || '',
            firstName: trimmedParts[1] || '',
            lastName: trimmedParts[2] || ''
        };
    }).filter(row => row.email && row.email.includes('@'));
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const email = formData.get('email') as string;
        const companyName = formData.get('companyName') as string;
        const csvFile = formData.get('csvFile') as File;

        // Validation
        if (!firstName || !lastName || !email || !companyName || !csvFile) {
            return NextResponse.json(
                { error: "Tous les champs sont requis" },
                { status: 400 }
            );
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Format d'email invalide" },
                { status: 400 }
            );
        }

        // Lire le fichier CSV
        const csvText = await csvFile.text();
        const employees = parseCSV(csvText);

        if (employees.length === 0) {
            return NextResponse.json(
                { error: "Aucune donnée valide trouvée dans le CSV" },
                { status: 400 }
            );
        }

        // Vérifier que les emails (patron + employés) ne sont pas déjà utilisés
        const ownerEmail = email.toLowerCase().trim();
        const employeeEmails = employees.map(e => e.email.toLowerCase().trim());
        const allEmails = [ownerEmail, ...employeeEmails];

        const existingUsers = await prisma.user.findMany({
            where: {
                email: { in: allEmails }
            }
        });

        if (existingUsers.length > 0) {
            const existingEmails = existingUsers.map(u => u.email).join(', ');
            return NextResponse.json(
                { error: `Les emails suivants sont déjà utilisés: ${existingEmails}` },
                { status: 400 }
            );
        }

        // Réinitialiser les séquences PostgreSQL si nécessaire (fix pour erreur P2002)
        try {
            await prisma.$executeRawUnsafe(`
                SELECT setval(
                    pg_get_serial_sequence('"Company"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "Company"), 1),
                    true
                );
                SELECT setval(
                    pg_get_serial_sequence('"User"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "User"), 1),
                    true
                );
            `);
        } catch (seqError) {
            console.warn("Impossible de réinitialiser les séquences:", seqError);
        }

        // Créer la Company
        const company = await prisma.company.create({
            data: {
                name: companyName
            }
        });

        // Créer le patron (admin) - on génère un mot de passe temporaire
        const tempPassword = randomBytes(16).toString('hex');
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        const owner = await prisma.user.create({
            data: {
                email: ownerEmail,
                password: hashedTempPassword,
                firstName,
                lastName,
                role: "ADMIN",
                companyId: company.id,
                photoUrl: ""
            }
        });

        // Créer un token pour le patron
        const ownerToken = randomBytes(32).toString("hex");
        const ownerExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        const ownerTokenRecord = await prisma.passwordResetToken.create({
            data: {
                token: ownerToken,
                email: ownerEmail,
                userId: owner.id,
                expiresAt: ownerExpiresAt,
                used: false
            }
        });

        console.log("Token créé pour le patron:", {
            email: ownerEmail,
            tokenId: ownerTokenRecord.id.toString(),
            tokenLength: ownerToken.length,
            tokenPreview: ownerToken.substring(0, 10) + "...",
            expiresAt: ownerExpiresAt.toISOString()
        });

        // Envoyer l'email au patron
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
        const ownerSetPasswordLink = `${baseUrl}/set-password?token=${ownerToken}&email=${encodeURIComponent(ownerEmail)}`;

        const isDevelopment = process.env.NODE_ENV === "development";
        const ownerRecipientEmail = isDevelopment
            ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com"
            : ownerEmail;

        const ownerHtml = await render(
            SetPasswordEmailTemplate({
                setPasswordLink: ownerSetPasswordLink,
                userEmail: ownerEmail,
                firstName,
                isOwner: true,
            })
        );

        await sendEmail({
            to: [{ email: ownerRecipientEmail, name: `${firstName} ${lastName}` }],
            subject: isDevelopment
                ? `[TEST] Créez votre mot de passe Glyms - ${ownerEmail}`
                : "Créez votre mot de passe - Glyms",
            html: ownerHtml,
        });

        // Créer les utilisateurs de l'équipe
        let usersCreated = 0;
        const errors: string[] = [];

        for (const employee of employees) {
            try {
                const employeeEmail = employee.email.toLowerCase().trim();

                // Vérifier si l'email existe déjà (double vérification)
                const existing = await prisma.user.findUnique({
                    where: { email: employeeEmail }
                });

                if (existing) {
                    errors.push(`Email ${employeeEmail} déjà utilisé`);
                    continue;
                }

                // Créer un mot de passe temporaire (sera remplacé par l'utilisateur)
                const tempPwd = randomBytes(16).toString('hex');
                const hashedPwd = await bcrypt.hash(tempPwd, 10);

                // Créer l'utilisateur
                const user = await prisma.user.create({
                    data: {
                        email: employeeEmail,
                        password: hashedPwd,
                        firstName: employee.firstName || '',
                        lastName: employee.lastName || '',
                        role: "STANDARD",
                        companyId: company.id,
                        photoUrl: ""
                    }
                });

                // Créer un token pour la création de mot de passe
                const token = randomBytes(32).toString("hex");
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

                const tokenRecord = await prisma.passwordResetToken.create({
                    data: {
                        token,
                        email: employeeEmail,
                        userId: user.id,
                        expiresAt,
                        used: false
                    }
                });

                console.log("Token créé pour:", {
                    email: employeeEmail,
                    tokenId: tokenRecord.id.toString(),
                    tokenLength: token.length,
                    tokenPreview: token.substring(0, 10) + "...",
                    expiresAt: expiresAt.toISOString()
                });

                // Envoyer l'email
                const setPasswordLink = `${baseUrl}/set-password?token=${token}&email=${encodeURIComponent(employeeEmail)}`;

                const recipientEmail = isDevelopment
                    ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com"
                    : employeeEmail;

                const employeeHtml = await render(
                    SetPasswordEmailTemplate({
                        setPasswordLink,
                        userEmail: employeeEmail,
                        firstName: employee.firstName || '',
                        isOwner: false,
                    })
                );

                await sendEmail({
                    to: [{ email: recipientEmail, name: `${employee.firstName} ${employee.lastName}` }],
                    subject: isDevelopment
                        ? `[TEST] Créez votre mot de passe Glyms - ${employeeEmail}`
                        : "Créez votre mot de passe - Glyms",
                    html: employeeHtml,
                });

                usersCreated++;
            } catch (error) {
                console.error(`Erreur lors de la création de l'utilisateur ${employee.email}:`, error);
                errors.push(`Erreur pour ${employee.email}: ${(error as Error).message}`);
            }
        }

        return NextResponse.json({
            message: "Inscription réussie",
            usersCreated,
            companyId: company.id.toString(),
            errors: errors.length > 0 ? errors : undefined
        }, { status: 200 });

    } catch (error) {
        console.error("Erreur dans register-team:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
