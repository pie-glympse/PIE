import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (do not forget to set the CRON_SECRET variable in Vercel)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      userCount,
      message: "Database connection active"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { 
        status: "error", 
        timestamp: new Date().toISOString(),
        error: "Database connection failed" 
      }, 
      { status: 500 }
    );
  }
}
