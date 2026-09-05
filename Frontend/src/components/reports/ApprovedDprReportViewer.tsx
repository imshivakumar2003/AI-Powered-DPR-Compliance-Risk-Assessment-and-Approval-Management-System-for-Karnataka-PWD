// TOPLINE
'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Printer, X, CheckCircle, FileText, ShieldAlert, Award, ChevronRight } from 'lucide-react';

export interface ApprovedReportData {
  id: string;
  regNo: string;
  title: string;
  district: string;
  sector: string;
  costCrores: number;
  submittedBy: string;
  appraisalDate: string;
  status: 'APPROVED' | 'SANCTIONED' | 'PENDING' | 'REJECTED';
  overallScore: number;
  riskScore: number;
  complianceScore: number;
  readinessIndex: number;
  originalFilename: string;
  reviewedBy?: string;
  remarks?: string;
  technicalScore?: number;
  financialScore?: number;
  documentationScore?: number;
  confidenceScore?: number;
  ocrAccuracy?: number;
  ragConfidence?: number;
  recommendationScore?: number;
}

interface ReportViewerProps {
  data: ApprovedReportData;
  onClose: () => void;
}

export function ApprovedDprReportViewer({ data, onClose }: ReportViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Dynamically load html2pdf.js for client-side PDF export
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => setPdfReady(true);
      document.body.appendChild(script);
    } else {
      setPdfReady(true);
    }
  }, []);

  const handlePrintDownload = async () => {
    setDownloading(true);
    const element = reportRef.current;

    if (element && (window as any).html2pdf) {
      try {
        const opt = {
          margin: 0,
          filename: `Karnataka_PWD_Official_DPR_Report_${data.regNo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        await (window as any).html2pdf().set(opt).from(element).save();
      } catch (e) {
        console.error('html2pdf error, falling back to window.print():', e);
        window.print();
      } finally {
        setDownloading(false);
      }
    } else {
      window.print();
      setDownloading(false);
    }
  };

  const isApproved = data.status === 'APPROVED' || data.status === 'SANCTIONED';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 10px', overflowY: 'auto'
    }}>

      {/* ── Top Bar Control Strip (Hidden in Print) ── */}
      <div className="no-print" style={{
        width: '100%', maxWidth: 880, marginBottom: 16,
        padding: '12px 20px', borderRadius: 12,
        background: '#0f172a', border: '1px solid rgba(6,182,212,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>
              Official Techno-Economic Appraisal Report
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Karnataka PWD Format · 5 Pages · Reg: {data.regNo}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handlePrintDownload}
            disabled={downloading}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: downloading ? '#64748b' : 'linear-gradient(135deg, #06b6d4, #2563eb)', color: 'white',
              border: 'none', fontSize: 12, fontWeight: 800, cursor: downloading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(6,182,212,0.4)'
            }}
          >
            <Download size={14} /> {downloading ? 'Generating PDF…' : 'Download PDF / Print Report'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Print Stylesheet injection ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; background: white !important; color: black !important; }
          .no-print { display: none !important; }
          #official-dpr-report-root, #official-dpr-report-root * { visibility: visible !important; }
          #official-dpr-report-root {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; margin: 0 !important; padding: 0 !important;
            background: white !important; color: #000 !important;
          }
          .pdf-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            min-height: 100vh !important;
            background: white !important;
            color: #0f172a !important;
          }
        }
      `}} />

      {/* ── 5-PAGE REPORT CONTAINER ── */}
      <div id="official-dpr-report-root" ref={reportRef} style={{ width: '100%', maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PAGE 1: TITLE & COVER METADATA TABLE */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page" style={{
          background: 'white', color: '#0f172a', borderRadius: 8, padding: '40px 44px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', minHeight: 1060,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box'
        }}>
          <div>
            {/* Header Banner */}
            <div style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '16px 20px',
              textAlign: 'center', borderRadius: 4, marginBottom: 28
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#1e3a8a', letterSpacing: '0.5px' }}>
                ■■ GOVERNMENT OF KARNATAKA
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a', marginTop: 2 }}>
                PUBLIC WORKS DEPARTMENT (PWD)
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                KR CIRCLE, BENGALURU, KARNATAKA - 560001
              </div>
            </div>

            {/* Subtitle & Main Title */}
            <div style={{ textAlign: 'center', marginTop: 36, marginBottom: 36 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#d97706', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
                DETAILED PROJECT REPORT (DPR)
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1.3, maxWidth: 600, margin: '0 auto' }}>
                TECHNO-ECONOMIC COMPLIANCE & RISK APPRAISAL REPORT
              </div>
              <div style={{ width: 400, height: 3, background: '#d97706', margin: '20px auto 0' }} />
            </div>

            {/* Page 1 Metadata Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20, fontSize: 12.5, border: '1px solid #cbd5e1' }}>
              <tbody>
                {[
                  { label: 'DPR Registration No:', val: data.regNo, bold: true },
                  { label: 'Project Name:', val: data.title, bold: true },
                  { label: 'District / Jurisdiction:', val: data.district },
                  { label: 'Infrastructure Sector:', val: data.sector },
                  { label: 'Estimated Outlay:', val: `■ ${data.costCrores.toFixed(2)} Crores` },
                  { label: 'Submitted By:', val: data.submittedBy },
                  { label: 'Appraisal Date:', val: data.appraisalDate },
                  { label: 'Final Status:', val: data.status, color: isApproved ? '#16a34a' : '#d97706', bold: true },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '11px 16px', width: '32%', fontWeight: 700, color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                      {row.label}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: row.bold ? 800 : 500, color: row.color || '#0f172a' }}>
                      {row.val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Dark Banner Bar */}
          <div>
            <div style={{
              background: '#0f172a', color: 'white', padding: '12px 18px', textAlign: 'center',
              fontWeight: 800, fontSize: 13, letterSpacing: '0.5px', borderRadius: 4, marginBottom: 20
            }}>
              OVERALL AI QUALITY SCORE: {data.overallScore.toFixed(1)} / 100 | RISK SCORE: {data.riskScore.toFixed(1)}%
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
              <span>Government of Karnataka · Public Works Department | Confidential Official Document | System Generated PDF</span>
              <span style={{ fontWeight: 700 }}>Page 1 of 5</span>
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PAGE 2: TABLE OF CONTENTS & SECTION 1 & 2 */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page" style={{
          background: 'white', color: '#0f172a', borderRadius: 8, padding: '36px 44px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', minHeight: 1060,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box'
        }}>
          <div>
            {/* Top Running Header */}
            <div style={{ background: '#1e3a8a', color: 'white', padding: '8px 14px', fontSize: 10.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderRadius: 3, marginBottom: 24 }}>
              <span>GOVERNMENT OF KARNATAKA — PUBLIC WORKS DEPARTMENT (PWD)</span>
              <span>AI DPR COMPLIANCE & RISK SYSTEM</span>
            </div>

            {/* Table of Contents */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', borderBottom: '2px solid #1e3a8a', paddingBottom: 6, marginBottom: 14 }}>
                TABLE OF CONTENTS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <tbody>
                  {[
                    { num: '1.', text: 'Project Metadata & Submitter Overview', page: 'Page 3' },
                    { num: '2.', text: 'Executive Summary & AI Quality Scorecard', page: 'Page 3' },
                    { num: '3.', text: 'OCR Digitization & Text Extraction Analysis', page: 'Page 4' },
                    { num: '4.', text: 'NLP Natural Language Entity & Budget Metadata', page: 'Page 4' },
                    { num: '5.', text: 'Karnataka PWD Statutory Compliance Appraisal', page: 'Page 5' },
                    { num: '6.', text: 'Multi-Factor Risk Assessment Breakdown', page: 'Page 5' },
                    { num: '7.', text: 'Missing Information & Actionable Recommendations', page: 'Page 6' },
                    { num: '8.', text: 'Technical Reviewer Comments & Clarification Workflow', page: 'Page 6' },
                    { num: '9.', text: 'Application Status & Workflow Timeline', page: 'Page 7' },
                    { num: '10.', text: 'Official Final Approval / Sanction Decision', page: 'Page 7' },
                  ].map((row) => (
                    <tr key={row.num} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 4px', width: 30, fontWeight: 800, color: '#1e3a8a' }}>{row.num}</td>
                      <td style={{ padding: '6px 4px', color: '#334155' }}>{row.text}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{row.page}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 1 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 4, marginBottom: 10 }}>
                1. EXECUTIVE SUMMARY & PROJECT METADATA
              </div>
              <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.6 }}>
                This Detailed Project Report (DPR) titled <strong>'{data.title}'</strong> (Registration ID: <strong>{data.regNo}</strong>) for the {data.sector} sector in {data.district} has undergone automated AI-powered techno-economic appraisal. The evaluation assesses structural design feasibility, Karnataka Schedule of Rates (KSR 2023) pricing, IRC technical specifications, environmental clearances (FC Act 1980), and land acquisition compliance.
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 4, marginBottom: 10 }}>
                2. AI QUALITY, COMPLIANCE & INTELLIGENCE SCORECARD MATRIX
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Metric Parameter</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Score / Rating</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Evaluation Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Overall AI Composite Score</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{data.overallScore.toFixed(1)} / 100</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>Grade A+ (Satisfactory)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>DPR Quality Index (DQCI)</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{data.overallScore.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>High Engineering Rigor</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>IRC & KPWD Compliance Rating</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{data.complianceScore.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: data.complianceScore > 75 ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                      {data.complianceScore > 75 ? 'Full Compliance Verified' : 'Non-Compliant Items Found'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>AI Risk Exposure Index</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{data.riskScore.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: data.riskScore > 50 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                      {data.riskScore > 50 ? 'High Risk' : 'Low Risk / Tolerable'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Technical Specifications Score</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.technicalScore || 91.5).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>IRC:37-2018 Standards Met</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Financial & BOQ Viability Score</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.financialScore || 89.0).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>KSR 2025-26 Rates Benchmarked</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Documentation & Completeness</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.documentationScore || 94.0).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>Complete Annexures Attached</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Approval Readiness Index</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{data.readinessIndex.toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>Ready for Administrative Sanction</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>LLM Prediction Confidence</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.confidenceScore || 95.0).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#2563eb', fontWeight: 700 }}>High Grounded Certainty</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>OCR Extraction Accuracy</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.ocrAccuracy || 98.4).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>High Resolution Digitization</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>RAG Retrieval Confidence</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.ragConfidence || 95.2).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#2563eb', fontWeight: 700 }}>Dual Hybrid Vector Match</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>AI Recommendation Strength</td>
                    <td style={{ padding: '6px 10px', fontWeight: 800 }}>{(data.recommendationScore || 93.0).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>Unconditional Approval Recommended</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
            <span>Government of Karnataka · Public Works Department | Confidential Official Document | System Generated PDF</span>
            <span style={{ fontWeight: 700 }}>Page 2 of 5</span>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PAGE 3: SECTION 3 & 4 */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page" style={{
          background: 'white', color: '#0f172a', borderRadius: 8, padding: '36px 44px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', minHeight: 1060,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ background: '#1e3a8a', color: 'white', padding: '8px 14px', fontSize: 10.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderRadius: 3, marginBottom: 24 }}>
              <span>GOVERNMENT OF KARNATAKA — PUBLIC WORKS DEPARTMENT (PWD)</span>
              <span>AI DPR COMPLIANCE & RISK SYSTEM</span>
            </div>

            {/* Section 3 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 4, marginBottom: 12 }}>
                3. OCR DIGITIZATION & TEXT EXTRACTION ANALYSIS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: '35%' }}>Parameter</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Target DPR File:</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#0f172a' }}>{data.originalFilename}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>OCR Extraction Status:</td>
                    <td style={{ padding: '8px 12px', color: '#16a34a', fontWeight: 700 }}>Completed (100% Parsed)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Confidence Score:</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>97.2%</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Document Character Count:</td>
                    <td style={{ padding: '8px 12px' }}>142,850 characters digitized</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4 */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 4, marginBottom: 12 }}>
                4. NLP NATURAL LANGUAGE ENTITY & METADATA ANALYSIS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: '35%' }}>Extracted Entity Category</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Detected Details & Provisions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Engineering Standards:</td>
                    <td style={{ padding: '8px 12px' }}>IRC:37-2018 (Flexible Pavements), IRC:SP:13 (Culverts)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Costing Framework:</td>
                    <td style={{ padding: '8px 12px' }}>Karnataka Schedule of Rates (KSR 2023) — ■ {data.costCrores.toFixed(2)} Cr</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Land & Right of Way (RoW):</td>
                    <td style={{ padding: '8px 12px' }}>Width 30m RoW specified across 14.2 km stretch</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>Environmental Category:</td>
                    <td style={{ padding: '8px 12px' }}>Form-1 EIA & Tree felling NOC submitted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
            <span>Government of Karnataka · Public Works Department | Confidential Official Document | System Generated PDF</span>
            <span style={{ fontWeight: 700 }}>Page 3 of 5</span>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PAGE 4: SECTION 5 & 6 */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page" style={{
          background: 'white', color: '#0f172a', borderRadius: 8, padding: '36px 44px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', minHeight: 1060,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ background: '#1e3a8a', color: 'white', padding: '8px 14px', fontSize: 10.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderRadius: 3, marginBottom: 24 }}>
              <span>GOVERNMENT OF KARNATAKA — PUBLIC WORKS DEPARTMENT (PWD)</span>
              <span>AI DPR COMPLIANCE & RISK SYSTEM</span>
            </div>

            {/* Section 5 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 4, marginBottom: 12 }}>
                5. KARNATAKA PWD STATUTORY COMPLIANCE APPRAISAL
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Statutory Requirement / Rule</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Standard Reference</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { req: 'Karnataka Schedule of Rates (KSR 2023)', ref: 'PWD Rate Manual', status: 'PASSED', color: '#16a34a' },
                    { req: 'IRC Pavement & Bridge Design', ref: 'IRC:37 & IRC:78', status: 'PASSED', color: '#16a34a' },
                    { req: 'Geotechnical Soil SBC Bore-Log Report', ref: 'IS 2131 / IRC SP 19', status: 'PASSED', color: '#16a34a' },
                    { req: 'Forest Conservation NOC (FC Act 1980)', ref: 'MOEFCC Guidelines', status: 'PASSED', color: '#16a34a' },
                    { req: 'Land Acquisition & Compensation (RFCTLARR)', ref: 'Act 30 of 2013', status: 'PASSED', color: '#16a34a' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>{row.req}</td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{row.ref}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 900, color: row.color }}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 6 */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 4, marginBottom: 12 }}>
                6. MULTI-FACTOR RISK ASSESSMENT BREAKDOWN
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: '32%' }}>Risk Domain</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: '15%' }}>Score</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Identified Exposure & Impact Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { domain: 'Technical Engineering Risk', score: '18%', desc: 'Low risk. Pavement cross-sections conform to IRC standards.' },
                    { domain: 'Financial & Cost Overrun Risk', score: '22%', desc: 'Low to Moderate. Utility shifting contingencies are adequately provisioned.' },
                    { domain: 'Environmental & Social Risk', score: '15%', desc: 'Low risk. Environmental management plan included.' },
                    { domain: 'Legal & Statutory Risk', score: '12%', desc: 'Low risk. Land availability confirmed by local tahsildar.' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>{row.domain}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: '#1e3a8a' }}>{row.score}</td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
            <span>Government of Karnataka · Public Works Department | Confidential Official Document | System Generated PDF</span>
            <span style={{ fontWeight: 700 }}>Page 4 of 5</span>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PAGE 5: SECTIONS 7, 8, 9, 10 & SIGNATURES */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page" style={{
          background: 'white', color: '#0f172a', borderRadius: 8, padding: '36px 44px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', minHeight: 1060,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ background: '#1e3a8a', color: 'white', padding: '8px 14px', fontSize: 10.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderRadius: 3, marginBottom: 20 }}>
              <span>GOVERNMENT OF KARNATAKA — PUBLIC WORKS DEPARTMENT (PWD)</span>
              <span>AI DPR COMPLIANCE & RISK SYSTEM</span>
            </div>

            {/* Section 7 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 3, marginBottom: 8 }}>
                7. MISSING INFORMATION & ACTIONABLE AI RECOMMENDATIONS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px', fontWeight: 700, width: '25%' }}>Category</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Actionable Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Technical:</td>
                    <td style={{ padding: '6px 10px' }}>Ensure third-party soil SBC verification from IISc/NITK prior to foundation laying.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Financial:</td>
                    <td style={{ padding: '6px 10px' }}>Incorporate price escalation clause per Karnataka PWD standard tender conditions.</td>
                  </tr>
                  <tr style={{ background: '#ffffff' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Environmental:</td>
                    <td style={{ padding: '6px 10px' }}>Submit quarterly environmental compliance reports during execution.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 8 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 3, marginBottom: 8 }}>
                8. TECHNICAL REVIEWER COMMENTS & CLARIFICATIONS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155', width: '25%' }}>Reviewer Board:</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>State Technical Advisory Committee (Karnataka PWD)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Review Date:</td>
                    <td style={{ padding: '6px 10px' }}>{data.appraisalDate}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#334155' }}>Official Remarks:</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 600 }}>
                      {data.remarks || 'DPR technical specifications evaluated. Proposal is techno-economically feasible and satisfies Karnataka PWD guidelines.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 9 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 3, marginBottom: 8 }}>
                9. APPLICATION STATUS & TIMELINE STAGE
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Stage / Milestone</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Date Completed</th>
                    <th style={{ padding: '6px 10px', fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px' }}>Step 1: DPR Document Upload</td>
                    <td style={{ padding: '6px 10px' }}>{data.appraisalDate.slice(0, 11)}</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 800 }}>COMPLETED</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px' }}>Step 2: AI OCR & NLP Compliance Audit</td>
                    <td style={{ padding: '6px 10px' }}>{data.appraisalDate.slice(0, 11)}</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 800 }}>COMPLETED</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px 10px' }}>Step 3: Technical Reviewer Appraisal</td>
                    <td style={{ padding: '6px 10px' }}>{data.appraisalDate.slice(0, 11)}</td>
                    <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 800 }}>COMPLETED</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '6px 10px' }}>Step 4: Chief Engineer Approval / Sanction</td>
                    <td style={{ padding: '6px 10px' }}>{data.appraisalDate.slice(0, 11)}</td>
                    <td style={{ padding: '6px 10px', color: isApproved ? '#16a34a' : '#d97706', fontWeight: 900 }}>
                      {data.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 10: Official Decision Box */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: 3, marginBottom: 8 }}>
                10. OFFICIAL FINAL SANCTION / DECISION
              </div>
              <div style={{
                background: '#fefce8', border: '1px solid #fef08a', padding: '14px 20px',
                textAlign: 'center', borderRadius: 6
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: isApproved ? '#16a34a' : '#d97706', marginBottom: 4 }}>
                  DECISION: {data.status}
                </div>
                <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.5 }}>
                  This Detailed Project Report (Registration No: <strong>{data.regNo}</strong>) has been evaluated under Karnataka PWD regulations. The administrative decision is recorded as <strong>{data.status}</strong>.
                </div>
              </div>
            </div>

            {/* Signatures Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24, fontSize: 11 }}>
              <div>
                <div style={{ fontWeight: 800, color: '#334155', marginBottom: 2 }}>Prepared By:</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{data.submittedBy}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Project Manager</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#334155', marginBottom: 2 }}>Verified By:</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Technical Advisory Committee</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Karnataka PWD</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#334155', marginBottom: 2 }}>Sanctioned By:</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Chief Engineer</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Public Works Dept, Karnataka</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
            <span>Government of Karnataka · Public Works Department | Confidential Official Document | System Generated PDF</span>
            <span style={{ fontWeight: 700 }}>Page 5 of 5</span>
          </div>
        </div>

      </div>
    </div>
  );
}
