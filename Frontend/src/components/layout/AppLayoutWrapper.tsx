// TOPLINE
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ReactNode, useEffect } from "react";
import { useUser } from "@/lib/UserContext";

export function AppLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname?.startsWith("/auth");
  const { isLoaded, isLoggedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isAuthPage && !isLoggedIn) {
      router.replace("/auth/login");
    }
  }, [isLoaded, isAuthPage, isLoggedIn, router]);

  // Auth pages render immediately
  if (isAuthPage) {
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
