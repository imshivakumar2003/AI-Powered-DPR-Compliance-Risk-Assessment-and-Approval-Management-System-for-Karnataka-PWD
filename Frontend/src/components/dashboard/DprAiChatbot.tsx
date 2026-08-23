// TOPLINE
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Bot, User, Sparkles, X, Key,
  RefreshCw, Copy, Check, ChevronDown, Cpu, Shield,
  HelpCircle, Lightbulb, ExternalLink, Sliders
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  isFallback?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const QUICK_PROMPTS = [
  "How do I track my DPR application status?",
  "What clearances are needed for road DPRs in Karnataka?",
  "What is the standard contingency buffer per MoRTH?",
  "Explain AI Quality and Risk Scores",
  "Check high-risk DPR projects in Mysuru or Bengaluru",
];

export function DprAiChatbot({ embedded = false }: { embedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am **DPR-AI Assistant**, powered by **Groq AI** (`llama-3.3-70b-versatile`).\n\nHow can I help you with Karnataka PWD DPR applications, MoRTH guidelines, compliance checks, or application status tracking today?',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      model: 'llama-3.3-70b-versatile',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Groq API Key state
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('groq_api_key') || '';
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, messages, loading]);

  const saveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('groq_api_key', trimmed);
      } else {
        localStorage.removeItem('groq_api_key');
      }
    } catch (e) {
      console.error('Error saving API key:', e);
    }
    setShowKeyModal(false);
  };

  const handleSend = async (customMsg?: string) => {
    const query = (customMsg || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMsg) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          api_key: apiKey || undefined,
          model: 'llama-3.3-70b-versatile',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'No response generated.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          model: data.model,
          isFallback: data.is_fallback,
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (e) {
      console.error('Error calling chat API:', e);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I am currently operating in offline guide mode. Regarding **"${query}"**: Karnataka PWD DPR guidelines require complete technical BOQ specs, NABL soil bearing capacity tests (SPT), land acquisition NOCs (LARR Act 2013), and 25-year O&M projections. You can inspect detailed AI scores and status tracking in the Application Status portal.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        model: 'domain-fallback',
        isFallback: true,
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMarkdown = (text: string) => {
    // Simple inline formatting for bold, code, and bullet lists
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let formatted = line;
      // Bold **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code `text`
      formatted = formatted.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>');
      
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim());
      
      return (
        <div key={i} style={{ marginBottom: line.trim() === '' ? 6 : 3, paddingLeft: isBullet ? 8 : 0 }}
          dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <>
      {/* ── Floating Action Trigger (if not embedded) ── */}
      {!embedded && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 20px', borderRadius: 30,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: 'white', border: 'none',
            boxShadow: '0 8px 25px rgba(6,182,212,0.4)',
            cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Bot size={20} />
            <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '2px solid #06b6d4' }} />
          </div>
          <span>DPR-AI Chatbot</span>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: 10, fontWeight: 800 }}>
            GROQ AI
          </span>
        </button>
      )}

      {/* ── Chat Window Drawer / Container ── */}
      {isOpen && (
        <div
          style={{
            position: embedded ? 'relative' : 'fixed',
            bottom: embedded ? 0 : 24, right: embedded ? 0 : 24,
            width: embedded ? '100%' : 440,
            height: embedded ? 580 : 620,
            maxHeight: embedded ? 'none' : 'calc(100vh - 40px)',
            zIndex: embedded ? 1 : 9999,
            borderRadius: 16,
            background: '#0f172a',
            border: '1px solid rgba(6,182,212,0.3)',
            boxShadow: embedded ? '0 10px 30px rgba(0,0,0,0.3)' : '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  DPR-AI Assistant
                  <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.2)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', fontWeight: 800 }}>
                    GROQ AI
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  {apiKey ? 'Groq Key Active' : 'Groq AI · llama-3.3-70b-versatile'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setShowKeyModal(true)}
                title="Configure Groq API Key"
                style={{ padding: '6px 9px', borderRadius: 7, background: apiKey ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)', border: `1px solid ${apiKey ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, color: apiKey ? '#22c55e' : 'var(--text-muted)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
              >
                <Key size={12} /> {apiKey ? 'Key Set' : 'Groq Key'}
              </button>

              {!embedded && (
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ padding: 6, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  padding: '4px 10px', borderRadius: 14, background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee',
                  fontSize: 10.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  flexShrink: 0
                }}
              >
                ⚡ {prompt}
              </button>
            ))}
          </div>

          {/* Messages Window */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: isUser ? '#60a5fa' : '#22d3ee' }}>
                      {isUser ? 'You' : 'DPR-AI Assistant'}
                    </span>
                    <span>{m.timestamp}</span>
                    {m.model && (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        [{m.isFallback ? 'Fallback Engine' : m.model}]
                      </span>
                    )}
                  </div>

                  <div style={{
                    maxWidth: '88%', padding: '12px 16px', borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    background: isUser ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(30,41,59,0.9)',
                    border: `1px solid ${isUser ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: 'var(--text-primary)', fontSize: 12.5, lineHeight: 1.6, position: 'relative'
                  }}>
                    {isUser ? m.content : formatMarkdown(m.content)}

                    {!isUser && (
                      <button
                        onClick={() => copyText(m.content, m.id)}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.7 }}
                        title="Copy answer"
                      >
                        {copiedId === m.id ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22d3ee', fontSize: 12, padding: '8px 12px', background: 'rgba(6,182,212,0.08)', borderRadius: 8, width: 'fit-content' }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Groq AI is thinking…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask any DPR query (clearances, SoR rates, status)…"
              style={{
                flex: 1, padding: '9px 12px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                padding: '9px 14px', borderRadius: 8,
                background: input.trim() ? 'linear-gradient(135deg, #06b6d4, #2563eb)' : 'var(--bg-secondary)',
                color: input.trim() ? 'white' : 'var(--text-muted)',
                border: 'none', fontSize: 12, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
              }}
            >
              <Send size={13} /> Send
            </button>
          </div>
        </div>
      )}

      {/* ── Groq API Key Configuration Modal ── */}
      {showKeyModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={16} color="#22c55e" /> Groq AI API Key Configuration
              </div>
              <button onClick={() => setShowKeyModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Enter your custom **Groq AI API Key** (`gsk_...`) to connect directly to Groq's high-speed LLM engine (`llama-3.3-70b-versatile`).
            </div>

            <input
              type="password"
              placeholder="gsk_..."
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                fontSize: 12.5, outline: 'none', fontFamily: 'monospace', marginBottom: 16, boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setTempApiKey(''); saveApiKey(); }}
                style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
              >
                Clear Key
              </button>

              <button
                onClick={saveApiKey}
                style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--accent-blue)', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
