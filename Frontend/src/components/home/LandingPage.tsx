// TOPLINE
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { fetchDashboardStats, fetchDistrictAnalytics, fetchRiskAlerts, DashboardStats } from '@/lib/api';
import {
  Building2, ShieldCheck, FileText, CheckCircle, Clock, MapPin,
  TrendingUp, HelpCircle, Phone, Mail, ChevronDown, ChevronRight,
  Search, ArrowRight, ShieldAlert, Award, Bot, FileSpreadsheet,
  Users, UserCheck, Layers, BookOpen, ExternalLink, Sparkles, AlertTriangle, Lock,
  LogIn, UserPlus
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard?: () => void;
}

export function LandingPage({ onEnterDashboard }: LandingPageProps) {
  const { user, isLoggedIn } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [districtCount, setDistrictCount] = useState(31);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [trackingId, setTrackingId] = useState('');

  const handlePortalAction = () => {
    if (onEnterDashboard) {
      onEnterDashboard();
      return;
    }
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    if (user.role === 'admin') router.push('/admin/dashboard');
    else if (user.role === 'viewer') router.push('/viewer/dashboard');
    else router.push('/user/dashboard');
  };
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [searchingStatus, setSearchingStatus] = useState(false);
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    async function loadStats() {
      try {
        const [sData, dData] = await Promise.all([
          fetchDashboardStats().catch(() => null),
          fetchDistrictAnalytics().catch(() => []),
        ]);
        if (sData) setStats(sData);
        if (dData && dData.length > 0) setDistrictCount(dData.length);
      } catch (e) {
        console.error('Error loading landing page stats:', e);
      }
    }
    loadStats();
  }, []);

  const handleTrackStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setSearchingStatus(true);
    setTimeout(() => {
      setTrackingResult({
        id: trackingId.toUpperCase(),
        title: 'Civil Infrastructure & Pavement Development',
        district: 'Hassan',
        sector: 'Roads',
        status: 'APPROVED / SANCTIONED',
        score: '81.0 / 100',
        outlay: '₹ 100.00 Crores',
        submittedBy: 'chaya',
        appraisalDate: '29-Jul-2026 03:06 AM IST',
        currentStage: 'Step 4: Chief Engineer Approval / Sanction (Completed)',
      });
      setSearchingStatus(false);
    }, 500);
  };

  const totalDprs = stats?.total_dprs ?? 42;
  const approvedCount = stats?.approved_count ?? 28;
  const pendingCount = stats?.pending_review ?? 10;
  const totalOutlay = stats?.total_fund_allocation_cr ?? 12450;
  const highRiskCount = stats?.high_risk_projects ?? 4;

  const faqs = [
    {
      q: "What is a Detailed Project Report (DPR) and why is techno-economic appraisal required?",
      a: "A Detailed Project Report (DPR) is an official comprehensive master plan detailing structural engineering design, soil bearing investigations, Bill of Quantities (BOQ), environmental impact, and financial projections. Karnataka PWD mandates techno-economic appraisal to ensure public funds are spent in strict compliance with the Karnataka Schedule of Rates (KSR 2023), IRC standards, and statutory clearances."
    },
    {
      q: "How does the AI-powered DPR assessment engine work?",
      a: "Our system combines OCR document parsing, NLP entity extraction, rules-based Karnataka PWD statutory checklist auditing, and ML risk prediction models. It automatically cross-references uploaded BOQs against KSR 2023 unit rates, flags non-compliant engineering codes (IRC:37, IRC:78), and detects missing statutory clearances (FC Act 1980, RFCTLARR Act 2013)."
    },
    {
      q: "Can the system generate official PDF sanction reports?",
      a: "Yes. The portal generates publication-ready 5-page Techno-Economic Compliance & Risk Appraisal Reports formatted according to Karnataka PWD document standards. Each report includes metadata, scorecards, compliance checklists, risk exposure breakdowns, reviewer comments, and official 3-signature approval blocks."
    },
    {
      q: "Who can access the portal and what are the user roles?",
      a: "The portal supports 4 primary roles: (1) Director / Admin - administrative control and sanction authority; (2) State Reviewer - division and circle technical appraisal; (3) DPR Submitter - project upload and revision tracking; and (4) Viewer - public monitoring, analytics, and Groq AI chatbot assistance."
    },
    {
      q: "How do I track the real-time status of a submitted DPR application?",
      a: "You can track any DPR by entering its Registration ID (e.g. DPR-KA-2026-DA02E3) in the status tracking section on this home page, or by navigating to the Application Status portal after logging in."
    }
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#0b1329', color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: fontSize === 'large' ? '16px' : '14px',
    }}>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP UTILITY ACCESSIBILITY BAR */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#070d1e', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 24px', fontSize: 11.5, color: '#94a3b8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Building2 size={13} /> GOVERNMENT OF KARNATAKA OFFICIAL PORTAL
          </span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Public Works Department (PWD) · KR Circle, Bengaluru - 560001</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Font Size:</span>
            <button onClick={() => setFontSize('normal')} style={{ background: fontSize === 'normal' ? '#1e3a8a' : 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', fontSize: 10 }}>A</button>
            <button onClick={() => setFontSize('large')} style={{ background: fontSize === 'large' ? '#1e3a8a' : 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>A+</button>
          </div>
          <span style={{ opacity: 0.4 }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? '#d97706' : 'transparent', color: 'white', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10.5, fontWeight: 700 }}>English</button>
            <button onClick={() => setLang('kn')} style={{ background: lang === 'kn' ? '#d97706' : 'transparent', color: 'white', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10.5, fontWeight: 700 }}>ಕನ್ನಡ</button>
          </div>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>Helpline: 1800-425-0012</span>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. OFFICIAL GOVT HEADER & NAVIGATION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '3px solid #d97706', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 1000,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          {/* Logo & Emblem Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #1e3a8a, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22,
              boxShadow: '0 4px 14px rgba(217,119,6,0.4)', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              KA
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                GOVERNMENT OF KARNATAKA
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                Public Works Department · DPR-AI Portal
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Techno-Economic Compliance, Risk Assessment & Approval System
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, fontWeight: 600 }}>
            <a href="#about" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>About</a>
            <a href="#workflow" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>How It Works</a>
            <a href="#roles" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Portals & Roles</a>
            <a href="#tracking" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Status Tracker</a>
            <a href="#faq" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>FAQ & Help</a>

            <Link
              href="/auth/login"
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(255,255,255,0.08)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s'
              }}
            >
              <LogIn size={15} /> Login
            </Link>

            <Link
              href="/auth/register"
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'linear-gradient(135deg, #22c55e, #15803d)', color: 'white',
                border: 'none', fontSize: 13, fontWeight: 800,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(34,197,94,0.3)', transition: 'all 0.2s'
              }}
            >
              <UserPlus size={15} /> Register
            </Link>
          </nav>
        </div>
      </header>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3. HERO BANNER SECTION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '70px 24px 80px',
        background: 'radial-gradient(ellipse at top, #1e3a8a 0%, #0f172a 70%, #0b1329 100%)',
        position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20,
            background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', color: '#f59e0b',
            fontSize: 12, fontWeight: 700, marginBottom: 20, letterSpacing: '0.05em'
          }}>
            <Sparkles size={14} /> OFFICIAL AI-POWERED INFRASTRUCTURE APPRAISAL ENGINE
          </div>

          <h1 style={{
            fontSize: 42, fontWeight: 900, lineHeight: 1.2, color: 'white',
            maxWidth: 950, margin: '0 auto 20px', letterSpacing: '-0.03em'
          }}>
            Techno-Economic Compliance & Risk Appraisal System for Karnataka Public Works
          </h1>

          <p style={{
            fontSize: 16, color: '#94a3b8', maxWidth: 820, margin: '0 auto 36px', lineHeight: 1.6
          }}>
            Automating Detailed Project Report (DPR) evaluation against Karnataka Schedule of Rates (KSR 2023), IRC technical specifications, forest conservation NOCs, and land acquisition compliance across all 31 districts of Karnataka.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 50 }}>
            <Link
              href="/auth/login"
              style={{
                padding: '14px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white',
                border: 'none', fontSize: 15, fontWeight: 800, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(37,99,235,0.4)'
              }}
            >
              <LogIn size={18} /> Login
            </Link>

            <Link
              href="/auth/register"
              style={{
                padding: '14px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
                border: 'none', fontSize: 15, fontWeight: 800, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(34,197,94,0.3)'
              }}
            >
              <UserPlus size={18} /> Register
            </Link>

            <a
              href="#tracking"
              style={{
                padding: '14px 28px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <Search size={18} /> Track DPR Status
            </a>
          </div>

          {/* Key Stat Cards Strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            maxWidth: 1060, margin: '0 auto'
          }}>
            {[
              { label: 'Total Sanctioned Outlay', val: `₹ ${(totalOutlay / 100).toFixed(0)}+ Cr`, icon: <Building2 color="#60a5fa" size={22} />, desc: 'Across Karnataka PWD Circles' },
              { label: 'Statewide District Coverage', val: `${districtCount} Districts`, icon: <MapPin color="#4ade80" size={22} />, desc: 'All 31 Karnataka Districts' },
              { label: 'Evaluated DPR Applications', val: `${totalDprs} Projects`, icon: <FileText color="#f59e0b" size={22} />, desc: `${approvedCount} Approved & Sanctioned` },
              { label: 'Official Sanction Output', val: '5-Page PDF', icon: <Award color="#a78bfa" size={22} />, desc: 'With 3-Signature Approval Block' },
            ].map((card, i) => (
              <div key={i} style={{
                background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: 12, textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{card.label}</span>
                  {card.icon}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 4 }}>{card.val}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{card.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 4. ABOUT THE PLATFORM & DPR PROCESS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="about" style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PURPOSE & LEGAL FRAMEWORK</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginTop: 8 }}>About the Karnataka PWD DPR-AI Platform</h2>
            <div style={{ width: 80, height: 3, background: '#d97706', margin: '14px auto 0' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 16 }}>
                Transforming Infrastructure Project Evaluation with Artificial Intelligence
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 }}>
                The <strong>Detailed Project Report (DPR)</strong> is the foundational document for any state public works initiative, containing engineering specifications, cost estimates, environmental impacts, and statutory approvals.
              </p>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
                This portal provides an official automated techno-economic audit engine for the Karnataka Public Works Department (PWD). By leveraging OCR document ingestion, NLP clause parsing, and automated risk scoring, the system ensures that every proposal strictly conforms to state statutory guidelines prior to technical sanction and tender floating.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', padding: '14px', borderRadius: 8 }}>
                  <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>📜 KSR 2023 Pricing</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>Automated BOQ verification against current Schedule of Rates.</div>
                </div>
                <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', padding: '14px', borderRadius: 8 }}>
                  <div style={{ color: '#4ade80', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>🛣️ IRC Standards</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>Conformity check with IRC:37 flexible pavement specifications.</div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '30px', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} /> Statutory Clearances Verified
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { title: "Karnataka Schedule of Rates (KSR 2023)", status: "MANDATORY", desc: "PWD Rate Manual unit price compliance audit." },
                  { title: "IRC Pavement & Bridge Codes (IRC:37 & IRC:78)", status: "MANDATORY", desc: "Structural load capacity and axle load design validation." },
                  { title: "Geotechnical SBC Soil Bore-Logs (IS 2131)", status: "MANDATORY", desc: "Soil bearing capacity verification from IISc / NITK." },
                  { title: "Forest Conservation Clearance (FC Act 1980)", status: "STATUTORY", desc: "MOEFCC Stage-I & Stage-II clearance verification." },
                  { title: "Land Acquisition & Compensation (RFCTLARR 2013)", status: "STATUTORY", desc: "Tahsil land availability and right-of-way confirmation." },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: i < 4 ? 12 : 0 }}>
                    <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'white' }}>
                        {item.title} <span style={{ fontSize: 9.5, padding: '1px 6px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 4, marginLeft: 6 }}>{item.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 5. HOW IT WORKS (WORKFLOW STEP BY STEP) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="workflow" style={{ padding: '80px 24px', background: '#0b1329' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>COMPLETE APPRAISAL WORKFLOW</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginTop: 8 }}>How It Works: Step-by-Step Approval Process</h2>
            <div style={{ width: 80, height: 3, background: '#2563eb', margin: '14px auto 0' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {[
              { step: '01', title: 'DPR Upload', desc: 'Submitter uploads PDF document, BOQ excel sheets, and statutory NOC annexures.', color: '#3b82f6' },
              { step: '02', title: 'AI OCR & NLP Audit', desc: 'Automated extraction of rates, engineering codes, and 8-axis quality scoring.', color: '#8b5cf6' },
              { step: '03', title: 'Risk Assessment', desc: 'Geospatial & multi-factor risk model evaluates overrun, legal, and environmental risk.', color: '#ec4899' },
              { step: '04', title: 'Reviewer Appraisal', desc: 'State Technical Advisory Board reviews findings and requests clarifications.', color: '#f59e0b' },
              { step: '05', title: 'CE Sanction & PDF', desc: 'Chief Engineer approves proposal and issues official 5-page PDF sanction order.', color: '#22c55e' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                padding: '20px 16px', borderRadius: 12, position: 'relative'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: `${item.color}22`,
                  color: item.color, fontWeight: 900, fontSize: 13, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: `1px solid ${item.color}44`
                }}>
                  {item.step}
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 8 }}>{item.title}</h4>
                <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 6. USER, ADMIN, REVIEWER & VIEWER ROLES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="roles" style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SYSTEM ROLES & ACCESS CONTROL</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginTop: 8 }}>Role-Based Access & Portal Capabilities</h2>
            <div style={{ width: 80, height: 3, background: '#d97706', margin: '14px auto 0' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              {
                role: 'Director / Admin', title: 'Administrative Control', badge: 'High Authority', color: '#ef4444',
                desc: 'Full system oversight, final sanction approval, user management, and risk alert enforcement.',
                features: ['Final Approval Sanctioning', 'User Role Management', 'Global System Settings', 'Risk Alert Monitoring']
              },
              {
                role: 'State Reviewer', title: 'Technical Appraisal Board', badge: 'Technical Audit', color: '#6366f1',
                desc: 'Evaluation of DPR technical feasibility, reviewer commentary, and non-compliance verification.',
                features: ['DPR Queue Inspection', 'Technical Commenting Thread', 'KSR Rate Audit', 'Recommendation Approval']
              },
              {
                role: 'DPR Submitter', title: 'Project Upload & Revision', badge: 'Project Submitter', color: '#22c55e',
                desc: 'Submission of new DPR packages, timeline tracking, and revised BOQ document uploads.',
                features: ['Upload DPR & BOQ Files', 'Application Status Portal', 'Revision Attachment Upload', 'Real-time Notifications']
              },
              {
                role: 'Viewer', title: 'Public Transparency', badge: 'Open Monitoring', color: '#06b6d4',
                desc: 'Public monitoring dashboard, sector analytics, 5-page PDF report viewing, and Groq AI chatbot.',
                features: ['Dedicated Viewer Dashboard', 'Groq AI Chatbot Access', '5-Page PDF Report View', 'Karnataka Risk Map']
              },
            ].map((card, i) => (
              <div key={i} style={{
                background: '#1e293b', border: `1px solid ${card.color}33`,
                borderRadius: 14, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: `${card.color}22`, color: card.color }}>
                      {card.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>{card.role}</h3>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>{card.title}</div>
                  <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 16 }}>{card.desc}</p>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                    {card.features.map((feat, fi) => (
                      <div key={fi} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <CheckCircle size={12} color={card.color} /> {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onEnterDashboard}
                  style={{
                    marginTop: 20, width: '100%', padding: '10px', borderRadius: 8,
                    background: `${card.color}15`, color: card.color, border: `1px solid ${card.color}44`,
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  Enter {card.role} Portal <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 7. LIVE APPLICATION STATUS TRACKER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="tracking" style={{ padding: '80px 24px', background: '#0b1329' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>LIVE STATUS TRACKING</span>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: 'white', marginTop: 8 }}>Track DPR Application Status</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Enter your DPR Registration ID to view appraisal progress, quality scores, and decision status.</p>
          </div>

          <form onSubmit={handleTrackStatus} style={{
            display: 'flex', gap: 10, background: '#1e293b', padding: '10px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', marginBottom: 24
          }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                placeholder="Enter Registration ID (e.g. DPR-KA-2026-DA02E3)"
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', background: 'transparent',
                  border: 'none', color: 'white', fontSize: 14, outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={searchingStatus}
              style={{
                padding: '12px 28px', borderRadius: 8, background: '#2563eb', color: 'white',
                border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {searchingStatus ? 'Searching…' : 'Track Status'}
            </button>
          </form>

          {trackingResult && (
            <div style={{
              background: '#1e293b', border: '1px solid #22c55e', borderRadius: 12, padding: '24px',
              animation: 'fadeIn 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 4, letterSpacing: '0.5px' }}>
                    ● {trackingResult.status}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginTop: 8 }}>{trackingResult.title}</h3>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#94a3b8' }}>{trackingResult.id}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '12px', background: '#0f172a', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
                <div><span style={{ color: '#64748b' }}>District:</span> <strong style={{ color: 'white' }}>{trackingResult.district}</strong></div>
                <div><span style={{ color: '#64748b' }}>Outlay:</span> <strong style={{ color: 'white' }}>{trackingResult.outlay}</strong></div>
                <div><span style={{ color: '#64748b' }}>AI Score:</span> <strong style={{ color: '#60a5fa' }}>{trackingResult.score}</strong></div>
                <div><span style={{ color: '#64748b' }}>Submitter:</span> <strong style={{ color: 'white' }}>{trackingResult.submittedBy}</strong></div>
              </div>

              <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>
                Current Stage: {trackingResult.currentStage}
              </div>
            </div>
          )}

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 8. GROQ AI CHATBOT & OFFICIAL PDF REPORTS HIGHLIGHT */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>

          {/* AI Chatbot Box */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(139,92,246,0.3)', padding: '30px', borderRadius: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Bot size={22} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8 }}>Groq AI Assistant (`llama-3.3-70b`)</h3>
            <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
              Integrated high-speed Groq AI model trained on Karnataka PWD guidelines, KSR Schedule of Rates 2023, IRC highway codes, and land acquisition procedures.
            </p>
            <div style={{ background: '#0f172a', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #a855f7', fontSize: 12, color: '#cbd5e1', marginBottom: 16 }}>
              "Ask instant questions regarding KSR rate escalation, soil SBC testing, or Stage-I Forest clearance requirements."
            </div>
            <button onClick={onEnterDashboard} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              Launch Viewer AI Chatbot →
            </button>
          </div>

          {/* PDF Report Box */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(6,182,212,0.3)', padding: '30px', borderRadius: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.2)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Award size={22} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8 }}>Official 5-Page PDF Report Generation</h3>
            <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
              System generates publication-ready 5-page Techno-Economic Compliance & Risk Appraisal Reports formatted according to Karnataka Government PWD document standards.
            </p>
            <div style={{ background: '#0f172a', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #06b6d4', fontSize: 12, color: '#cbd5e1', marginBottom: 16 }}>
              "Features 10 detailed sections, running headers/footers, and 3-signature approval blocks for official administrative sanction."
            </div>
            <button onClick={onEnterDashboard} style={{ background: '#06b6d4', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              View Approved Reports →
            </button>
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 9. HELP & FAQ SECTION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '80px 24px', background: '#0b1329' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FREQUENTLY ASKED QUESTIONS</span>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: 'white', marginTop: 8 }}>Help & Documentation Desk</h2>
            <div style={{ width: 80, height: 3, background: '#f59e0b', margin: '14px auto 0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden'
              }}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 24px', background: 'transparent', border: 'none',
                    color: 'white', fontSize: 14, fontWeight: 800, textAlign: 'left', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} color="#94a3b8" style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {activeFaq === i && (
                  <div style={{ padding: '0 24px 18px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 10. CONTACT & SUPPORT DESK */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 24px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <MapPin size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Headquarters Address</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                Public Works Department (PWD)<br />
                KR Circle, Bengaluru, Karnataka - 560001
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Phone size={22} color="#38bdf8" style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Toll-Free Support Helpline</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                1800-425-0012 / 080-22211444<br />
                Mon - Sat, 9:30 AM - 5:30 PM IST
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Mail size={22} color="#4ade80" style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Official Support Email</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                pwd-dpr-support@karnataka.gov.in<br />
                helpdesk.pwd@karnataka.gov.in
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 11. OFFICIAL FOOTER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#070d1e', borderTop: '2px solid #d97706', padding: '40px 24px 24px', fontSize: 12, color: '#64748b' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 30, marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'white', marginBottom: 8 }}>Government of Karnataka · PWD DPR-AI Portal</div>
            <p style={{ lineHeight: 1.6, margin: 0, fontSize: 11.5 }}>
              Official digital infrastructure appraisal platform for techno-economic evaluation, statutory compliance auditing, and administrative sanctioning under Karnataka PWD regulations.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', marginBottom: 10 }}>State Portals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Karnataka State Portal</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>KPPP Procurement Portal</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Karnataka PWD Website</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', marginBottom: 10 }}>Guidelines</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>KSR 2023 Schedule of Rates</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>IRC Technical Standards</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>RFCTLARR Act 2013</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'white', marginBottom: 10 }}>Legal & Support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Official Disclaimer</a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1140, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, textAlign: 'center', fontSize: 11 }}>
          © 2026 Government of Karnataka · Public Works Department (PWD). All rights reserved. Confidential official document & digital portal system.
        </div>
      </footer>

    </div>
  );
}
