"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/header/header";
import { UserProvider } from "../context/UserContext";

const hideHeaderRoutes = ["/login", "/register", "/forgot-password", "/first-connection"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !hideHeaderRoutes.includes(pathname);

  return (
    <UserProvider>
      {showHeader && <Header />}
      {children}
    </UserProvider>
  );
}