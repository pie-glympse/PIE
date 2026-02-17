"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {

    useEffect(() => {
        document.body.classList.add("page-404");
        return () => {
            document.body.classList.remove("page-404");
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col absolute inset-0 bg-white z-50">
            <header className="w-full bg-white shadow-md py-4">
                <div className="flex justify-center">
                    <Link href="/home">
                        <Image
                            src="/images/logo/Logotype.svg"
                            alt="Logo Glyms"
                            width={120}
                            height={40}
                            className="h-10 w-auto"
                            sizes="120px"
                            priority
                        />
                    </Link>
                </div>
            </header>
            <div className="flex-1 flex items-center justify-center px-4 py-8">

                <div className="max-w-6xl w-full flex flex-col items-center md:flex-row md:justify-between gap-8">

                    <div className="flex justify-center md:order-2 md:flex-1">
                        <Image
                            src="/images/mascotte/night_work.svg"
                            alt="Page non trouvée"
                            width={700}
                            height={700}
                            className="w-full max-w-[200px] md:max-w-[700px] h-auto"
                            sizes="(max-width: 768px) 200px, 700px"
                            loading="lazy"
                        />
                    </div>
                    <div className="flex-1 text-center md:text-left md:order-1">
                        <h1 className="text-[80px] md:text-[180px] font-bold text-black leading-none">
                            404
                        </h1>
                        <p className="text-base md:text-xl text-gray-700 mt-4 mb-6 md:mb-8">
                            Page non trouvée. Nous ne savons pas exactement ce qu&apos;il s&apos;est passé,
                            mais vous pouvez retourner à l&apos;accueil.
                        </p>
                        <Link
                            href="/home"
                            className="inline-block bg-red text-white px-6 py-2.5 md:px-8 md:py-3 rounded-lg hover:bg-red-600 transition-colors text-sm md:text-base"
                        >
                            Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
