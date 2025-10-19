"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { UserProvider } from "../context/UserContext";

const hideHeaderRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/first-connection"];

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