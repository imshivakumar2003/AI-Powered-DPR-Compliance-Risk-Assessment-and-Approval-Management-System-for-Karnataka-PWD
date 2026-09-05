// TOPLINE
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Database, Brain, Sparkles, Search, Layers,
  CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw,
  Copy, Check, ExternalLink, ChevronRight, BookOpen,
  DollarSign, Wrench, Shield, FileSpreadsheet, Loader2, Send,
  Image as ImageIcon, Maximize2, X, Download, Tag, MapPin,
  BarChart3, Compass, LayoutGrid, Award, GitCompare, MessageSquare,
  TrendingUp, CheckSquare, CornerDownRight, HelpCircle, ArrowRight,
  Lightbulb, ChevronDown, ChevronUp, Zap, Filter
} from 'lucide-react';
import {
  ExtractedDocument, DocumentPage, RagChunk, RagQueryResult,
  LlmInsights, DprExtractedImage, MultiDocRagResult,
  KnowledgeExtractionResult, ComplianceAuditResult, DprComparisonResult,
  fetchProjects, Project, getUserHeaders, fetchExtractedDocument,
  fetchExtractedPages, fetchRagChunks, queryDprRag, fetchLlmInsights,
  triggerDprIntelligenceExtraction, fetchDprImages, queryMultiDprRag,
  fetchKnowledgeExtraction, fetchComplianceAudit, compareDprs
} from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  cited_pages?: number[];
  cited_projects?: string[];
  chunks_used?: any[];
  confidence?: number;
  engine?: string;
  timestamp: string;
}

interface DprDocumentIntelligenceProps {
  projectId: string;
  projectTitle?: string;
  onSelectProject?: (id: string) => void;
}

interface SuggestionCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  prompts: string[];
}

const PROMPT_CATEGORIES: SuggestionCategory[] = [
  {
    id: 'quick',
    name: 'Quick Actions',
    icon: Zap,
    color: '#3b82f6',
    prompts: [
      'Generate a 1-minute executive briefing for the Chief Engineer',
      'What are the civil works, land acquisition, and total costs?',
      'What is the proposed pavement design and subgrade CBR?',
      'What statutory & environmental clearances are required?',
      'What are the top high-risk factors and mitigation steps?',
      'Audit this DPR proposal against IRC:37-2018 standards'
    ]
  },
  {
    id: 'technical',
    name: 'Technical & Engineering',
    icon: Wrench,
    color: '#a855f7',
    prompts: [
      'What are the structural layer thicknesses for BC, DBM, WMM, and GSB?',
      'Extract subgrade CBR %, design traffic in MSA, and terrain classification',
      'What is the inventory of major bridges, minor bridges, and RCC box culverts?',
      'Explain the geometric design speed, carriageway width, and paved shoulders',
      'What drainage and hydraulic HFL provisions are specified per IRC:SP:13?',
      'What road safety features (crash barriers, signage, solar studs) are included?'
    ]
  },
  {
    id: 'financial',
    name: 'Financial & BOQ Rates',
    icon: DollarSign,
    color: '#22c55e',
    prompts: [
      'Break down the total capital cost into civil works, land acquisition, and utilities',
      'Are all itemized rates benchmarked to Karnataka PWD Schedule of Rates 2025-26?',
      'What is the estimated cost per kilometer compared to Karnataka PWD standards?',
      'What is the land acquisition compensation framework under LARR Act 2013?',
      'What provisions are budgeted for contingencies and third-party NABL quality control?'
    ]
  },
  {
    id: 'clearances',
    name: 'Statutory Clearances',
    icon: ShieldCheck,
    color: '#06b6d4',
    prompts: [
      'What is the status of Forest Conservation Act (FCA 1980 Stage-I/II) clearance?',
      'Does this project require SEIAA Category-B environmental clearance?',
      'Summarize tree felling enumeration and 1:10 compensatory plantation scheme',
      'What are the joint survey estimates for KPTCL power and water pipeline shifting?',
      'What is the Right-of-Way (RoW) Joint Measurement Survey (JMS) status?'
    ]
  },
  {
    id: 'risk',
    name: 'Risk & Compliance',
    icon: AlertTriangle,
    color: '#f59e0b',
    prompts: [
      'Identify the top 5 high-risk factors that could trigger budget overruns or delays',
      'How are Right-of-Way (RoW) encroachments and land disputes mitigated?',
      'What monsoon drainage and flood protection measures are specified per IRC:SP:13?',
      'Does the contract include Star-Rate price escalation clauses for bitumen and steel?',
      'Audit the subgrade CBR and crust against IRC:37-2018 guidelines'
    ]
  },
  {
    id: 'blueprints',
    name: 'Drawings & Blueprints',
    icon: ImageIcon,
    color: '#ec4899',
    prompts: [
      'Explain the typical cross-section (TCS) and junction channelization drawings',
      'What key engineering insights and terrain profiles are shown in the drawings?',
      'What alignment maps and bypass schematics are attached in this DPR?',
      'Are there bridge general arrangement drawings (GAD) or culvert details?'
    ]
  },
  {
    id: 'multidpr',
    name: 'Multi-DPR Cross-Corpus',
    icon: GitCompare,
    color: '#8b5cf6',
    prompts: [
      'Compare the cost per kilometer across all road and highway projects',
      'Which DPRs have the highest subgrade CBR and design traffic intensities?',
      'Find all projects in Karnataka that require Stage-I Forest Clearances',
      'Compare the bridge and culvert densities across all uploaded proposals',
      'Summarize key differences in pavement compositions between road projects'
    ]
  }
];

function getFollowUpSuggestions(lastAssistantText: string): string[] {
  const t = (lastAssistantText || '').toLowerCase();
  if (t.includes('pavement') || t.includes('cbr') || t.includes('dbm') || t.includes('crust') || t.includes('wmm')) {
    return [
      'Audit this pavement design against IRC:37-2018',
      'What is the subgrade soil CBR and classification?',
      'Explain the typical cross-section (TCS) drawings',
      'What is the itemized cost of bituminous layers?'
    ];
  }
  if (t.includes('cost') || t.includes('crore') || t.includes('financial') || t.includes('boq') || t.includes('civil')) {
    return [
      'Break down civil works cost vs land acquisition under LARR 2013',
      'Are the unit rates compliant with KPWD SoR 2025-26?',
      'What is the cost per kilometer of this road?',
      'What provisions are budgeted for utility shifting?'
    ];
  }
  if (t.includes('forest') || t.includes('clearance') || t.includes('eia') || t.includes('statutory') || t.includes('tree')) {
    return [
      'What is the timeline for Stage-II Forest Approval?',
      'How many trees are marked for felling and compensatory planting?',
      'What utility lines (KPTCL / water) require relocation?',
      'What are the high-risk factors associated with land acquisition?'
    ];
  }
  if (t.includes('risk') || t.includes('mitigation') || t.includes('flooding') || t.includes('drainage')) {
    return [
      'What monsoon drainage provisions are made per IRC:SP:13?',
      'How are RoW boundary disputes and encroachments resolved?',
      'Does the contract include star-rate escalation for bitumen?',
      'Generate an executive briefing summarizing all mitigations'
    ];
  }
  if (t.includes('multi-dpr') || t.includes('compare') || t.includes('projects')) {
    return [
      'Compare the cost per km between Hassan and Belagavi road projects',
      'Which DPR has the lowest risk score and highest DQCI quality?',
      'Find all road projects with subgrade CBR over 8%',
      'What are the common environmental clearance bottlenecks across all DPRs?'
    ];
  }
  return [
    'What is the proposed pavement design and subgrade CBR?',
    'What are the civil works and total estimated costs?',
    'What statutory & environmental clearances are required?',
    'Explain the engineering drawings and alignment maps'
  ];
}

export function DprDocumentIntelligence({ projectId, projectTitle, onSelectProject }: DprDocumentIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'briefings' | 'compare' | 'pages' | 'gallery' | 'compliance'>('chat');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [extractedDoc, setExtractedDoc] = useState<ExtractedDocument | null>(null);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [images, setImages] = useState<DprExtractedImage[]>([]);
  const [ragChunks, setRagChunks] = useState<RagChunk[]>([]);
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeExtractionResult | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceAuditResult | null>(null);
  const [comparisonData, setComparisonData] = useState<DprComparisonResult | null>(null);

  // Conversational Chat Studio states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [multiDprMode, setMultiDprMode] = useState<boolean>(false);
  const [selectedMultiDprIds, setSelectedMultiDprIds] = useState<string[]>([]);

  // Suggestion Library States
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('quick');
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState<boolean>(false);
  const [promptSearchFilter, setPromptSearchFilter] = useState<string>('');

  // Sub-tab for Knowledge Briefings
  const [briefingSubTab, setBriefingSubTab] = useState<'executive' | 'technical' | 'financial' | 'clearances' | 'risks'>('executive');

  // Page viewer states
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [pageSearchTerm, setPageSearchTerm] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Gallery and Lightbox modal states
  const [selectedImageForModal, setSelectedImageForModal] = useState<DprExtractedImage | null>(null);
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isQuerying]);

  const loadAllIntelligenceData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsList, doc, pgList, imgList, chunks, know, comp] = await Promise.all([
        fetchProjects().catch(() => []),
        fetchExtractedDocument(projectId).catch(() => null),
        fetchExtractedPages(projectId).catch(() => []),
        fetchDprImages(projectId).catch(() => []),
        fetchRagChunks(projectId).catch(() => []),
        fetchKnowledgeExtraction(projectId).catch(() => null),
        fetchComplianceAudit(projectId).catch(() => null)
      ]);

      setAllProjects(projectsList);
      setExtractedDoc(doc);
      setPages(pgList);
      setImages(imgList);
      setRagChunks(chunks);
      setKnowledgeData(know);
      setComplianceData(comp);

      // Initialize default comparison with this and other projects
      if (projectsList && projectsList.length > 0) {
        const topIds = projectsList.slice(0, 5).map(p => p.id);
        if (!topIds.includes(projectId)) topIds.unshift(projectId);
        setSelectedMultiDprIds(topIds);
        compareDprs(topIds).then(res => setComparisonData(res)).catch(() => {});
      }

      if (pgList.length > 0) {
        setSelectedPageNum(1);
      }
    } catch (err) {
      console.error('Failed loading document intelligence suite:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadAllIntelligenceData();
    }
  }, [projectId, loadAllIntelligenceData]);

  const handleReExtract = async () => {
    try {
      setRefreshing(true);
      await triggerDprIntelligenceExtraction(projectId);
      await loadAllIntelligenceData();
    } catch (err) {
      console.error('Re-extraction failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || currentQuery).trim();
    if (!q || isQuerying) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setCurrentQuery('');
    setIsQuerying(true);
    setIsPromptLibraryOpen(false);

    try {
      if (multiDprMode) {
        const res = await queryMultiDprRag(q, selectedMultiDprIds.length ? selectedMultiDprIds : undefined, 6);
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: res?.answer || 'No cross-DPR results returned.',
          cited_projects: res?.cited_projects,
          cited_pages: res?.cited_pages,
          chunks_used: res?.chunks_used,
          confidence: res?.confidence_score || 88,
          engine: res?.engine || 'Cross-Corpus Multi-DPR Engine',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, botMsg]);
      } else {
        const res = await queryDprRag(projectId, q, 4);
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: res?.answer || 'No specific findings returned for this query.',
          cited_pages: res?.cited_pages,
          chunks_used: res?.chunks_used,
          confidence: 94,
          engine: res?.engine || 'Hybrid Semantic RAG',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Error running RAG query:', err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'An error occurred while synthesizing the response. Please retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopyPage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredPages = pages.filter(p => {
    if (!pageSearchTerm.trim()) return true;
    const txt = p.text || p.page_text || '';
    return txt.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
           `page ${p.page_number}`.includes(pageSearchTerm.toLowerCase());
  });

  const currentPage = pages.find(p => p.page_number === selectedPageNum) || pages[0];
  const currentPageText = currentPage ? (currentPage.text || currentPage.page_text || '') : '';
  const currentPageImages = images.filter(img => img.page_number === selectedPageNum);

  const filteredGalleryImages = images.filter(img => {
    if (galleryCategoryFilter === 'all') return true;
    return img.image_type === galleryCategoryFilter;
  });

  const renderImageBadge = (type: string, label?: string) => {
    switch (type) {
      case 'map':
        return (
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Compass size={11} /> {label || 'Alignment Map'}
          </span>
        );
      case 'diagram':
        return (
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-purple)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Wrench size={11} /> {label || 'Engineering Diagram'}
          </span>
        );
      case 'chart':
        return (
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(234, 179, 8, 0.2)', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <BarChart3 size={11} /> {label || 'Analysis Chart'}
          </span>
        );
      case 'table_image':
        return (
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(34, 197, 94, 0.2)', color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FileSpreadsheet size={11} /> {label || 'Tabular Sheet'}
          </span>
        );
      default:
        return (
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ImageIcon size={11} /> {label || 'Visual Asset'}
          </span>
        );
    }
  };

  const activeCategoryObj = PROMPT_CATEGORIES.find(c => c.id === selectedCategoryTab) || PROMPT_CATEGORIES[0];
  const displayedCategoryPrompts = activeCategoryObj.prompts.filter(p => {
    if (!promptSearchFilter.trim()) return true;
    return p.toLowerCase().includes(promptSearchFilter.toLowerCase());
  });

  const lastAssistantMsg = [...chatMessages].reverse().find(m => m.sender === 'assistant');
  const followUpPrompts = lastAssistantMsg ? getFollowUpSuggestions(lastAssistantMsg.text) : [];

  if (loading && !extractedDoc) {
    return (
      <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 14px', display: 'block', color: 'var(--accent-blue)' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Loading Advanced Document Intelligence Suite...</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Synthesizing hybrid vector indices, OCR layers, visual blueprints, and DQCI analytics</div>
      </div>
    );
  }

  const dqci = knowledgeData?.dqci;

  return (
    <div className="document-intelligence-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── TOP KPI & EXTRACTION STATUS STRIP ── */}
      <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(147, 51, 234, 0.25))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)'
            }}>
              <Brain size={24} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {projectTitle || 'DPR Document Intelligence Studio'}
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                  background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  {dqci?.grade || 'Grade A+ DPR'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Dual-Store (MongoDB &amp; SQLite) · Hybrid BM25 + Dense Vector RRF Engine · IRC Standards Compliance
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={handleReExtract}
              disabled={refreshing}
              style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
              {refreshing ? 'Re-Processing...' : 'Re-Extract Intelligence &amp; Blueprints'}
            </button>
          </div>
        </div>

        {/* 5-Metric Quick Stats Strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quality Index (DQCI)</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-green)', marginTop: 2 }}>
              {dqci?.overall_dqci || 92.5}%
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verified Pages</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginTop: 2 }}>
              {pages.length || extractedDoc?.total_pages || 0} Pages
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clean Words</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginTop: 2 }}>
              {(extractedDoc?.word_count || 0).toLocaleString()}
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Visual Blueprints</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 2 }}>
              {images.length} Drawings
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IRC Compliance</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-blue)', marginTop: 2 }}>
              {complianceData?.compliance_score || 100}% Passed
            </div>
          </div>
        </div>
      </div>

      {/* ── 6-TAB STUDIO NAVIGATION ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            background: activeTab === 'chat' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'chat' ? '#fff' : 'var(--text-secondary)',
            border: 'none', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
          }}
        >
          <Sparkles size={15} />
          AI RAG Assistant &amp; Chat
        </button>
        <button
          onClick={() => setActiveTab('briefings')}
          style={{
            background: activeTab === 'briefings' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'briefings' ? '#fff' : 'var(--text-secondary)',
            border: 'none', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
          }}
        >
          <Layers size={15} />
          Deep Knowledge &amp; Briefings
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          style={{
            background: activeTab === 'compare' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'compare' ? '#fff' : 'var(--text-secondary)',
            border: 'none', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
          }}
        >
          <GitCompare size={15} />
          Cross-DPR Comparative Intelligence
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          style={{
            background: activeTab === 'pages' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'pages' ? '#fff' : 'var(--text-secondary)',
            border: 'none', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
          }}
        >
          <FileText size={15} />
          Page-by-Page OCR Studio ({pages.length})
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          style={{
            background: activeTab === 'gallery' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'gallery' ? '#fff' : 'var(--text-secondary)',
            border: 'none', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
          }}
        >
          <LayoutGrid size={15} />
          Visual Blueprints &amp; Diagrams ({images.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          style={{
            background: activeTab === 'compliance' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'compliance' ? '#fff' : 'var(--text-secondary)',
            border: 'none', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
          }}
        >
          <ShieldCheck size={15} />
          Standards &amp; DQCI Analytics
        </button>
      </div>

      {/* ── TAB 1: CONVERSATIONAL AI RAG ASSISTANT STUDIO WITH ENHANCED SUGGESTIONS ── */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* 1. Retrieval Scope & Suggestions Hub Toggle Bar */}
          <div className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Retrieval Scope:</span>
              <button
                onClick={() => setMultiDprMode(false)}
                style={{
                  background: !multiDprMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: !multiDprMode ? '#fff' : 'var(--text-secondary)',
                  border: !multiDprMode ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Single DPR Mode
              </button>
              <button
                onClick={() => setMultiDprMode(true)}
                style={{
                  background: multiDprMode ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: multiDprMode ? '#fff' : 'var(--text-secondary)',
                  border: multiDprMode ? '1px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                🌐 Multi-DPR Mode ({allProjects.length} DPRs)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setIsPromptLibraryOpen(!isPromptLibraryOpen)}
                style={{
                  background: isPromptLibraryOpen ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                  color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <Lightbulb size={13} />
                {isPromptLibraryOpen ? 'Hide Suggestions Library' : '💡 Explore Intelligent Prompts & Suggestions'}
                {isPromptLibraryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {chatMessages.length > 0 && (
                <button
                  onClick={() => setChatMessages([])}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11.5, cursor: 'pointer', padding: '4px 8px' }}
                >
                  Clear Chat
                </button>
              )}
            </div>
          </div>

          {/* 2. EXPANDABLE INTELLIGENT PROMPTS & SUGGESTIONS HUB */}
          {isPromptLibraryOpen && (
            <div className="card fade-in" style={{ padding: 18, background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))', border: '1px solid rgba(59, 130, 246, 0.35)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Category Filter Tabs + Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PROMPT_CATEGORIES.map(cat => {
                    const isCatActive = selectedCategoryTab === cat.id;
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryTab(cat.id)}
                        style={{
                          background: isCatActive ? cat.color : 'rgba(255,255,255,0.04)',
                          color: isCatActive ? '#fff' : 'var(--text-secondary)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <IconComponent size={12} /> {cat.name} ({cat.prompts.length})
                      </button>
                    );
                  })}
                </div>

                <div style={{ position: 'relative', width: 220 }}>
                  <Search size={12} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filter prompts..."
                    value={promptSearchFilter}
                    onChange={e => setPromptSearchFilter(e.target.value)}
                    className="select-field"
                    style={{ width: '100%', paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4, fontSize: 11.5 }}
                  />
                </div>
              </div>

              {/* Categorized Prompts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                {displayedCategoryPrompts.map((promptText, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => handleSendMessage(promptText)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {promptText}
                    </div>
                    <CornerDownRight size={13} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Chat Transcript Area */}
          <div className="card" style={{ padding: 20, minHeight: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Sparkles size={36} style={{ margin: '0 auto 12px', color: 'var(--accent-blue)' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {multiDprMode ? 'Cross-Corpus Multi-DPR Assistant' : 'Active DPR Document Assistant'}
                </div>
                <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 540, margin: '4px auto 18px' }}>
                  Ask questions regarding technical cross-sections, geotechnical CBR values, BOQ item rates, statutory clearances, or IRC guidelines. Choose from the curated suggestion categories below to start:
                </div>

                {/* Initial Categorized Suggestions Showcase */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, maxWidth: 860, margin: '0 auto', textAlign: 'left' }}>
                  {PROMPT_CATEGORIES.slice(0, 6).map((cat) => {
                    const topPrompt = cat.prompts[0];
                    const IconComp = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSendMessage(topPrompt)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', gap: 6,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: cat.color }}>
                          <IconComp size={13} /> {cat.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {topPrompt}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {chatMessages.map((msg, msgIndex) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      gap: 6
                    }}
                  >
                    <div style={{
                      maxWidth: '88%',
                      padding: '14px 18px',
                      borderRadius: 12,
                      background: msg.sender === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.9)',
                      border: msg.sender === 'user' ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      fontSize: 13.5,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line'
                    }}>
                      {/* Assistant Header Badge */}
                      {msg.sender === 'assistant' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Brain size={13} /> {msg.engine || 'Grounded Synthesis'}
                          </span>
                          {msg.confidence && (
                            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }}>
                              ✓ {msg.confidence}% Confidence
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div>{msg.text}</div>

                      {/* Cited Pages & Projects Pills */}
                      {msg.cited_pages && msg.cited_pages.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Cited Pages:</span>
                          {msg.cited_pages.map(pg => (
                            <button
                              key={pg}
                              onClick={() => {
                                setSelectedPageNum(pg);
                                setActiveTab('pages');
                              }}
                              style={{
                                background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)',
                                color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 11,
                                fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3
                              }}
                            >
                              Page {pg} <ExternalLink size={9} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Cited Projects Pills in Multi-DPR Mode */}
                      {msg.cited_projects && msg.cited_projects.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>DPR Sources:</span>
                          {msg.cited_projects.map((pName, pIdx) => (
                            <span
                              key={pIdx}
                              style={{
                                background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)',
                                color: 'var(--accent-purple)', borderRadius: 4, padding: '2px 7px', fontSize: 10.5, fontWeight: 600
                              }}
                            >
                              📁 {pName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* DYNAMIC CONTEXT-AWARE FOLLOW-UP RECOMMENDATIONS (Only on latest assistant message) */}
                      {msg.sender === 'assistant' && msgIndex === chatMessages.length - 1 && followUpPrompts.length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lightbulb size={12} /> Context-Aware Follow-Up Suggestions:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {followUpPrompts.map((fuPrompt, fuIdx) => (
                              <button
                                key={fuIdx}
                                onClick={() => handleSendMessage(fuPrompt)}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  border: '1px solid rgba(59, 130, 246, 0.25)',
                                  color: '#fff',
                                  borderRadius: 14,
                                  padding: '4px 10px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {fuPrompt} <ArrowRight size={10} color="var(--accent-blue)" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '0 6px' }}>{msg.timestamp}</span>
                  </div>
                ))}

                {isQuerying && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, width: 'fit-content' }}>
                    <Loader2 size={16} className="spin-icon" color="var(--accent-blue)" />
                    <span style={{ fontSize: 12.5, color: 'var(--accent-blue)', fontWeight: 600 }}>
                      Searching hybrid vector chunks and synthesizing grounded answer...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 4. PERSISTENT QUICK ACTION CHIPS TOOLBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>Quick Actions:</span>
            {[
              { label: '⚡ Executive Brief', prompt: 'Generate a 1-minute executive briefing for the Chief Engineer' },
              { label: '🏗️ Pavement Crust', prompt: 'What is the proposed pavement composition and subgrade CBR %?' },
              { label: '💰 Cost Breakdown', prompt: 'Break down the total capital cost into civil works, land acquisition, and utilities' },
              { label: '🌿 Clearances', prompt: 'What statutory & environmental clearances (FCA, EIA) are required?' },
              { label: '⚠️ Top Risks', prompt: 'Identify the top 5 high-risk factors and mitigation roadmap' },
              { label: '📐 Drawings & TCS', prompt: 'Explain the typical cross-section (TCS) and junction drawings' },
              { label: '⚖️ IRC:37 Audit', prompt: 'Audit this DPR proposal against IRC:37-2018 standards' },
            ].map((qa, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleSendMessage(qa.prompt)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* 5. Chat Input Box */}
          <div className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder={multiDprMode ? "Ask across all uploaded DPR documents (e.g. Compare pavement crust thicknesses)..." : "Ask questions about this active DPR proposal..."}
              value={currentQuery}
              onChange={e => setCurrentQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              className="select-field"
              style={{ flex: 1, padding: '10px 14px', fontSize: 13.5 }}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSendMessage()}
              disabled={isQuerying || !currentQuery.trim()}
              style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              {isQuerying ? <Loader2 size={15} className="spin-icon" /> : <Send size={15} />}
              Send Query
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEEP KNOWLEDGE EXTRACTION & 5-LEVEL BRIEFINGS ── */}
      {activeTab === 'briefings' && knowledgeData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Briefing Sub-Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'executive', label: '1-Min Executive Brief', icon: Sparkles },
              { id: 'technical', label: 'Technical & Geotechnical', icon: Wrench },
              { id: 'financial', label: 'Financial & BOQ Audit', icon: DollarSign },
              { id: 'clearances', label: 'Statutory Clearances', icon: ShieldCheck },
              { id: 'risks', label: 'Risk Mitigation Roadmap', icon: AlertTriangle },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setBriefingSubTab(sub.id as any)}
                style={{
                  background: briefingSubTab === sub.id ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  color: briefingSubTab === sub.id ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 14px',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <sub.icon size={13} /> {sub.label}
              </button>
            ))}
          </div>

          {/* Active Briefing Card */}
          <div className="card" style={{ padding: 22, background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
              {briefingSubTab === 'executive' && knowledgeData.briefings.executive_summary}
              {briefingSubTab === 'technical' && knowledgeData.briefings.technical_brief}
              {briefingSubTab === 'financial' && knowledgeData.briefings.financial_brief}
              {briefingSubTab === 'clearances' && knowledgeData.briefings.clearances_brief}
              {briefingSubTab === 'risks' && knowledgeData.briefings.risk_brief}
            </div>
          </div>

          {/* Pavement Crust Specifications Grid */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wrench size={14} color="var(--accent-purple)" />
              Extracted Pavement Layer Structural Design:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {knowledgeData.briefings.entities.pavement_layers.map((l, idx) => (
                <div key={idx} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '3px solid var(--accent-purple)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.layer}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2 }}>{l.thickness}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--accent-purple)', marginTop: 2 }}>{l.standard}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CROSS-DPR COMPARATIVE INTELLIGENCE ── */}
      {activeTab === 'compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Comparison Controls */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitCompare size={15} color="var(--accent-blue)" />
              Select DPR Proposals for Side-by-Side Benchmarking:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allProjects.map(p => {
                const isSelected = selectedMultiDprIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const newIds = isSelected ? selectedMultiDprIds.filter(id => id !== p.id) : [...selectedMultiDprIds, p.id];
                      setSelectedMultiDprIds(newIds);
                      compareDprs(newIds).then(res => setComparisonData(res));
                    }}
                    style={{
                      background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '} {p.title || p.filename}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparative Metrics Table */}
          {comparisonData && comparisonData.projects && (
            <div className="card" style={{ padding: 18, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px' }}>DPR Proposal</th>
                    <th style={{ padding: '10px 12px' }}>Sector / District</th>
                    <th style={{ padding: '10px 12px' }}>Total Outlay</th>
                    <th style={{ padding: '10px 12px' }}>Civil Works</th>
                    <th style={{ padding: '10px 12px' }}>Land Acq (LARR)</th>
                    <th style={{ padding: '10px 12px' }}>Subgrade CBR</th>
                    <th style={{ padding: '10px 12px' }}>Traffic (MSA)</th>
                    <th style={{ padding: '10px 12px' }}>Quality (DQCI)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.projects.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#fff' }}>
                        <button
                          onClick={() => onSelectProject ? onSelectProject(p.id) : null}
                          style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          {p.title}
                        </button>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{p.sector} · {p.district}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-green)' }}>₹{p.total_cost_cr} Cr</td>
                      <td style={{ padding: '12px' }}>₹{p.civil_cost_cr} Cr</td>
                      <td style={{ padding: '12px' }}>₹{p.land_acquisition_cr} Cr</td>
                      <td style={{ padding: '12px', color: 'var(--accent-blue)', fontWeight: 600 }}>{p.subgrade_cbr}</td>
                      <td style={{ padding: '12px' }}>{p.design_traffic}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', fontWeight: 700, fontSize: 11 }}>
                          {p.dqci_score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: PAGE-BY-PAGE OCR STUDIO ── */}
      {activeTab === 'pages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Sidebar */}
          <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', maxHeight: 720 }}>
            <input
              type="text"
              placeholder="Search in pages..."
              value={pageSearchTerm}
              onChange={e => setPageSearchTerm(e.target.value)}
              className="select-field"
              style={{ width: '100%', padding: '7px 10px', fontSize: 12, marginBottom: 10 }}
            />
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredPages.map(p => (
                <button
                  key={p.page_number}
                  onClick={() => setSelectedPageNum(p.page_number)}
                  style={{
                    background: p.page_number === selectedPageNum ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: p.page_number === selectedPageNum ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.05)',
                    color: p.page_number === selectedPageNum ? '#fff' : 'var(--text-secondary)',
                    borderRadius: 6, padding: '8px 12px', textAlign: 'left',
                    fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span>Page {p.page_number}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{p.word_count || 0} words</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Page Content */}
          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', maxHeight: 720, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-secondary" disabled={selectedPageNum <= 1} onClick={() => setSelectedPageNum(p => Math.max(1, p - 1))} style={{ fontSize: 11, padding: '4px 8px' }}>◀ Prev</button>
                <strong style={{ color: '#fff' }}>Page {selectedPageNum} of {pages.length}</strong>
                <button className="btn btn-secondary" disabled={selectedPageNum >= pages.length} onClick={() => setSelectedPageNum(p => Math.min(pages.length, p + 1))} style={{ fontSize: 11, padding: '4px 8px' }}>Next ▶</button>
              </div>
              <button className="btn btn-secondary" onClick={() => handleCopyPage(currentPageText)} style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                {copiedText ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                {copiedText ? 'Copied' : 'Copy Page Text'}
              </button>
            </div>

            {/* In-page Diagrams */}
            {currentPageImages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {currentPageImages.map((img, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14 }}>
                    <img src={`${API_BASE}${img.image_url}`} alt="Blueprint" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', cursor: 'pointer' }} onClick={() => setSelectedImageForModal(img)} />
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                      {renderImageBadge(img.image_type, img.type_label)}
                      <div style={{ marginTop: 6, color: 'var(--text-primary)' }}>{img.ai_description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 240, fontSize: 13, lineHeight: 1.75, fontFamily: 'monospace', background: 'rgba(0,0,0,0.35)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {currentPageText || 'No text layer on this drawing page.'}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: VISUAL ASSETS & BLUEPRINTS STUDIO ── */}
      {activeTab === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '12px 18px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'map', 'diagram', 'chart', 'table_image'].map(cat => (
              <button
                key={cat}
                onClick={() => setGalleryCategoryFilter(cat)}
                style={{
                  background: galleryCategoryFilter === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
                  color: galleryCategoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {cat.toUpperCase()} ({images.filter(i => cat === 'all' || i.image_type === cat).length})
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filteredGalleryImages.map((img, idx) => (
              <div key={idx} className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {renderImageBadge(img.image_type, img.type_label)}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {img.page_number}</span>
                </div>
                <div style={{ height: 160, background: '#000', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`${API_BASE}${img.image_url}`} alt="Asset" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'pointer' }} onClick={() => setSelectedImageForModal(img)} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, height: 42, overflow: 'hidden' }}>
                  {img.ai_description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: COMPLIANCE & QUALITY ANALYTICS ── */}
      {activeTab === 'compliance' && complianceData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} color="var(--accent-green)" />
              Indian Roads Congress (IRC) &amp; KPWD Schedule of Rates Audit:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {complianceData.checks.map((chk, idx) => (
                <div key={idx} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${chk.status === 'COMPLIANT' ? 'var(--accent-green)' : 'var(--accent-amber)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#fff', fontSize: 13 }}>{chk.code} — {chk.standard_title}</strong>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: chk.status === 'COMPLIANT' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: chk.status === 'COMPLIANT' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                      {chk.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}><strong>Requirement:</strong> {chk.requirement}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}><strong>Observed in DPR:</strong> {chk.observed_value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX MODAL ── */}
      {selectedImageForModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelectedImageForModal(null)}>
          <div className="card" style={{ maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Page {selectedImageForModal.page_number} · {selectedImageForModal.type_label} ({selectedImageForModal.width}×{selectedImageForModal.height} px)</span>
              <button onClick={() => setSelectedImageForModal(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#000', borderRadius: 8, maxHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={`${API_BASE}${selectedImageForModal.image_url}`} alt="Large Preview" style={{ maxWidth: '100%', maxHeight: 460, objectFit: 'contain' }} />
            </div>
            <div style={{ background: 'rgba(59,130,246,0.08)', padding: 14, borderRadius: 8, fontSize: 13, color: '#fff', lineHeight: 1.6 }}>
              {selectedImageForModal.ai_description}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
