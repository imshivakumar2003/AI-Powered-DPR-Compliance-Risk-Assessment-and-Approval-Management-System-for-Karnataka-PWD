// TOPLINE

'use client';
import { Topbar } from '@/components/layout/Topbar';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, User, Key, X, Check } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ApiUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  disabled: boolean;
  created_at: string;
  last_login: string | null;
}

const ROLE_BADGES: Record<string, string> = {
  admin:         'badge-high',
  director:      'badge-high',
  reviewer:      'badge-review',
  'State Reviewer': 'badge-review',
  analyst:       'badge-processing',
  viewer:        'badge-processing',
  user:          'badge-processing',
};

const ROLES = ['DPR Submitter', 'State Reviewer', 'Director', 'Administrator'];
const STATES = ['Karnataka PWD HQ', 'Karnataka PWD', 'Bengluru', '', 'Kalaburagi', 'Belagavi', 'Mysuru', 'Dharwad', 'Dakshina Kannada'];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

export default function UsersPage() {
  const [users, setUsers]     = useState<ApiUser[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Add-user form state
  const [newName,    setNewName]    = useState('');
  const [newEmail,   setNewEmail]   = useState('');
  const [newUser,    setNewUser]    = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [newRole,    setNewRole]    = useState('DPR Submitter');
  const [newDept,    setNewDept]    = useState('Karnataka PWD HQ');
  const [addErr,     setAddErr]     = useState('');
  const [adding,     setAdding]     = useState(false);

  // Edit state — only one row editable at a time
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editRole,   setEditRole]   = useState('');
  const [editDept,   setEditDept]   = useState('');
  const [editDis,    setEditDis]    = useState(false);
  const [editErr,    setEditErr]    = useState('');
  const [saving,     setSaving]     = useState(false);

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/users`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setUsers(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  // ── Create ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim() || !newUser.trim() || !newPass.trim()) {
      setAddErr('All fields are required.'); return;
    }
    setAdding(true); setAddErr('');
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUser.trim(),
          password: newPass,
          full_name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          department: newDept,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { detail?: string }).detail || `Error ${res.status}`);
      }
      const created: ApiUser = await res.json();
      setUsers(prev => [...prev, created]);
      setShowAdd(false);
      setNewName(''); setNewEmail(''); setNewUser(''); setNewPass('');
      setNewRole('DPR Submitter'); setNewDept('Karnataka PWD HQ');
    } catch (e: unknown) {
      setAddErr(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  // ── Start edit ────────────────────────────────────────────────────────────
  const startEdit = (u: ApiUser) => {
    setEditId(u.id);
    setEditRole(u.role);
    setEditDept(u.department);
    setEditDis(u.disabled);
    setEditErr('');
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const saveEdit = async (username: string) => {
    setSaving(true); setEditErr('');
    try {
      const res = await fetch(`${API_URL}/auth/users/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, department: editDept, disabled: editDis }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { detail?: string }).detail || `Error ${res.status}`);
      }
      const updated: ApiUser = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditId(null);
    } catch (e: unknown) {
      setEditErr(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/auth/users/${username}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { detail?: string }).detail || `Error ${res.status}`);
      }
      setUsers(prev => prev.filter(u => u.username !== username));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete user');
    }
  };

  return (
    <>
      <Topbar
        title="User Management"
        subtitle="Manage Karnataka PWD portal users and role assignments"
        actions={
          <button className="topbar-btn primary" onClick={() => { setShowAdd(!showAdd); setAddErr(''); }}>
            <Plus size={14} /> Add User
          </button>
        }
      />
      <div className="page-content fade-in">

        {/* Add User Form */}
        {showAdd && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Add New User</div>
              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
            <div className="card-body">
              <div className="grid-3" style={{ gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Full Name *</label>
                  <input className="input-field" placeholder="e.g. Rajiv Sharma" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Username *</label>
                  <input className="input-field" placeholder="e.g. r.sharma" value={newUser} onChange={e => setNewUser(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Email (Gov ID) *</label>
                  <input className="input-field" placeholder="name@state.gov.in" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Temporary Password *</label>
                  <input className="input-field" placeholder="Min 4 characters" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Role</label>
                  <select className="select-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">State / Department</label>
                  <select className="select-field" value={newDept} onChange={e => setNewDept(e.target.value)}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {addErr && <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444' }}>⚠ {addErr}</div>}
              <div style={{ marginTop: 14 }}>
                <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
                  {adding ? 'Creating…' : 'Create User & Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Legend */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Director', icon: <Shield size={12} />, desc: 'Full access — approve/reject DPRs' },
            { label: 'State Reviewer', icon: <User size={12} />, desc: 'Review and comment on DPRs' },
            { label: 'DPR Submitter', icon: <Key size={12} />, desc: 'Submit DPRs and track status' },
          ].map(r => (
            <div key={r.label} className="info-box blue" style={{ flex: 1, minWidth: 200, gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 11 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
            ⚠ {error}
          </div>
        )}

        {/* Users Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{loading ? 'Loading…' : `${filtered.length} Users`}</div>
              <div className="card-subtitle">All portal accounts across Karnataka PWD and NE states</div>
            </div>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: 28 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>State / Dept</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const isEditing = editId === user.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'white',
                        }}>
                          {initials(user.full_name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{user.full_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{user.email}</td>
                    <td>
                      {isEditing ? (
                        <select className="select-field" style={{ fontSize: 12, padding: '4px 8px' }} value={editRole} onChange={e => setEditRole(e.target.value)}>
                          {ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`badge ${ROLE_BADGES[user.role] || 'badge-processing'}`}>{user.role}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="select-field" style={{ fontSize: 12, padding: '4px 8px' }} value={editDept} onChange={e => setEditDept(e.target.value)}>
                          {STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      ) : user.department}
                    </td>
                    <td>
                      {isEditing ? (
                        <div
                          onClick={() => setEditDis(!editDis)}
                          style={{
                            width: 42, height: 22, borderRadius: 11, cursor: 'pointer',
                            background: !editDis ? 'var(--accent-blue)' : 'var(--border)',
                            position: 'relative', transition: 'background 0.2s',
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: 3, left: !editDis ? 22 : 3,
                            width: 16, height: 16, borderRadius: '50%', background: 'white',
                            transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                          }} />
                        </div>
                      ) : (
                        <span className={`badge ${!user.disabled ? 'badge-approved' : 'badge-rejected'}`}>
                          {user.disabled ? 'Inactive' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(user.last_login)}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-success" style={{ padding: '5px 8px' }} onClick={() => saveEdit(user.username)} disabled={saving}>
                              {saving ? '…' : <Check size={12} />}
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '5px 8px' }} onClick={() => setEditId(null)}>
                              <X size={12} />
                            </button>
                          </div>
                          {editErr && <div style={{ fontSize: 11, color: '#ef4444' }}>{editErr}</div>}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary" style={{ padding: '5px 8px' }} onClick={() => startEdit(user)} title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(user.username)} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
