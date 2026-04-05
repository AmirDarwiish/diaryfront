/**
 * src/pages/projects/components/MembersSprintsTabs.jsx
 * MembersTab + SprintsTab + StatsTab
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Trash2, UserPlus, Play, CheckCircle2, Calendar, Flag, Activity } from 'lucide-react'
import {
  getMembers, getSprints, getProjectStats,
  addMember, removeMember, createSprint,
  startSprint, completeSprint, deleteSprint,
} from '../../../services/projectService'
import ProjectStats from '../ProjectStats'

const S = {
  card:    { background: '#0d1420', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 },
  input:   { width: '100%', boxSizing: 'border-box', height: 40, background: '#080d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e8edf5', fontSize: 13, padding: '0 12px', fontFamily: "'Cairo',sans-serif", outline: 'none', transition: 'border-color .2s' },
  select:  { width: '100%', boxSizing: 'border-box', height: 40, background: '#080d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e8edf5', fontSize: 13, padding: '0 12px', fontFamily: "'Cairo',sans-serif", outline: 'none', cursor: 'pointer', appearance: 'none' },
  lbl:     { fontSize: 11, color: '#6b7891', fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.4px' },
  btnGold: { height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#d4a855,#C9A96E)', color: '#080d16', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 7 },
  btnGhost:{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6b7891', fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 6 },
}

const ROLE_CFG = {
  Owner:   { label: 'مالك',  color: '#C9A96E' },
  Manager: { label: 'مدير',  color: '#6ea8fe' },
  Member:  { label: 'عضو',   color: '#34d399' },
  Viewer:  { label: 'مشاهد', color: '#94a3b8' },
}

const SPRINT_CFG = {
  Planned:   { label: 'مخطط',  color: '#6ea8fe', bg: 'rgba(110,168,254,.12)' },
  Planning:  { label: 'مخطط',  color: '#6ea8fe', bg: 'rgba(110,168,254,.12)' },
  Active:    { label: 'نشط',   color: '#34d399', bg: 'rgba(52,211,153,.12)'  },
  Completed: { label: 'مكتمل', color: '#C9A96E', bg: 'rgba(201,169,110,.12)' },
}

// ── Members Tab ──────────────────────────────────────────
export function MembersTab({ projectId, currentUserRole }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState('Member')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    getMembers(projectId)
      .then((d) => { setMembers(Array.isArray(d) ? d : d?.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleAdd = async () => {
    if (!email.trim()) return
    setSaving(true); setError('')
    try {
      await addMember(projectId, { email, role })
      const updated = await getMembers(projectId)
      setMembers(Array.isArray(updated) ? updated : updated?.data || [])
      setEmail(''); setAddOpen(false)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleRemove = async (memberId) => {
    if (!window.confirm('إزالة العضو؟')) return
    try {
      await removeMember(projectId, memberId)
      setMembers((m) => m.filter((x) => x.id !== memberId))
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#C9A96E' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#e8edf5' }}>الأعضاء ({members.length})</div>
        {(currentUserRole === 'Owner' || currentUserRole === 'Manager') && (
          <button onClick={() => setAddOpen((v) => !v)} style={S.btnGold}><UserPlus size={14} /> إضافة عضو</button>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={S.lbl}>البريد الإلكتروني</label>
                  <input style={S.input} placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.4)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                </div>
                <div>
                  <label style={S.lbl}>الصلاحية</label>
                  <select style={S.select} value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="Viewer">مشاهد</option>
                    <option value="Member">عضو</option>
                    <option value="Manager">مدير</option>
                  </select>
                </div>
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAdd} disabled={saving} style={S.btnGold}>
                  {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} إضافة
                </button>
                <button onClick={() => setAddOpen(false)} style={S.btnGhost}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {members.map((m, i) => {
          const rc = ROLE_CFG[m.role] || { label: m.role, color: '#94a3b8' }
          return (
            <motion.div key={m.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ ...S.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `${rc.color}18`, border: `1px solid ${rc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc.color, fontWeight: 900, fontSize: 15 }}>
                {(m.fullName || m.name || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>{m.fullName || m.name || `مستخدم #${m.userId}`}</div>
                <div style={{ fontSize: 11, color: '#6b7891', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email || `ID: ${m.userId}`}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, background: `${rc.color}14`, color: rc.color, padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>{rc.label}</span>
                {currentUserRole === 'Owner' && m.role !== 'Owner' && (
                  <button onClick={() => handleRemove(m.id)} style={{ ...S.btnGhost, height: 30, padding: '0 8px', color: '#f8717170' }}><Trash2 size={12} /></button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sprints Tab ──────────────────────────────────────────
export function SprintsTab({ projectId }) {
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm]       = useState({ name: '', startDate: '', endDate: '' })
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    getSprints(projectId)
      .then((d) => { setSprints(Array.isArray(d) ? d : d?.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await createSprint(projectId, form)
      setSprints((s) => [...s, res?.data || res])
      setForm({ name: '', startDate: '', endDate: '' }); setAddOpen(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleStart    = async (id) => { try { await startSprint(id);    setSprints((s) => s.map((x) => ({ ...x, status: x.id === id ? 'Active' : (x.status === 'Active' ? 'Planned' : x.status) }))) } catch (e) { alert(e.message) } }
  const handleComplete = async (id) => { try { await completeSprint(id); setSprints((s) => s.map((x) => x.id === id ? { ...x, status: 'Completed' } : x)) } catch (e) { alert(e.message) } }
  const handleDelete   = async (id) => {
    if (!window.confirm('حذف السبرينت؟')) return
    try { await deleteSprint(id); setSprints((s) => s.filter((x) => x.id !== id)) } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#C9A96E' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#e8edf5' }}>السبرينتات ({sprints.length})</div>
        <button onClick={() => setAddOpen((v) => !v)} style={S.btnGold}><Plus size={14} /> سبرينت جديد</button>
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={S.lbl}>اسم السبرينت</label>
                  <input style={S.input} placeholder="Sprint 1" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.4)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={S.lbl}>تاريخ البداية</label>
                    <input type="date" style={S.input} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.lbl}>تاريخ النهاية</label>
                    <input type="date" style={S.input} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreate} disabled={saving} style={S.btnGold}>
                  {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} إنشاء
                </button>
                <button onClick={() => setAddOpen(false)} style={S.btnGhost}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sprints.length === 0
          ? <div style={{ textAlign: 'center', padding: 60, color: '#6b7891' }}>لا توجد سبرينتات بعد</div>
          : sprints.map((sp, i) => {
            const sc    = SPRINT_CFG[sp.status] || SPRINT_CFG.Planned
            const done  = sp.completedTasksCount ?? 0
            const total = sp.tasksCount ?? 0
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <motion.div key={sp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ ...S.card, padding: '16px 18px', borderRight: `3px solid ${sc.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#e8edf5', marginBottom: 4 }}>{sp.name}</div>
                    <span style={{ fontSize: 11, background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 6, fontWeight: 700 }}>{sc.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(sp.status === 'Planned' || sp.status === 'Planning') && (
                      <button onClick={() => handleStart(sp.id)} style={{ ...S.btnGold, height: 32, fontSize: 11 }}><Play size={12} /> بدء</button>
                    )}
                    {sp.status === 'Active' && (
                      <button onClick={() => handleComplete(sp.id)} style={{ ...S.btnGold, height: 32, fontSize: 11, background: 'rgba(52,211,153,.2)', color: '#34d399' }}><CheckCircle2 size={12} /> إكمال</button>
                    )}
                    {sp.status !== 'Active' && (
                      <button onClick={() => handleDelete(sp.id)} style={{ ...S.btnGhost, height: 32, color: '#f8717170' }}><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>

                {(sp.startDate || sp.endDate) && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    {sp.startDate && <span style={{ fontSize: 11, color: '#6b7891', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} color="#C9A96E" />{new Date(sp.startDate).toLocaleDateString('ar-EG')}</span>}
                    {sp.endDate   && <span style={{ fontSize: 11, color: '#6b7891', display: 'flex', alignItems: 'center', gap: 4 }}><Flag     size={11} color="#f87171" />{new Date(sp.endDate).toLocaleDateString('ar-EG')}</span>}
                  </div>
                )}

                {total > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#6b7891' }}>{done} / {total} تاسك</span>
                      <span style={{ fontSize: 11, color: sc.color, fontWeight: 800 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: '#080d16', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                        style={{ height: '100%', background: sc.color, borderRadius: 2 }} />
                    </div>
                  </>
                )}
              </motion.div>
            )
          })
        }
      </div>
    </div>
  )
}

// ── Stats Tab ────────────────────────────────────────────
export function StatsTab({ projectId }) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjectStats(projectId)
      .then((d) => { setStats(d?.data || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#C9A96E' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
  if (!stats)  return <div style={{ textAlign: 'center', padding: 60, color: '#6b7891' }}>لا توجد بيانات</div>

  const total_tasks        = stats.totalTasks        || stats.TotalTasks        || 0
  const completed_tasks    = stats.completedTasks    || stats.CompletedTasks    || stats.doneTasks    || 0
  const overdue_tasks      = stats.overdueTasks      || stats.OverdueTasks      || 0
  const in_progress_tasks  = stats.inProgressTasks   || stats.InProgressTasks   || stats.inProgress   || 0
  const completion_pct     = stats.completionPercentage || stats.CompletionPercentage || stats.progressPercent || 0
  const total_logged_hours = stats.totalLoggedHours  || stats.TotalLoggedHours  || stats.totalTimeLogged || 0
  const top_members        = stats.topMembers        || stats.TopMembers        || []

  const cards = [
    { label: 'إجمالي المهام',  value: total_tasks,       color: '#C9A96E' },
    { label: 'مكتملة',         value: completed_tasks,   color: '#34d399' },
    { label: 'متأخرة',         value: overdue_tasks,     color: '#f87171' },
    { label: 'قيد التنفيذ',    value: in_progress_tasks, color: '#6ea8fe' },
    { label: 'نسبة الإنجاز',   value: `${completion_pct}%`, color: '#a78bfa' },
    { label: 'ساعات مسجلة',    value: total_logged_hours ? `${Math.round(total_logged_hours / 60)}س` : '0س', color: '#fbbf24' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ ...S.card, padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: c.color, opacity: 0.35 }} />
            <div style={{ fontSize: 24, fontWeight: 900, color: '#e8edf5', marginBottom: 6 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: '#6b7891', fontWeight: 700 }}>{c.label}</div>
          </motion.div>
        ))}
      </div>

      <ProjectStats projectId={projectId} />

      {top_members.length > 0 && (
        <div style={{ ...S.card, padding: '18px 20px', marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#C9A96E', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={14} /> أكثر الأعضاء نشاطاً
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top_members.map((m, i) => {
              const memberName      = m.name || m.Name || '?'
              const memberCompleted = m.tasksCompleted || m.TasksCompleted || m.CompletedTasks || m.completedTasks || 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#6b7891', width: 18 }}>#{i + 1}</span>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(201,169,110,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A96E', fontWeight: 800, fontSize: 13 }}>
                    {memberName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberName}</div>
                    <div style={{ height: 3, background: '#080d16', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#f0c98a,#C9A96E)', width: `${Math.min((memberCompleted / (completed_tasks || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#C9A96E', fontWeight: 700, flexShrink: 0 }}>{memberCompleted}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}