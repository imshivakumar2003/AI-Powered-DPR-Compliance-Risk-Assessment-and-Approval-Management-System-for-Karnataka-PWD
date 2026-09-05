// TOPLINE

'use client';
import { Topbar } from '@/components/layout/Topbar';
import { useState, useEffect } from 'react';
import { Save, Brain, RefreshCw, Database, Bell, Globe, Loader, Key, Eye, EyeOff, Sparkles, ExternalLink, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { fetchSettings, saveSettings } from '@/lib/api';
import { useTheme, Theme } from '@/lib/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [riskThreshold, setRiskThreshold] = useState(70);
  const [emailAlerts, setEmailAlerts]     = useState(true);
  const [autoAssign, setAutoAssign]       = useState(true);
  const [lang, setLang]                   = useState('en');
  const [groqApiKey, setGroqApiKey]       = useState('');
  const [showApiKey, setShowApiKey]       = useState(false);

  // Load persisted settings from the database when the page opens
  useEffect(() => {
    fetchSettings().then(s => {
      setRiskThreshold(s.risk_threshold);
      setEmailAlerts(s.email_alerts);
      setAutoAssign(s.auto_assign);
      setLang(s.language);
      setGroqApiKey(s.groq_api_key || '');
      if (s.theme) {
        setTheme(s.theme);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveSettings({
        risk_threshold: riskThreshold,
        email_alerts:   emailAlerts,
        auto_assign:    autoAssign,
        language:       lang,
        groq_api_key:   groqApiKey.trim(),
        theme:          theme,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="Settings" subtitle="Configure portal behaviour, ML thresholds, and notifications" />
        <div className="page-content fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Loading settings…
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Configure portal appearance, ML thresholds, and notifications" />
      <div className="page-content fade-in" style={{ maxWidth: 820 }}>

        {saved && (
          <div className="info-box green" style={{ marginBottom: 16 }}>
            ✓ Settings and theme preferences saved successfully and will persist across restarts.
          </div>
        )}
        {error && (
          <div className="info-box" style={{ marginBottom: 16, borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.08)' }}>
            ✕ {error}
          </div>
        )}

        {/* ── Appearance & Theme Configuration ── */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Palette size={16} color="var(--accent-blue)" />
                <div>
                  <div className="card-title">Appearance &amp; Theme Mode</div>
                  <div className="card-subtitle">Choose between Light, Dark, or System themes across all modules</div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)',
                border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 5
              }}>
                Active: {resolvedTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {/* Light Mode Card */}
              <div
                onClick={() => setTheme('light')}
                style={{
                  padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `2px solid ${theme === 'light' ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: theme === 'light' ? 'var(--accent-blue-glow)' : 'var(--bg-card)',
                  boxShadow: theme === 'light' ? '0 0 12px rgba(37, 99, 235, 0.2)' : 'none',
                  transition: 'all 0.2s ease', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sun size={18} color="#f59e0b" />
                  </div>
                  {theme === 'light' && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Selected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  ☀️ Light Mode
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Clean government standard appearance with high contrast, bright cards, and crisp slate typography.
                </div>
              </div>

              {/* Dark Mode Card */}
              <div
                onClick={() => setTheme('dark')}
                style={{
                  padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: theme === 'dark' ? 'var(--accent-blue-glow)' : 'var(--bg-card)',
                  boxShadow: theme === 'dark' ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none',
                  transition: 'all 0.2s ease', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Moon size={18} color="#3b82f6" />
                  </div>
                  {theme === 'dark' && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Selected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  🌙 Dark Mode
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Deep slate &amp; navy surfaces designed for low light environments, reduced eye strain, and high contrast.
                </div>
              </div>

              {/* System Theme Card */}
              <div
                onClick={() => setTheme('system')}
                style={{
                  padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `2px solid ${theme === 'system' ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: theme === 'system' ? 'var(--accent-blue-glow)' : 'var(--bg-card)',
                  boxShadow: theme === 'system' ? '0 0 12px rgba(147, 51, 234, 0.2)' : 'none',
                  transition: 'all 0.2s ease', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(147, 51, 234, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={18} color="var(--accent-purple)" />
                  </div>
                  {theme === 'system' && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Selected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  💻 System Sync
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Automatically synchronizes with your device&apos;s OS preference (Dark or Light) in real time.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ML Model Settings */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Brain size={16} color="var(--accent-purple)" />
              <div>
                <div className="card-title">AI / ML Configuration</div>
                <div className="card-subtitle">Risk model thresholds and scoring weights</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="label">Risk Alert Threshold — {riskThreshold}%</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0%</span>
                <input
                  type="range" min={40} max={90} value={riskThreshold}
                  onChange={e => setRiskThreshold(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-blue)' }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>90%</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: riskThreshold > 70 ? 'var(--accent-amber)' : 'var(--accent-green)', minWidth: 36 }}>
                  {riskThreshold}%
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                Projects scoring above this threshold are flagged as High Risk. Currently: {riskThreshold}%
              </div>
            </div>

            <div className="divider" />

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Quality Dimension Weights
            </div>
            {[
              { name: 'Technical Soundness', weight: 20 },
              { name: 'Financial Realism', weight: 18 },
              { name: 'Risk Identification', weight: 16 },
              { name: 'Timeline Feasibility', weight: 14 },
              { name: 'Environmental Compliance', weight: 12 },
              { name: 'Stakeholder Engagement', weight: 8 },
              { name: 'Procurement Clarity', weight: 7 },
              { name: 'Sustainability', weight: 5 },
            ].map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 180 }}>{d.name}</span>
                <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                  <div className="progress-fill" style={{ width: `${d.weight * 5}%`, background: 'var(--accent-blue)' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', minWidth: 32 }}>{d.weight}%</span>
              </div>
            ))}
            <div className="info-box blue" style={{ marginTop: 8 }}>
              <RefreshCw size={13} style={{ flexShrink: 0, color: 'var(--accent-blue)', marginTop: 1 }} />
              <span>Recalibrate the model with new project outcomes via the admin panel. Weights are updated monthly using the XGBoost feature importance algorithm.</span>
            </div>
          </div>
        </div>

        {/* Groq AI API Key & Model Configuration */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={16} color="var(--accent-blue)" />
                <div>
                  <div className="card-title">Groq AI API Key Configuration</div>
                  <div className="card-subtitle">Set Groq API key for real-time Llama-3.3-70B AI Assistant reasoning</div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: groqApiKey.trim() ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: groqApiKey.trim() ? 'var(--accent-green)' : 'var(--accent-amber)',
                border: `1px solid ${groqApiKey.trim() ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <Sparkles size={11} />
                {groqApiKey.trim() ? 'LLM Active (Groq Llama-3.3-70B)' : 'Offline (DPR Knowledge Engine)'}
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Groq API Key</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  Get Free API Key <ExternalLink size={10} />
                </a>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="gsk_..."
                    value={groqApiKey}
                    onChange={e => setGroqApiKey(e.target.value)}
                    className="select-field"
                    style={{ width: '100%', paddingRight: 40, fontFamily: showApiKey ? 'monospace' : 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                      padding: 4, display: 'flex', alignItems: 'center'
                    }}
                    title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                Persisting your Groq API key enables live, high-speed LLM reasoning for the <strong>DPR AI Assistant</strong> across all pages and user roles. If left blank, the assistant automatically utilizes the built-in Karnataka PWD &amp; MoRTH DPR Knowledge Engine.
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={16} color="var(--accent-amber)" />
              <div>
                <div className="card-title">Notifications</div>
                <div className="card-subtitle">Alert and email notification preferences</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {[
              { label: 'Email alerts for High-Risk DPRs', sub: 'Send email when a DPR exceeds risk threshold', val: emailAlerts, set: setEmailAlerts },
              { label: 'Auto-assign reviewers', sub: 'Automatically assign DPRs to available Karnataka PWD reviewers', val: autoAssign, set: setAutoAssign },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
                <div
                  onClick={() => item.set(!item.val)}
                  style={{
                    width: 42, height: 22, borderRadius: 11,
                    background: item.val ? 'var(--accent-blue)' : 'var(--border)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: item.val ? 22 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language & Region */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Globe size={16} color="var(--accent-cyan)" />
              <div>
                <div className="card-title">Language &amp; Region</div>
                <div className="card-subtitle">Interface language and regional settings</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="label">Interface Language</label>
              <select className="select-field" style={{ maxWidth: 280 }} value={lang} onChange={e => setLang(e.target.value)}>
                <option value="en">English</option>
                <option value="en">ಕನ್ನಡ(Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                
              </select>
            </div>
            <div className="form-group">
              <label className="label">Date Format</label>
              <select className="select-field" style={{ maxWidth: 280 }}>
                <option>DD MMM YYYY (21 Apr 2026)</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={16} color="var(--accent-green)" />
              <div>
                <div className="card-title">System Information</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {[
              { key: 'Version', val: 'DPR-AI v1.0.0 (Karnataka PWD 2026)' },
              { key: 'API Endpoint', val: 'http://localhost:8000' },
              { key: 'ML Model', val: 'XGBoost v1.7.3 (Simulated)' },
              { key: 'Database', val: 'SQLite (auth.db)' },
              { key: 'NLP Engine', val: 'spaCy 3.7 + PyMuPDF' },
              { key: 'Developer', val: 'I M Shivakumar' },
            ].map((item, i, arr) => (
              <div key={item.key} style={{
                display: 'flex', gap: 16, padding: '9px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(45,55,72,0.5)' : 'none',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 140 }}>{item.key}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: 13, opacity: saving ? 0.7 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            : <><Save size={14} /> Save Settings</>
          }
        </button>
      </div>
    </>
  );
}
