// TOPLINE

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { registerUser } from "@/lib/api";

const INDIA_STATES = [
  "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli & Daman & Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState("Karnataka");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await registerUser({ username: username.trim(), email: email.trim(), password, full_name: fullName.trim(), state });
      router.push("/auth/login");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Try a different Login ID.");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  const inputStyle: React.CSSProperties = {
    width: "100%", paddingTop: 13, paddingBottom: 13, paddingLeft: 16, paddingRight: 16,
    background: isDark ? "rgba(30,41,59,0.5)" : "#f8fafc",
    border: `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    borderRadius: 14, fontSize: 14, fontWeight: 600,
    color: isDark ? "#f1f5f9" : "#0f172a",
    outline: "none", transition: "all 0.2s", boxSizing: "border-box" as const, fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8,
    color: isDark ? "#cbd5e1" : "#374151",
  };

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: isDark
          ? "linear-gradient(135deg, #0b0f1a 0%, #111827 50%, #0b0f1a 100%)"
          : "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #eef2ff 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 20, position: "relative", overflow: "hidden", transition: "background 0.5s ease",
      }}
    >
      {/* Grid pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: isDark ? 0.03 : 0.05,
        backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
        backgroundSize: "32px 32px", pointerEvents: "none",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", left: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

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
          color: isDark ? "#fbbf24" : "#475569", fontSize: 18, transition: "all 0.3s ease",
        }}
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%", maxWidth: 1040, display: "flex", flexDirection: "row-reverse",
          borderRadius: 32, overflow: "hidden", zIndex: 1,
          background: isDark ? "rgba(15,23,42,0.6)" : "#ffffff",
          backdropFilter: "blur(40px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.5)"
            : "0 32px 80px rgba(99,102,241,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* ─── Right Branding Panel ─── */}
        <div
          className="auth-left-panel"
          style={{
            display: "none", width: "42%", padding: "56px 48px",
            flexDirection: "column", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
            background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%)",
          }}
        >
          <div style={{ position: "absolute", top: -80, left: -80, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: "white", letterSpacing: "-0.5px" }}>DPR Analysis</span>
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
          </div>

          <div style={{ position: "relative", zIndex: 1, textAlign: "right" }}>
            <h2 style={{ color: "white", fontSize: 42, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-1px" }}>
              Join the<br />
              <span style={{ background: "linear-gradient(90deg, #a5b4fc, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Network</span>
            </h2>
            <p style={{ color: "rgba(196,181,253,0.65)", fontSize: 15, lineHeight: 1.7, marginLeft: "auto", maxWidth: 320 }}>
              AI-Powered DPR Analysis for all states. Covering Karnataka PWD, PM-DevINE and all central ministry schemes.
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 5, borderRadius: 99, transition: "all 0.5s", width: i === 2 ? 32 : 10, background: i === 2 ? "#818cf8" : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
        </div>

        {/* ─── Left Form Panel ─── */}
        <div style={{ flex: 1, padding: "48px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
            {/* Mobile logo */}
            <div className="auth-mobile-logo" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: isDark ? "white" : "#1e1b4b" }}>DPR Analysis</span>
            </div>

            <h1 style={{
              fontSize: 30, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.2,
              color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 8,
            }}>
              Create your account
            </h1>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 15, marginBottom: 32, fontWeight: 500 }}>
              Get started with DPR assessment today.
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
                  border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#fecaca"}`,
                  borderRadius: 14, padding: "12px 16px", marginBottom: 20,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleRegister}>
              {/* Row 1: Name + Login ID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe" style={inputStyle}
                    onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`; e.target.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Login ID</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe123" style={inputStyle}
                    onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Row 2: State */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>State Jurisdiction</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isDark ? "#475569" : "#9ca3af", lineHeight: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <select value={state} onChange={(e) => setState(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 42, appearance: "none" as const, cursor: "pointer" }}
                  >
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Email */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isDark ? "#475569" : "#9ca3af", lineHeight: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                  </span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com" style={{ ...inputStyle, paddingLeft: 42 }}
                    onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Row 4: Password */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: isDark ? "#475569" : "#9ca3af", lineHeight: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters"
                    style={{ ...inputStyle, paddingLeft: 42, paddingRight: 48 }}
                    onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: isDark ? "#64748b" : "#9ca3af", padding: 0, lineHeight: 0 }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
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
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 24, color: isDark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 500 }}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{ color: "#6366f1", fontWeight: 800, textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
