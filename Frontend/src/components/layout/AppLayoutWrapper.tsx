// TOPLINE
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ReactNode, useEffect } from "react";
import { useUser } from "@/lib/UserContext";

export function AppLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const isAuthPage = pathname?.startsWith("/auth");
  const isPublicPage = isHomePage || isAuthPage;
  const { isLoaded, isLoggedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isPublicPage && !isLoggedIn) {
      router.replace("/auth/login");
    }
  }, [isLoaded, isPublicPage, isLoggedIn, router]);

  // Public pages (Home Page and Auth) render immediately without Sidebar
  if (isPublicPage) {
    return <div style={{ minHeight: "100vh", width: "100%" }}>{children}</div>;
  }

  // Protected pages: wait for auth check
  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Authenticating...</div>
        </div>
      </div>
    );
  }

  // Prevent flash of protected content before redirect
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}
