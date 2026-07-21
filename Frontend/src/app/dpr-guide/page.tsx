// TOPLINE

'use client';
import { Topbar } from '@/components/layout/Topbar';
import Link from 'next/link';

const STEPS = [
  {
    phase: 'Phase 1',
    title: 'Concept Note & Initial Proposal',
    color: '#6366f1',
    items: [
      { step: 'Identify the project need — Infrastructure gap analysis for the NE state', mandatory: true },
      { step: 'Prepare a Concept Note with objectives, scope, and estimated budget', mandatory: true },
      { step: 'Get endorsement from the State Department / Implementing Agency', mandatory: true },
      { step: 'Submit Concept Note via the Poorvottar Vikas Setu Portal', mandatory: true },
    ],
  },
  {
    phase: 'Phase 2',
    title: 'DPR Preparation',
    color: '#8b5cf6',
    items: [
      { step: 'Conduct detailed Survey & Investigation (topographic, geotechnical, hydrological)', mandatory: true },
      { step: 'Prepare cost estimates based on latest Schedule of Rates (SoR) of the state', mandatory: true },
      { step: 'Include design drawings, BOQ, and specifications', mandatory: true },
      { step: 'Attach Environmental Impact Assessment (EIA) if project cost > ₹50 Cr', mandatory: false },
      { step: 'Include O&M cost projection for lifecycle (10-25 years)', mandatory: true },
      { step: 'Prepare Risk Assessment covering terrain, monsoon, and seismic factors', mandatory: true },
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Statutory Clearances & Certificates',
    color: '#f59e0b',
    items: [
      { step: 'Obtain Forest Clearance — NOC from State Forest Department (FCA 1980)', mandatory: true },
      { step: 'Obtain Land Availability Certificate from District Collector', mandatory: true },
      { step: 'Non-Duplication Certificate — Confirm project not covered by other central/state schemes', mandatory: true },
      { step: 'Wildlife Clearance if in eco-sensitive zone (MOEFCC)', mandatory: false },
      { step: 'Tribal Community FPIC if project area includes PESA/FRA areas', mandatory: false },
      { step: 'Obtain all other local permissions (PWD, Municipal, Railway crossing NOC etc.)', mandatory: true },
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Techno-Economic Appraisal',
    color: '#10b981',
    items: [
      { step: 'Commission Techno-Economic Appraisal from an institute of national repute (IIT/NIT/IIM)', mandatory: true },
      { step: 'Appraisal report must cover technical feasibility, financial viability, and socio-economic impact', mandatory: true },
      { step: 'Incorporate appraisal recommendations into the final DPR', mandatory: true },
    ],
  },
  {
    phase: 'Phase 5',
    title: 'State-Level Review & Submission',
    color: '#ef4444',
    items: [
      { step: 'Present DPR to the Network Planning Group (NPG) for alignment with PM GatiShakti', mandatory: true },
      { step: 'Get recommendation from Empowered Group of Secretaries (EGoS)', mandatory: true },
      { step: 'Place before the State Level Empowered Committee (SLEC) for approval', mandatory: true },
      { step: 'Submit final DPR + all annexures via Poorvottar Vikas Setu Portal to Karnataka PWD', mandatory: true },
    ],
  },
  {
    phase: 'Phase 6',
    title: 'Central Appraisal & Final Sanction',
    color: '#06b6d4',
    items: [
      { step: 'Karnataka PWD circulates DPR to relevant Central Ministries, NITI Aayog, and IFD for comments', mandatory: true },
      { step: 'Empowered Inter-Ministerial Committee (EIMC) evaluates and recommends', mandatory: true },
      { step: 'Competent Authority (Minister, Karnataka PWD) grants final approval', mandatory: true },
      { step: 'Administrative & Financial Sanction (AFS) issued in consultation with IFD', mandatory: true },
      { step: 'Fund release as per approved milestones — First installment within 30 days of AFS', mandatory: true },
    ],
  },
];

const KEY_REGULATIONS = [
  { name: 'PM-DevINE Scheme Guidelines, 2022', desc: 'Primary scheme for NE infrastructure under Karnataka PWD. Covers eligibility, funding pattern (90:10 Centre:State), and project categories.' },
  { name: 'NESIDS (Roads) Guidelines', desc: 'North East Special Infrastructure Development Scheme for road connectivity in hill states.' },
  { name: 'NESIDS (OTRI) Guidelines', desc: 'Covers Other Than Road Infrastructure — tourism, health, education, power, water supply projects.' },
  { name: 'Forest Conservation Act, 1980', desc: 'Mandatory clearance for any project involving forest land diversion. Compensatory afforestation required.' },
  { name: 'LARR Act, 2013', desc: 'Land Acquisition, Rehabilitation and Resettlement Act. Governs fair compensation and R&R for displaced persons.' },
  { name: 'EIA Notification, 2006 (MOEFCC)', desc: 'Environmental clearance required for specified categories of projects above threshold limits.' },
  { name: 'PESA Act, 1996 & FRA, 2006', desc: 'Panchayats (Extension to Scheduled Areas) Act. Requires Free, Prior & Informed Consent from tribal communities.' },
  { name: 'IS 1893:2016 — Seismic Design Code', desc: 'All NE states fall in Seismic Zone V. Mandatory compliance for all infrastructure projects.' },
  { name: 'PM GatiShakti National Master Plan', desc: 'All projects must be aligned with the national logistics and multimodal connectivity master plan.' },
];

const KARNATAKA_DISTRICTS: { district: string; requirements: string[] }[] = [
  { district: 'Bagalkot', requirements: ['Archaeological clearance near Badami/Pattadakal', 'Irrigation Department NOC', 'Mining permission (if applicable)', 'Agricultural land conversion approval', 'KSPCB consent'] },
  { district: 'Ballari', requirements: ['Mining Department approval', 'Environmental Impact Assessment (EIA)', 'Air pollution control compliance', 'Groundwater extraction permission', 'KSPCB consent'] },
  { district: 'Belagavi', requirements: ['Industrial pollution clearance', 'Highway/NHAI NOC (if applicable)', 'Agricultural land conversion', 'Groundwater permission', 'Fire Department NOC'] },
  { district: 'Bengaluru Rural', requirements: ['Agricultural land conversion approval', 'KIADB approval (industrial projects)', 'Groundwater extraction permission', 'Gram Panchayat building approval', 'KSPCB consent'] },
  { district: 'Bengaluru Urban', requirements: ['BBMP/BDA building approval', 'Airport height clearance (AAI)', 'Fire Department NOC', 'Traffic Impact Assessment', 'Rainwater harvesting compliance'] },
  { district: 'Bidar', requirements: ['Heritage monument protection clearance', 'Archaeological consultation', 'Groundwater extraction permission', 'Agricultural land conversion', 'KSPCB consent'] },
  { district: 'Chamarajanagar', requirements: ['Bandipur Eco-sensitive Zone clearance', 'Wildlife corridor assessment', 'Forest Department approval', 'Environmental clearance', 'KSPCB consent'] },
  { district: 'Chikkaballapur', requirements: ['Nandi Hills Eco-sensitive clearance', 'Groundwater assessment', 'Quarry/mining permission', 'Airport influence zone compliance', 'KSPCB consent'] },
  { district: 'Chikkamagaluru', requirements: ['Western Ghats compliance', 'Coffee estate land-use permission', 'Landslide risk assessment', 'Forest clearance', 'Wildlife clearance'] },
  { district: 'Chitradurga', requirements: ['Wind energy approval (if applicable)', 'Forest Department clearance', 'Wildlife movement assessment', 'Mining permission', 'Environmental clearance'] },
  { district: 'Dakshina Kannada (Mangaluru)', requirements: ['Coastal Regulation Zone (CRZ) clearance', 'Port Authority NOC', 'Fisheries Department approval', 'Flood risk assessment', 'KSPCB consent'] },
  { district: 'Davanagere', requirements: ['Industrial Area Development approval', 'Highway access permission', 'Water resource assessment', 'Agricultural land conversion', 'Fire Department NOC'] },
  { district: 'Dharwad', requirements: ['Industrial estate approval', 'Pollution Control Board consent', 'Highway access approval', 'Fire Department NOC', 'Land-use approval'] },
  { district: 'Gadag', requirements: ['Heritage conservation clearance', 'Agricultural land conversion', 'Mining approval', 'Water resource permission', 'KSPCB consent'] },
  { district: 'Hassan', requirements: ['Heritage monument clearance', 'Irrigation Department approval', 'Agricultural land conversion', 'Groundwater permission', 'Forest clearance (if applicable)'] },
  { district: 'Haveri', requirements: ['Highway/NHAI NOC', 'Irrigation Department approval', 'Agricultural land conversion', 'Water conservation plan', 'Fire Department NOC'] },
  { district: 'Kalaburagi', requirements: ['Industrial pollution clearance', 'Groundwater extraction permission', 'Agricultural land conversion', 'Fire safety approval', 'KSPCB consent'] },
  { district: 'Kodagu', requirements: ['Coffee plantation land conversion', 'Western Ghats environmental compliance', 'Landslide risk assessment', 'Forest Department clearance', 'Wildlife corridor approval'] },
  { district: 'Kolar', requirements: ['Groundwater extraction permission', 'Quarry/mining approval', 'Agricultural land conversion', 'Environmental clearance', 'KSPCB consent'] },
  { district: 'Koppal', requirements: ['Mining lease approval', 'Heritage site protection', 'Irrigation Department approval', 'Forest clearance', 'Environmental clearance'] },
  { district: 'Mandya', requirements: ['Cauvery basin water-use approval', 'Irrigation Department clearance', 'Agricultural land conversion', 'Water conservation compliance', 'KSPCB consent'] },
  { district: 'Mysuru', requirements: ['Heritage conservation clearance', 'Chamundi Hill Eco-sensitive compliance', 'Tourism Department consultation', 'Fire Department NOC', 'Traffic management approval'] },
  { district: 'Raichur', requirements: ['Thermal power environmental clearance', 'Irrigation project approval', 'Groundwater monitoring', 'Agricultural land conversion', 'KSPCB consent'] },
  { district: 'Ramanagara', requirements: ['Eco-sensitive hill zone compliance', 'Quarry/mining approval', 'Tourism Department consultation', 'Forest clearance', 'Environmental clearance'] },
  { district: 'Shivamogga', requirements: ['Forest Department clearance', 'Sharavathi Eco-sensitive compliance', 'Wildlife habitat assessment', 'Landslide risk assessment', 'Environmental clearance'] },
  { district: 'Tumakuru', requirements: ['Industrial corridor approval', 'KIADB approval', 'Highway access NOC', 'Groundwater extraction permission', 'Fire Department NOC'] },
  { district: 'Udupi', requirements: ['Coastal Regulation Zone (CRZ) clearance', 'Fisheries Department approval', 'Temple heritage protection', 'Coastal erosion assessment', 'Environmental clearance'] },
  { district: 'Uttara Kannada', requirements: ['Western Ghats Eco-sensitive clearance', 'Forest Department approval', 'Wildlife clearance', 'Coastal Regulation Zone (if coastal)', 'Landslide risk assessment'] },
  { district: 'Vijayapura', requirements: ['Heritage monument clearance', 'Archaeological consultation', 'Groundwater conservation measures', 'Agricultural land conversion', 'Fire Department NOC'] },
  { district: 'Vijayanagara', requirements: ['Mining lease compliance', 'Hampi heritage buffer clearance', 'Archaeological approval', 'Environmental clearance', 'KSPCB consent'] },
  { district: 'Yadgir', requirements: ['Irrigation Department approval', 'Agricultural land conversion', 'Groundwater extraction permission', 'Environmental clearance', 'Fire Department NOC'] },
];

export default function DprGuidePage() {
  return (
    <>
      <Topbar
        title="DPR Submission Guide"
        subtitle="Step-by-step process, government regulations & state-wise permissions"
        actions={
          <Link href="/" className="topbar-btn">
            ← Back to Dashboard
          </Link>
        }
      />
      <div className="page-content fade-in">
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 16, padding: '28px 32px', marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            📋 How to Prepare & Submit a DPR under Karnataka PWD Schemes
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 800 }}>
            This guide covers the complete lifecycle of a Detailed Project Report (DPR) — from concept note
            preparation to final Administrative & Financial Sanction (AFS) by the Ministry of Development of
            KARANATAKA PWD Follow these steps to ensure compliance with all government norms.
          </p>
        </div>

        {/* Steps Timeline */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
            🚀 Step-by-Step Submission Process
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STEPS.map((phase, pi) => (
              <div key={pi} className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
                  borderBottom: '1px solid var(--border-light)',
                  background: `linear-gradient(90deg, ${phase.color}08, transparent)`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: phase.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 14, flexShrink: 0,
                  }}>
                    {pi + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{phase.phase}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{phase.title}</div>
                  </div>
                </div>
                <div style={{ padding: '16px 24px' }}>
                  {phase.items.map((item, ii) => (
                    <div key={ii} style={{
                      display: 'flex', gap: 12, padding: '10px 0',
                      borderBottom: ii < phase.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
                        background: `${phase.color}15`, color: phase.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                      }}>
                        {ii + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {item.step}
                        </span>
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 6,
                          background: item.mandatory ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                          color: item.mandatory ? '#ef4444' : '#22c55e',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {item.mandatory ? 'Mandatory' : 'If Applicable'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regulations Table */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
            ⚖️ Key Government Regulations & Norms
          </h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Regulation / Guideline</th>
                  <th>Description & Applicability</th>
                </tr>
              </thead>
              <tbody>
                {KEY_REGULATIONS.map((reg, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{reg.name}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{reg.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Karnataka Districts Checklist */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
            🗺️ Karnataka Districts-Wise Additional Requirements
          </h3>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '22%', whiteSpace: 'nowrap' }}>District</th>
                  <th>Additional Requirements</th>
                </tr>
              </thead>
              <tbody>
                {KARNATAKA_DISTRICTS.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, verticalAlign: 'top', paddingTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', flexShrink: 0 }} />
                        {row.district}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.9, verticalAlign: 'top' }}>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {row.requirements.map((req, ri) => (
                          <li key={ri} style={{ fontWeight: 500 }}>{req}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Important links */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 16, padding: '24px 32px',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            🔗 Important Links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Karnataka PWD Official Website', url: 'https://Karnataka PWD.gov.in' },
              { label: 'Poorvottar Vikas Setu Portal', url: 'https://Karnataka PWD.gov.in' },
              { label: 'PM-DevINE Guidelines PDF', url: 'https://Karnataka PWD.gov.in' },
              { label: 'PM GatiShakti Portal', url: 'https://pmgatishakti.gov.in' },
            ].map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  border: '1px solid rgba(99,102,241,0.15)',
                  transition: 'all 0.2s',
                }}
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
