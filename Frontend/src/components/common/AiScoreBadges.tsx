// TOPLINE
'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Wrench,
  DollarSign,
  BookOpen,
  CheckCheck,
  X,
} from 'lucide-react';
import { DprAiScores, ScoreDetail, PageReference } from '@/lib/api';

export function getScoreTheme(score: number | null | undefined, isRisk = false) {
  if (score === null || score === undefined) {
    return {
      grade: 'N/A',
      color: 'var(--text-muted)',
      bg: 'rgba(100, 116, 139, 0.12)',
      border: 'rgba(100, 116, 139, 0.25)',
      label: 'Pending Analysis',
    };
  }

  // If calculating for raw Risk Score (where lower is better)
  if (isRisk) {
    if (score <= 40) {
      return {
        grade: 'Low Risk',
        color: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.12)',
        border: 'rgba(34, 197, 94, 0.3)',
        label: 'Safe',
      };
    } else if (score <= 70) {
      return {
        grade: 'Medium Risk',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        label: 'Moderate',
      };
    } else {
      return {
        grade: 'High Risk',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
        label: 'Critical Alert',
      };
    }
  }

  // Standard Performance & Quality Scale
  if (score >= 90) {
    return {
      grade: 'Excellent',
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(34, 197, 94, 0.3)',
      label: 'Grade A+ (Excellent)',
    };
  } else if (score >= 75) {
    return {
      grade: 'Good',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)',
      label: 'Grade B+ (Good)',
    };
  } else if (score >= 60) {
    return {
      grade: 'Moderate',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      label: 'Grade C (Moderate)',
    };
  } else {
    return {
      grade: 'Critical',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      label: 'Grade D (Critical Non-Compliance)',
    };
  }
}

/**
 * Single AI Score Badge with tooltip & color coding
 */
export function AiScoreBadge({
  score,
  label,
  size = 'md',
  showLabel = true,
  isRisk = false,
  tooltip,
}: {
  score: number | null | undefined;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isRisk?: boolean;
  tooltip?: string;
}) {
  const theme = getScoreTheme(score, isRisk);
  const sizeStyles = {
    xs: { padding: '2px 6px', fontSize: 10, numSize: 11, iconSize: 10 },
    sm: { padding: '3px 8px', fontSize: 11, numSize: 12, iconSize: 12 },
    md: { padding: '4px 10px', fontSize: 12, numSize: 13, iconSize: 13 },
    lg: { padding: '6px 14px', fontSize: 13, numSize: 16, iconSize: 15 },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: sizeStyles.padding,
        borderRadius: 6,
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.color,
        fontWeight: 600,
        fontSize: sizeStyles.fontSize,
        whiteSpace: 'nowrap',
      }}
      title={tooltip || `${label || 'AI Score'}: ${score != null ? `${score}%` : 'N/A'} (${theme.grade})`}
    >
      {showLabel && label && (
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}:
        </span>
      )}
      <span style={{ fontWeight: 700, fontSize: sizeStyles.numSize, color: theme.color }}>
        {score != null ? `${score}%` : '—'}
      </span>
    </span>
  );
}

/**
 * Compact horizontal strip displaying core 5 AI scores for DPR cards and tables
 */
export function DprScoreStrip({
  scores,
  size = 'sm',
  onOpenExplainability,
}: {
  scores: {
    overall_ai_score?: number | null;
    overall_score?: number | null;
    dpr_quality_score?: number | null;
    compliance_score?: number | null;
    risk_score?: number | null;
    technical_score?: number | null;
    approval_readiness_score?: number | null;
  };
  size?: 'xs' | 'sm' | 'md';
  onOpenExplainability?: () => void;
}) {
  const overall = scores.overall_ai_score ?? scores.overall_score ?? scores.dpr_quality_score;
  const quality = scores.dpr_quality_score ?? scores.overall_score;
  const comp = scores.compliance_score;
  const risk = scores.risk_score;
  const readiness = scores.approval_readiness_score;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {overall != null && (
        <AiScoreBadge score={overall} label="Overall AI" size={size} />
      )}
      {comp != null && (
        <AiScoreBadge score={comp} label="Compliance" size={size} />
      )}
      {risk != null && (
        <AiScoreBadge score={risk} label="Risk" size={size} isRisk={true} />
      )}
      {readiness != null && (
        <AiScoreBadge score={readiness} label="Readiness" size={size} />
      )}
      {onOpenExplainability && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenExplainability();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            display: 'inline-flex',
            alignItems: 'center',
          }}
          title="View Score Calculation Explainability & Citations"
        >
          <Info size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Confidence indicator chip for AI Chatbot and RAG Engine responses
 */
export function AiConfidenceChip({
  score,
  label = 'AI Confidence',
  sourceReliability = 98,
  documentRelevance = 95,
}: {
  score: number;
  label?: string;
  sourceReliability?: number;
  documentRelevance?: number;
}) {
  const theme = getScoreTheme(score);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 10px',
        borderRadius: 20,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
        <Sparkles size={12} color="#3b82f6" />
        {label}:
        <span style={{ color: theme.color, fontWeight: 700 }}>{score}%</span>
      </span>
      <span style={{ color: 'var(--border)' }}>|</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        Source Reliability: <strong style={{ color: '#22c55e' }}>{sourceReliability}%</strong>
      </span>
      <span style={{ color: 'var(--border)' }}>|</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        RAG Match: <strong style={{ color: '#3b82f6' }}>{documentRelevance}%</strong>
      </span>
    </div>
  );
}

/**
 * Full 12-score intelligence breakdown card with explainability formulas and page citations
 */
export function AiScoresFullCard({
  scores,
  onOpenModal,
}: {
  scores: DprAiScores;
  onOpenModal?: () => void;
}) {
  const [showExplain, setShowExplain] = useState(false);

  const metrics = [
    { key: 'overall_ai_score', label: 'Overall AI Score', val: scores.overall_ai_score, icon: Sparkles },
    { key: 'dpr_quality_score', label: 'DPR Quality Score', val: scores.dpr_quality_score, icon: Award },
    { key: 'compliance_score', label: 'Compliance Score', val: scores.compliance_score, icon: ShieldCheck },
    { key: 'risk_score', label: 'Risk Score', val: scores.risk_score, isRisk: true, icon: ShieldAlert },
    { key: 'technical_score', label: 'Technical Score', val: scores.technical_score, icon: Wrench },
    { key: 'financial_score', label: 'Financial Score', val: scores.financial_score, icon: DollarSign },
    { key: 'documentation_score', label: 'Documentation Score', val: scores.documentation_score, icon: FileCheck },
    { key: 'approval_readiness_score', label: 'Approval Readiness', val: scores.approval_readiness_score, icon: CheckCheck },
    { key: 'confidence_score', label: 'Confidence Score', val: scores.confidence_score, icon: Sparkles },
    { key: 'ocr_accuracy', label: 'OCR Accuracy', val: scores.ocr_accuracy, icon: FileText },
    { key: 'rag_confidence', label: 'RAG Retrieval Confidence', val: scores.rag_confidence, icon: BookOpen },
    { key: 'recommendation_score', label: 'AI Actionability Score', val: scores.recommendation_score, icon: Layers },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#3b82f6" />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Centralized AI Intelligence & Analysis Scores
          </h3>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: getScoreTheme(scores.overall_ai_score).bg,
              color: getScoreTheme(scores.overall_ai_score).color,
              border: `1px solid ${getScoreTheme(scores.overall_ai_score).border}`,
            }}
          >
            {scores.grade}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowExplain(!showExplain)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 6,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Info size={13} />
            {showExplain ? 'Hide Formulas' : 'Explain Formulas'}
            {showExplain ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* ── 12 Scores Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: showExplain ? 16 : 0,
        }}
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          const theme = getScoreTheme(m.val, m.isRisk);
          return (
            <div
              key={m.key}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} color={theme.color} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {m.label}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.color }}>
                {m.val}%
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Explainability Section ── */}
      {showExplain && scores.explainability && (
        <div
          style={{
            marginTop: 14,
            padding: '14px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
          }}
        >
          <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
            📐 Mathematical Formula & Factor Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {Object.entries(scores.explainability).slice(0, 6).map(([key, detail]) => (
              <div
                key={key}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  fontSize: 11,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 2 }}>
                  <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                  <span style={{ color: detail.color }}>{detail.score}% ({detail.grade})</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>
                  Formula: {detail.formula}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                  {detail.description}
                </div>
              </div>
            ))}
          </div>

          {/* Page references citation list */}
          {scores.page_references && scores.page_references.length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                📑 Page-Level Audit Citations
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {scores.page_references.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                    title={p.text_excerpt}
                  >
                    <BookOpen size={11} color="#3b82f6" />
                    <strong>Page {p.page_number}:</strong> {p.section_name} ({p.impact_level})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
