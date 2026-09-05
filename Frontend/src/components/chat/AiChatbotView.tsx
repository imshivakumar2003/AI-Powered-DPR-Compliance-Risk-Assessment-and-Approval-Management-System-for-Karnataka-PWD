// TOPLINE
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import {
  Bot, Sparkles, Send, Mic, MicOff, Volume2, VolumeX,
  FileText, Download, Copy, Check, RefreshCw, X,
  ExternalLink, ChevronRight, CheckCircle2, Clock, XCircle,
  AlertTriangle, Wrench, DollarSign, ShieldCheck, HelpCircle,
  Layers, CornerDownRight, ArrowRight, Globe, Compass, ImageIcon,
  BookOpen, Eye, Search, Maximize2
} from 'lucide-react';
import {
  fetchProjects, Project, getUserHeaders,
  queryAiChatbot, exportChatTranscript, fetchExtractedPages,
  DocumentPage, ChatbotQueryResponse, ChatbotCitedImage
} from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SECTOR_ICONS: Record<string, string> = {
  Roads: '🛣️',
  Power: '⚡',
  Healthcare: '🏥',
  Education: '🎓',
  Tourism: '🏔️',
  Agriculture: '🌾',
  Urban: '🏙️',
  Telecom: '📡',
  Highways: '🛣️',
  Bridges: '🌉',
  Infrastructure: '🏗️',
};

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language?: string;
  direct_answer?: string;
  simple_explanation?: string;
  key_insights?: string[];
  source_section?: string;
  cited_pages?: number[];
  cited_images?: ChatbotCitedImage[];
  guidelines_applied?: string[];
  confidence_score?: number;
  confidence_level?: string;
  engine?: string;
  follow_up_suggestions?: string[];
  timestamp: string;
}

interface AiChatbotViewProps {
  moduleType: 'admin' | 'user';
  title?: string;
}

export function AiChatbotView({ moduleType, title }: AiChatbotViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('id') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  // Cached pages for live Page Inspector Modal
  const [extractedPages, setExtractedPages] = useState<DocumentPage[]>([]);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'kn' | 'hi'>('en');

  // Voice Speech-to-Text state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Text-to-Speech speaking state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Modal for previewing cited images & full page inspector
  const [activePreviewImage, setActivePreviewImage] = useState<ChatbotCitedImage | null>(null);
  const [inspectPageNum, setInspectPageNum] = useState<number | null>(null);
  const [pageTextCopied, setPageTextCopied] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying]);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const loadProjectsAndPages = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await fetchProjects();
      setProjects(data);

      let currentId = selectedProjectId;
      if (data && data.length > 0) {
        const match = data.find(p => p.id === initialProjectId);
        if (match) {
          currentId = match.id;
          setSelectedProjectId(match.id);
        } else if (!selectedProjectId) {
          currentId = data[0].id;
          setSelectedProjectId(data[0].id);
        }
      }

      if (currentId) {
        fetchExtractedPages(currentId).then(pgs => setExtractedPages(pgs)).catch(() => {});
      }
    } catch (err) {
      console.error('Failed loading projects for chatbot:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [initialProjectId, selectedProjectId]);

  useEffect(() => {
    loadProjectsAndPages();
  }, [loadProjectsAndPages]);

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    setMessages([]);
    fetchExtractedPages(projId).then(pgs => setExtractedPages(pgs)).catch(() => {});
    const path = moduleType === 'admin' ? '/admin/ai-chatbot' : '/user/ai-chatbot';
    router.replace(`${path}?id=${projId}`, { scroll: false });
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      if (selectedLanguage === 'kn') recognitionRef.current.lang = 'kn-IN';
      else if (selectedLanguage === 'hi') recognitionRef.current.lang = 'hi-IN';
      else recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSpeakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#>`]/g, '').replace(/\[Page \d+\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (selectedLanguage === 'kn') utterance.lang = 'kn-IN';
    else if (selectedLanguage === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customQuery?: string) => {
    const q = (customQuery || inputText).trim();
    if (!q || !selectedProjectId || isQuerying) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      language: selectedLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsQuerying(true);

    const historyPayload = messages.slice(-4).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const res = await queryAiChatbot(selectedProjectId, q, selectedLanguage, historyPayload);
      if (res) {
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: res.answer,
          language: res.language,
          direct_answer: res.direct_answer,
          simple_explanation: res.simple_explanation,
          key_insights: res.key_insights,
          source_section: res.source_section,
          cited_pages: res.cited_pages,
          cited_images: res.cited_images,
          guidelines_applied: res.guidelines_applied,
          confidence_score: res.confidence_score,
          confidence_level: res.confidence_level || 'High (95%)',
          engine: res.engine,
          follow_up_suggestions: res.follow_up_suggestions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: 'Unable to synthesize response. Please verify the DPR document and retry.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Chatbot query error:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleExportTranscript = async () => {
    if (messages.length === 0 || !selectedProjectId) return;
    try {
      const res = await exportChatTranscript(selectedProjectId, messages);
      if (res && res.transcript) {
        const blob = new Blob([res.transcript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || `Chatbot_Report_${selectedProjectId.slice(0, 8)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting transcript:', err);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleCopyInspectedPageText = (text: string) => {
    navigator.clipboard.writeText(text);
    setPageTextCopied(true);
    setTimeout(() => setPageTextCopied(false), 2000);
  };

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const inspectedPageObj = extractedPages.find(p => p.page_number === inspectPageNum);

  const localizedQuickPrompts = {
    en: [
      { category: '⚡ Summary', prompt: 'What is the total project cost and budget breakdown?' },
      { category: '🏗️ Pavement Crust', prompt: 'What is the proposed pavement design and subgrade CBR?' },
      { category: '💰 BOQ Rates', prompt: 'Break down civil works cost vs land acquisition under LARR 2013' },
      { category: '🌿 Clearances', prompt: 'What statutory & environmental clearances (FCA, EIA) are required?' },
      { category: '⚠️ Risks & Safety', prompt: 'Identify the top 5 high-risk factors and proposed mitigation roadmap' },
      { category: '⏱️ Timeline', prompt: 'What is the proposed construction schedule, duration, and completion milestones?' },
      { category: '📋 Approvals', prompt: 'What administrative approvals and technical sanctions are required next?' },
    ],
    kn: [
      { category: '⚡ ಸಾರಾಂಶ', prompt: 'ಒಟ್ಟು ಯೋಜನಾ ವೆಚ್ಚ ಎಷ್ಟು ಮತ್ತು ಬಜೆಟ್ ವಿವರ ಏನು?' },
      { category: '🏗️ ತಾಂತ್ರಿಕ', prompt: 'ರಸ್ತೆಯ ಡಾಂಬರೀಕರಣ ಪದರಗಳ ದಪ್ಪ ಮತ್ತು ಉಪ-ಮಣ್ಣಿನ CBR ಮೌಲ್ಯ ಎಷ್ಟು?' },
      { category: '💰 ಬಜೆಟ್', prompt: 'ಸಿವಿಲ್ ಕಾಮಗಾರಿಗಳು ಮತ್ತು ಭೂಸ್ವಾಧೀನ ವೆಚ್ಚದ ವಿಂಗಡಣೆ ನೀಡಿ' },
      { category: '🌿 ಅನುಮತಿಗಳು', prompt: 'ಅರಣ್ಯ ಇಲಾಖೆ (FCA 1980) ಮತ್ತು ಪರಿಸರ ಅನುಮೋದನೆಯ ಸ್ಥಿತಿ ಏನು?' },
      { category: '⚠️ ಅಪಾಯಗಳು', prompt: 'ಯೋಜನೆಗೆ ಎದುರಾಗಬಹುದಾದ ಪ್ರಮುಖ ಅಪಾಯಗಳು ಮತ್ತು ಪರಿಹಾರ ಕ್ರಮಗಳು ಯಾವುವು?' },
      { category: '⏱️ ಕಾಲಮಿತಿ', prompt: 'ಕಾಮಗಾರಿಯ ಒಟ್ಟು ಕಾಲಮಿತಿ ಮತ್ತು ಪೂರ್ಣಗೊಳ್ಳುವ ದಿನಾಂಕ ಏನು?' },
    ],
    hi: [
      { category: '⚡ सारांश', prompt: 'कुल परियोजना निर्माण लागत और बजट का विवरण क्या है?' },
      { category: '🏗️ तकनीकी', prompt: 'प्रस्तावित सड़क की परतें (BC/DBM) और सबग्रेड CBR मान क्या है?' },
      { category: '💰 बजट', prompt: 'सिविल कार्य और भूमि अधिग्रहण (LARR 2013) लागत का विवरण दें' },
      { category: '🌿 मंजूरियां', prompt: 'वन संरक्षण (FCA 1980) और पर्यावरणीय मंजूरी की स्थिति क्या है?' },
      { category: '⚠️ जोखिम', prompt: 'शीर्ष 5 जोखिम कारक और शमन कार्ययोजना की व्याख्या करें' },
      { category: '⏱️ समय-सीमा', prompt: 'निर्माण कार्य की समय-सीमा और मुख्य मील के पत्थर क्या हैं?' },
    ]
  };

  const currentPrompts = localizedQuickPrompts[selectedLanguage] || localizedQuickPrompts.en;
  const displayTitle = title || (moduleType === 'admin' ? 'Admin DPR AI Intelligence Assistant' : 'DPR AI Intelligence Assistant');

  return (
    <>
      <Topbar
        title={displayTitle}
        subtitle="Extracts raw DPR tables, costs, and blueprints, explaining them in simple human-readable language with exact page citations"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/dpr/upload" className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Upload DPR
            </Link>
            <button
              className="topbar-btn"
              onClick={loadProjectsAndPages}
              disabled={loadingProjects}
              title="Refresh DPR list"
            >
              <RefreshCw size={14} className={loadingProjects ? 'spin-icon' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── 1. HEADER & DPR SELECTOR STRIP ── */}
        <div className="card" style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            
            {/* Left: DPR Dropdown Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(147,51,234,0.3))', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                <Bot size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Target DPR Document:
                </div>
                <select
                  value={selectedProjectId}
                  onChange={e => handleSelectProject(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', maxWidth: 460, marginTop: 3, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#fff' }}
                  disabled={loadingProjects || projects.length === 0}
                >
                  {projects.length === 0 ? (
                    <option value="">No DPR documents available</option>
                  ) : (
                    projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {SECTOR_ICONS[p.sector] || '📁'} {p.title || p.filename} ({p.sector || 'Infrastructure'} · ₹{p.estimated_cost?.toFixed(0)} Cr)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Middle: Active DPR Quick Info */}
            {activeProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sector: </span>
                  <strong style={{ color: '#fff' }}>{activeProject.sector || 'Roads'}</strong>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                  <strong style={{ color: '#fff' }}>{activeProject.district ? `${activeProject.district}, ` : ''}{activeProject.state || 'Karnataka'}</strong>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cost: </span>
                  <strong style={{ color: 'var(--accent-green)' }}>₹{activeProject.estimated_cost?.toFixed(1)} Cr</strong>
                </div>
              </div>
            )}

            {/* Right: Multi-Language Selector Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Globe size={13} color="var(--accent-blue)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Lang:</span>
              <button
                onClick={() => setSelectedLanguage('en')}
                style={{
                  background: selectedLanguage === 'en' ? 'var(--accent-blue)' : 'transparent',
                  color: selectedLanguage === 'en' ? '#fff' : 'var(--text-secondary)',
                  border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                EN
              </button>
              <button
                onClick={() => setSelectedLanguage('kn')}
                style={{
                  background: selectedLanguage === 'kn' ? 'var(--accent-blue)' : 'transparent',
                  color: selectedLanguage === 'kn' ? '#fff' : 'var(--text-secondary)',
                  border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setSelectedLanguage('hi')}
                style={{
                  background: selectedLanguage === 'hi' ? 'var(--accent-blue)' : 'transparent',
                  color: selectedLanguage === 'hi' ? '#fff' : 'var(--text-secondary)',
                  border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                हिन्दी
              </button>
            </div>

          </div>
        </div>

        {/* ── 2. CHAT STREAM CONTAINER WITH STRUCTURED RESPONSE CARDS ── */}
        <div className="card" style={{ padding: 20, minHeight: 460, maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <Bot size={40} style={{ margin: '0 auto 12px', color: 'var(--accent-blue)' }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {selectedLanguage === 'kn'
                  ? 'ಕರ್ನಾಟಕ ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ (PWD) ಡಿಪಿಆರ್ ಸರಳ ವಿವರಣೆ ಸಹಾಯಕ'
                  : selectedLanguage === 'hi'
                  ? 'कर्नाटक लोक निर्माण विभाग (PWD) डीपीआर सरल व्याख्या सहायक'
                  : 'Karnataka PWD DPR Intelligence Assistant'}
              </div>
              <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 580, margin: '4px auto 20px', lineHeight: 1.6 }}>
                {selectedLanguage === 'kn'
                  ? 'ಯಾವುದೇ ಸಂಕೀರ್ಣ ತಾಂತ್ರಿಕ ವಿವರ, ಬಜೆಟ್ ಅಂದಾಜು ಅಥವಾ ಇಂಜಿನಿಯರಿಂಗ್ ರೇಖಾಚಿತ್ರಗಳನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ. ಪ್ರತಿ ಉತ್ತರಕ್ಕೂ ಮೂಲ ಪುಟ ಸಂಖ್ಯೆ ಮತ್ತು ವಿಭಾಗವನ್ನು ಒದಗಿಸಲಾಗುತ್ತದೆ.'
                  : selectedLanguage === 'hi'
                  ? 'जटिल तकनीकी डेटा, बजट अनुमान और इंजीनियरिंग आरेखों को सरल भाषा में समझें। प्रत्येक उत्तर के साथ सटीक पृष्ठ संख्या और संदर्भ अनुभाग दिया जाएगा।'
                  : 'Extract and understand raw technical data, financial budgets, and blueprints in simple, clear human-readable language with verifiable page numbers and section citations.'}
              </div>

              {/* Categorized Suggested Starter Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, maxWidth: 860, margin: '0 auto', textAlign: 'left' }}>
                {currentPrompts.map((qp, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSendMessage(qp.prompt)}
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {qp.category}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {qp.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {messages.map((msg, msgIdx) => (
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
                    maxWidth: '90%',
                    padding: '16px 20px',
                    borderRadius: 12,
                    background: msg.sender === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.95)',
                    border: msg.sender === 'user' ? '1px solid var(--accent-blue)' : '1px solid rgba(59, 130, 246, 0.25)',
                    color: 'var(--text-primary)',
                    fontSize: 13.5,
                    lineHeight: 1.75
                  }}>
                    {/* User Message */}
                    {msg.sender === 'user' && (
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                    )}

                    {/* Assistant Message with Structured Easy-to-Understand Layout */}
                    {msg.sender === 'assistant' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        
                        {/* 1. Header Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Bot size={15} /> {msg.engine || 'Karnataka PWD Intelligence Assistant'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.3)' }}>
                              ✓ Confidence: {msg.confidence_level || 'High (95%)'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleSpeakText(msg.text)}
                              style={{ background: 'none', border: 'none', color: isSpeaking ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                              title="Read Aloud (Text-to-Speech)"
                            >
                              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            <button
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              style={{ background: 'none', border: 'none', color: copiedMsgId === msg.id ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                              title="Copy Full Response"
                            >
                              {copiedMsgId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* 2. Structured Response Content */}
                        <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, fontSize: 13.5 }}>
                          {msg.text}
                        </div>

                        {/* 3. Citations & Transparency Verification Bar */}
                        <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                📄 Verified Page(s):
                              </span>
                              {msg.cited_pages && msg.cited_pages.map(pg => (
                                <button
                                  key={pg}
                                  onClick={() => setInspectPageNum(pg)}
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.25)',
                                    border: '1px solid rgba(59, 130, 246, 0.45)',
                                    color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                  }}
                                  title={`Click to open exact Page ${pg} in OCR Inspector`}
                                >
                                  Page {pg} <Eye size={10} color="var(--accent-blue)" />
                                </button>
                              ))}
                            </div>

                            {msg.source_section && (
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <strong>Section:</strong> {msg.source_section}
                              </div>
                            )}
                          </div>

                          {/* Guidelines Applied */}
                          {msg.guidelines_applied && msg.guidelines_applied.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Standards:</span>
                              {msg.guidelines_applied.map((g, gIdx) => (
                                <span key={gIdx} style={{ fontSize: 10, color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4. Cited Visual Blueprint Thumbnails */}
                        {msg.cited_images && msg.cited_images.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                              {selectedLanguage === 'kn' ? 'ಸಂಬಂಧಿತ ರೇಖಾಚಿತ್ರಗಳು & ನಕ್ಷೆಗಳು:' : selectedLanguage === 'hi' ? 'संबंधित आरेख व मानचित्र:' : 'Cited Diagrams & Drawings:'}
                            </span>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                              {msg.cited_images.map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  onClick={() => setActivePreviewImage(img)}
                                  style={{
                                    width: 140, background: '#000', borderRadius: 6, padding: 4,
                                    border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', flexShrink: 0
                                  }}
                                >
                                  <img src={`${API_BASE}${img.image_url}`} alt="Blueprint" style={{ width: '100%', height: 75, objectFit: 'contain' }} />
                                  <div style={{ fontSize: 10, color: '#fff', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Page {img.page_number} · {img.type_label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Dynamic Context-Aware Follow-Up Suggestions */}
                        {msgIdx === messages.length - 1 && msg.follow_up_suggestions && msg.follow_up_suggestions.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Sparkles size={12} />
                              {selectedLanguage === 'kn' ? 'ಮುಂದಿನ ಪ್ರಶ್ನೆಗಳ ಸಲಹೆಗಳು:' : selectedLanguage === 'hi' ? 'सुझाए गए अनुवर्ती प्रश्न:' : 'Contextual Follow-Up Suggestions:'}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {msg.follow_up_suggestions.map((fu, fuIdx) => (
                                <button
                                  key={fuIdx}
                                  onClick={() => handleSendMessage(fu)}
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.12)',
                                    border: '1px solid rgba(59, 130, 246, 0.25)',
                                    color: '#fff', borderRadius: 14, padding: '4px 10px',
                                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 4
                                  }}
                                >
                                  {fu} <ArrowRight size={10} color="var(--accent-blue)" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '0 6px' }}>{msg.timestamp}</span>
                </div>
              ))}

              {isQuerying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, width: 'fit-content' }}>
                  <div style={{ width: 14, height: 14, border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {selectedLanguage === 'kn'
                      ? 'ಡಿಪಿಆರ್ ಡೇಟಾವನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...'
                      : selectedLanguage === 'hi'
                      ? 'डीपीआर डेटा का सरल भाषा में विश्लेषण किया जा रहा है...'
                      : 'Analyzing raw DPR data and preparing simple plain-language explanation...'}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── 3. PERSISTENT QUICK ACTIONS CHIPS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
            {selectedLanguage === 'kn' ? 'ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳು:' : selectedLanguage === 'hi' ? 'त्वरित प्रश्न:' : 'Quick Actions:'}
          </span>
          {currentPrompts.map((qa, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSendMessage(qa.prompt)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
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
              {qa.category}
            </button>
          ))}
        </div>

        {/* ── 4. CHAT INPUT & VOICE RECORDING BOX ── */}
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isRecording && (
            <div style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                Listening... Speak your DPR question now
              </span>
              <button onClick={toggleVoiceRecording} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Stop Recording
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder={
                selectedLanguage === 'kn'
                  ? 'ಡಿಪಿಆರ್ ಕುರಿತು ಯಾವುದೇ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಕೇಳಿ (ಉದಾ: ಒಟ್ಟು ವೆಚ್ಚ ಎಷ್ಟು?)...'
                  : selectedLanguage === 'hi'
                  ? 'डीपीआर के बारे में कोई भी प्रश्न पूछें (उदा: कुल परियोजना लागत क्या है?)...'
                  : 'Ask any question (e.g. What is the total project cost? What is the pavement design?)...'
              }
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              className="select-field"
              style={{ flex: 1, padding: '10px 14px', fontSize: 13.5 }}
            />

            {/* Voice Input Button */}
            {speechSupported && (
              <button
                onClick={toggleVoiceRecording}
                style={{
                  background: isRecording ? '#ef4444' : 'rgba(255,255,255,0.06)',
                  border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', borderRadius: 8, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={isRecording ? 'Stop Voice Input' : 'Speak Question (Voice Input)'}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            {/* Send Query Button */}
            <button
              className="btn btn-primary"
              onClick={() => handleSendMessage()}
              disabled={isQuerying || !inputText.trim()}
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <Send size={15} />
              Send
            </button>
          </div>

          {/* Bottom Utility Actions Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 11.5, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <span>✓ Grounded in Karnataka PWD SoR &amp; IRC Codes</span>
              <span>✓ Verifiable Page &amp; Section Citations</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {messages.length > 0 && (
                <>
                  <button
                    onClick={handleExportTranscript}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Download size={12} /> Export Chat Report (.txt)
                  </button>
                  <button
                    onClick={() => setMessages([])}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11.5, cursor: 'pointer' }}
                  >
                    Clear Chat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. INTERACTIVE DPR PAGE INSPECTOR MODAL ── */}
      {inspectPageNum !== null && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setInspectPageNum(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 880, width: '100%', maxHeight: '88vh', background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent-blue)" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  DPR Page Inspector: Page {inspectPageNum}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ({activeProject?.title || activeProject?.filename})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleCopyInspectedPageText(inspectedPageObj?.text || inspectedPageObj?.page_text || '')}
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {pageTextCopied ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                  {pageTextCopied ? 'Copied' : 'Copy Page Text'}
                </button>
                <button onClick={() => setInspectPageNum(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Verbatim extracted OCR text layer from DPR Page {inspectPageNum}:
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8,
                background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap', color: 'var(--text-primary)'
              }}>
                {inspectedPageObj ? (inspectedPageObj.text || inspectedPageObj.page_text || 'No readable text layer on this drawing page.') : `Loading extracted text for Page ${inspectPageNum}...`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. IMAGE PREVIEW LIGHTBOX MODAL ── */}
      {activePreviewImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setActivePreviewImage(null)}>
          <div className="card" style={{ maxWidth: 840, width: '100%', maxHeight: '85vh', background: '#0f172a', border: '1px solid rgba(59,130,246,0.4)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Page {activePreviewImage.page_number} · {activePreviewImage.type_label}</span>
              <button onClick={() => setActivePreviewImage(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#000', borderRadius: 8, maxHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={`${API_BASE}${activePreviewImage.image_url}`} alt="Blueprint" style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 12.5, color: '#fff', lineHeight: 1.5, background: 'rgba(59,130,246,0.08)', padding: 10, borderRadius: 6 }}>
              {activePreviewImage.ai_description}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
