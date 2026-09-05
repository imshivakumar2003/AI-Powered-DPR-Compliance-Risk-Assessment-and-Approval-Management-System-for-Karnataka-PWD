// TOPLINE

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "@/lib/UserContext";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { login, isLoggedIn, user } = useUser();

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect directly to appropriate dashboard
    if (isLoggedIn && user?.role) {
      if (user.role === 'admin') router.replace("/admin/dashboard");
      else if (user.role === 'viewer') router.replace("/viewer/dashboard");
      else router.replace("/user/dashboard");
    }
  }, [isLoggedIn, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const cleanId = loginId.trim();
    if (!cleanId || !password) {
      setError("Please enter both Login ID and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(cleanId, password);
      // Synchronously commit auth state to UserContext, localStorage, sessionStorage, and cookies
      const authenticatedUser = login(data.access_token, {
        username: data.username || cleanId,
        role: data.role,
        full_name: data.full_name,
        email: data.email,
        department: data.department,
        id: data.id,
      });

      // Immediate role-based redirection without page refresh
      if (authenticatedUser.role === 'admin') {
        router.push("/admin/dashboard");
      } else if (authenticatedUser.role === 'viewer') {
        router.push("/viewer/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid Login ID or password. Please try again.");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "linear-gradient(135deg, #0b0f1a 0%, #111827 50%, #0b0f1a 100%)"
          : "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #eef2ff 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 20,
        position: "relative",
        overflow: "hidden",
        transition: "background 0.5s ease",
      }}
    >
      {/* Subtle grid pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: isDark ? 0.03 : 0.05,
        backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
        backgroundSize: "32px 32px", pointerEvents: "none",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "-15%", left: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        style={{
          position: "absolute", top: 24, right: 24, zIndex: 20,
          width: 44, height: 44, borderRadius: 14,
          background: isDark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: isDark ? "#fbbf24" : "#475569", fontSize: 18,
          transition: "all 0.3s ease",
        }}
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%", maxWidth: 1040, display: "flex",
          borderRadius: 32, overflow: "hidden", zIndex: 1,
          background: isDark ? "rgba(15,23,42,0.6)" : "#ffffff",
          backdropFilter: "blur(40px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.5)"
            : "0 32px 80px rgba(99,102,241,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* ─── Left Branding Panel ─── */}
        <div
          className="auth-left-panel"
          style={{
            display: "none", width: "44%", padding: "56px 48px",
            flexDirection: "column", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
            background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%)",
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 40, left: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.02)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 64 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
              }}>
                <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>DPR-AI</div>
                <div style={{ color: "rgba(165,180,252,0.7)", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>Karnataka PWD PORTAL</div>
              </div>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24, padding: "6px 16px", marginBottom: 24,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.6)" }} />
              <span style={{ color: "rgba(196,181,253,0.9)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Smart Assessment Active</span>
            </div>
            <h2 style={{ color: "white", fontSize: 42, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-1px" }}>
              Intelligent<br />
              <span style={{ background: "linear-gradient(90deg, #a5b4fc, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Project Review</span>
            </h2>
            <p style={{ color: "rgba(196,181,253,0.65)", fontSize: 15, lineHeight: 1.7, maxWidth: 320 }}>
            AI-Powered DPR Compliance, Risk Assessment and Approval Management System for Karnataka PWD
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 32, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[{ val: "2,400+", lbl: "DPRs Analyzed" }, { val: "98%", lbl: "Accuracy" }, { val: "31  Districts", lbl: "Coverage" }].map(s => (
              <div key={s.lbl}>
                <div style={{ color: "white", fontSize: 20, fontWeight: 900, letterSpacing: "-0.3px" }}>{s.val}</div>
                <div style={{ color: "rgba(165,180,252,0.5)", fontSize: 11, fontWeight: 600, marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right Form Panel ─── */}
        <div style={{ flex: 1, padding: "56px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ maxWidth: 400, margin: "0 auto", width: "100%" }}>
            {/* Mobile logo */}
            <div className="auth-mobile-logo" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: isDark ? "white" : "#1e1b4b" }}>DPR-AI</span>
            </div>

            <h1 style={{
              fontSize: 30, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.2,
              color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 8,
            }}>
              Welcome back
            </h1>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 15, marginBottom: 36, fontWeight: 500 }}>
              Sign in to your account to continue.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
                  border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#fecaca"}`,
                  borderRadius: 14, padding: "12px 16px", marginBottom: 24,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin}>
              {/* Login ID */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8,
                  color: isDark ? "#cbd5e1" : "#374151",
                }}>
                  Login ID
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isDark ? "#475569" : "#9ca3af", lineHeight: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                  </span>
                  <input
                    type="text" required value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Username or Email"
                    style={{
                      width: "100%", paddingLeft: 46, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                      background: isDark ? "rgba(30,41,59,0.5)" : "#f8fafc",
                      border: `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 14, fontSize: 14, fontWeight: 600,
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontFamily: "inherit",
                    }}
                    onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#cbd5e1" : "#374151" }}>Password</label>
                  <a href="#" style={{ color: "#6366f1", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Forgot?</a>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isDark ? "#475569" : "#9ca3af", lineHeight: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    style={{
                      width: "100%", paddingLeft: 46, paddingRight: 48, paddingTop: 14, paddingBottom: 14,
                      background: isDark ? "rgba(30,41,59,0.5)" : "#f8fafc",
                      border: `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 14, fontSize: 14, fontWeight: 600,
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontFamily: "inherit",
                    }}
                    onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: isDark ? "#64748b" : "#9ca3af", padding: 0, lineHeight: 0 }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: "#6366f1", cursor: "pointer", borderRadius: 4 }} />
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 13, fontWeight: 600 }}>Remember me</span>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: 15,
                  background: loading ? (isDark ? "#334155" : "#a5b4fc") : "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "white", border: "none", borderRadius: 14,
                  fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.25s", letterSpacing: "0.2px", fontFamily: "inherit",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(99,102,241,0.3)",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget).style.transform = "translateY(-2px)"; (e.currentTarget).style.boxShadow = "0 10px 28px rgba(99,102,241,0.4)"; } }}
                onMouseLeave={e => { if (!loading) { (e.currentTarget).style.transform = "translateY(0)"; (e.currentTarget).style.boxShadow = "0 6px 20px rgba(99,102,241,0.3)"; } }}
              >
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 28, color: isDark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 500 }}>
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" style={{ color: "#6366f1", fontWeight: 800, textDecoration: "none" }}>
                Sign up for free
              </Link>
            </p>

            {/* Demo accounts */}
            <div style={{
              marginTop: 28, padding: "16px", borderRadius: 14,
              background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
              border: `1px dashed ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.2)"}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#6366f1" : "#4f46e5", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Demo Accounts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { id: "admin", pwd: "admin", role: "Admin", color: "#ef4444" },
                  { id: "user", pwd: "user", role: "Requester", color: "#6366f1" },
                  { id: "test", pwd: "1234", role: "Viewer", color: "#10b981" },
                ].map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => { setLoginId(acc.id); setPassword(acc.pwd); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: acc.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#cbd5e1" : "#374151", fontFamily: "monospace" }}>
                        {acc.id} / {acc.pwd}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: acc.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
