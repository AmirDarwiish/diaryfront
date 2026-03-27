import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom' // تم إضافة هذا السطر
import API_BASE_URL from '../../config'

const PAGE_SIZE = 15

const BADGES = {
  New:         { bg: 'rgba(56,189,248,.15)',   color: '#38bdf8', label: 'جديد' },
  Contacted:   { bg: 'rgba(167,139,250,.15)',  color: '#a78bfa', label: 'تم التواصل' },
  Interested: { bg: 'rgba(201,169,110,.18)',  color: '#C9A96E', label: 'مهتم' },
  FollowUp:    { bg: 'rgba(251,191,36,.15)',   color: '#fbbf24', label: 'متابعة' },
  Converted:   { bg: 'rgba(52,211,153,.15)',   color: '#34d399', label: 'تم التحويل' },
  Lost:        { bg: 'rgba(248,113,113,.15)',  color: '#f87171', label: 'خسرنا' },
  Cold:        { bg: 'rgba(148,163,184,.15)',  color: '#94a3b8', label: 'بارد' },
}

const STATUS_LIST = Object.entries(BADGES).map(([k, v]) => ({ value: k, label: v.label }))

/* ─── Map numeric status (from API) → string key ─── */
const STATUS_NUM_MAP = {
  1: 'New',
  2: 'Contacted',
  3: 'Interested',
  4: 'FollowUp',
  5: 'Converted',
  6: 'Lost',
  7: 'Cold',
}

const resolveStatus = s => {
  if (typeof s === 'number') return STATUS_NUM_MAP[s] || String(s)
  if (typeof s === 'string' && /^\d+$/.test(s)) return STATUS_NUM_MAP[parseInt(s)] || s
  return s
}

/* ─── Status options with numeric IDs matching LeadStages table ─── */
const STATUS_OPTIONS = [
  { id: 1, key: 'New',         label: 'جديد' },
  { id: 2, key: 'Contacted',   label: 'تم التواصل' },
  { id: 3, key: 'Interested', label: 'مهتم' },
  { id: 4, key: 'FollowUp',    label: 'متابعة' },
  { id: 5, key: 'Converted',   label: 'تم التحويل' },
  { id: 6, key: 'Lost',        label: 'خسرنا' },
  { id: 7, key: 'Cold',        label: 'بارد' },
]

/* resolve current lead status → numeric id for the PUT payload */
const resolveStatusId = s => {
  if (typeof s === 'number') return s
  if (typeof s === 'string' && /^\d+$/.test(s)) return parseInt(s)
  const found = STATUS_OPTIONS.find(o => o.key === s)
  return found ? found.id : 1
}

const fmt  = d => d ? new Date(d).toLocaleDateString('ar-EG') : '—'
const fmtI = (d, t) => d ? fmt(d) + (t ? ' · ' + t : '') : '—'

/* ─── shared token helper ─── */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

/* ─── Modal Backdrop ─── */
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
        width: '100%', maxWidth: 420, padding: 24, direction: 'rtl',
        boxShadow: '0 25px 60px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── Change Status Modal ─── */
function StatusModal({ lead, onClose, onSuccess }) {
  const [statusId, setStatusId] = useState(resolveStatusId(lead.status))
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const isLost = statusId === 6

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const body = { status: statusId, ...(isLost && reason ? { reason } : {}) }
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/status`, {
        method: 'PUT', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.detail || j?.title || j?.message || `خطأ ${res.status}`)
      }
      onSuccess()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تغيير حالة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lbl}>الحالة الجديدة</label>
          <select value={statusId} onChange={e => setStatusId(parseInt(e.target.value))} style={sel}>
            {STATUS_OPTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        {isLost && (
          <div>
            <label style={lbl}>سبب الخسارة</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="اكتب السبب..." style={inp} />
          </div>
        )}
        {error && <div style={{ color: '#f87171', fontSize: 12, background: 'rgba(248,113,113,.08)', padding: '8px 10px', borderRadius: 7 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Assign User Modal ─── */
function AssignModal({ lead, onClose, onSuccess }) {
  const [users, setUsers] = useState([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders(), credentials: 'include' })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setUsers(list)
      } catch { setUsers([]) }
      finally { setFetching(false) }
    })()
  }, [])

  const submit = async () => {
    if (!userId) { setError('اختر موظف'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/assign`, {
        method: 'PUT', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify({ userId: parseInt(userId) }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تعيين موظف: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fetching
          ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>جاري التحميل...</div>
          : (
            <div>
              <label style={lbl}>اختر الموظف</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} style={sel}>
                <option value="">-- اختر --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
          )
        }
        {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={btnPrim}>{loading ? '...' : 'تعيين'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Add Note Modal ─── */
const INTERACTION_TYPES = [
  { value: 'GeneralNote', label: 'ملاحظة عامة' },
  { value: 'Call', label: 'مكالمة' },
  { value: 'Email', label: 'إيميل' },
  { value: 'WhatsApp', label: 'واتساب' },
  { value: 'Meeting', label: 'اجتماع' },
  { value: 'Complaint', label: 'شكوى' },
]

function NoteModal({ lead, onClose, onSuccess }) {
  const [note, setNote] = useState('')
  const [type, setType] = useState('GeneralNote')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!note.trim()) { setError('اكتب الملاحظة'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/notes`, {
        method: 'POST', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify({ note, interactionType: type }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`إضافة ملاحظة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lbl}>نوع التفاعل</label>
          <select value={type} onChange={e => setType(e.target.value)} style={sel}>
            {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>الملاحظة</label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="اكتب ملاحظتك هنا..."
            rows={4}
            style={{ ...inp, resize: 'vertical', height: 'auto', padding: '10px 11px', lineHeight: 1.6 }}
          />
        </div>
        {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Follow-Up Modal ─── */
function FollowUpModal({ lead, onClose, onSuccess }) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!date) { setError('اختر التاريخ'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/follow-up`, {
        method: 'PUT', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify({ followUpDate: date, reason }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تحديد موعد متابعة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lbl}>تاريخ المتابعة</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ ...inp, colorScheme: 'dark' }} />
        </div>
        <div>
          <label style={lbl}>السبب (اختياري)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="سبب المتابعة..." style={inp} />
        </div>
        {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── SVG Icons ─── */
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconNote = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconChevron = ({ up }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
  </svg>
)
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

/* ─── Action Menu ─── */
function ActionMenu({ lead, onAction }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 }) // تم إضافة الحالة لتخزين الإحداثيات
  const ref = useRef()

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toggleMenu = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setOpen(o => !o);
  };

  const actions = [
    { key: 'status',   Icon: IconRefresh,  label: 'تغيير الحالة',  color: '#38bdf8' },
    { key: 'assign',   Icon: IconUser,     label: 'تعيين موظف',    color: '#a78bfa' },
    { key: 'note',     Icon: IconNote,     label: 'إضافة ملاحظة',  color: '#C9A96E' },
    { key: 'followup', Icon: IconCalendar, label: 'موعد متابعة',   color: '#fbbf24' },
    { key: 'details',  Icon: IconEye,      label: 'التفاصيل',      color: '#34d399' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggleMenu}
        style={{
          background: open ? 'rgba(201,169,110,.12)' : 'rgba(255,255,255,.04)',
          border: `1px solid ${open ? '#C9A96E' : '#334155'}`,
          borderRadius: 8, color: open ? '#C9A96E' : '#94a3b8',
          cursor: 'pointer', padding: '5px 12px', fontSize: 12,
          fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all .15s',
        }}
      >
        إجراءات <IconChevron up={open} />
      </button>
      {open && createPortal(
        <div style={{
          position: 'absolute', top: coords.top + 6, left: coords.left, zIndex: 9999,
          background: '#0d1829', border: '1px solid #1e3a5f',
          borderRadius: 10, minWidth: 180,
          boxShadow: '0 16px 40px rgba(0,0,0,.6)', overflow: 'hidden',
          direction: 'rtl',
        }}>
          {actions.map((a, i) => (
            <button key={a.key}
              onClick={() => { setOpen(false); onAction(a.key, lead) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', background: 'none', border: 'none',
                borderBottom: i < actions.length - 1 ? '1px solid rgba(30,58,95,.6)' : 'none',
                color: '#cbd5e1', cursor: 'pointer', padding: '10px 14px',
                fontSize: 13, fontFamily: "'Cairo',sans-serif", textAlign: 'right',
                transition: 'all .12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(201,169,110,.07)'
                e.currentTarget.style.color = '#f1f5f9'
                e.currentTarget.querySelector('.act-icon').style.color = a.color
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#cbd5e1'
                e.currentTarget.querySelector('.act-icon').style.color = '#475569'
              }}
            >
              <span className="act-icon" style={{ color: '#475569', display: 'flex', alignItems: 'center', transition: 'color .12s' }}>
                <a.Icon />
              </span>
              {a.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

/* ─── Lead Details Drawer ─── */
function DetailsDrawer({ lead, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/details`, {
          headers: authHeaders(), credentials: 'include',
        })
        if (!res.ok) throw new Error(`خطأ ${res.status}`)
        const data = await res.json()
        setDetails(data)
      } catch (e) { setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [lead.id])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)',
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 480, height: '100%', overflowY: 'auto',
        background: '#0f172a', borderLeft: '1px solid #334155',
        padding: 24, direction: 'rtl',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#C9A96E' }}>تفاصيل الليد</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {loading && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>جاري التحميل...</div>}
        {error && <div style={{ color: '#f87171', padding: 16, background: 'rgba(248,113,113,.08)', borderRadius: 8 }}>{error}</div>}

        {details && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Info */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#C9A96E', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>معلومات أساسية</div>
              {[
                { label: 'الاسم', val: details.leadInfo?.name },
                { label: 'التليفون', val: details.leadInfo?.phone },
                { label: 'الإيميل', val: details.leadInfo?.email },
                { label: 'المصدر', val: details.leadInfo?.source },
                { label: 'مسند لـ', val: details.leadInfo?.assignedUser?.fullName },
                { label: 'الحالة', val: details.currentStage?.name },
                { label: 'سبب الخسارة', val: details.leadInfo?.lostReason },
              ].filter(f => f.val).map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(51,65,85,.4)', fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>{f.label}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{f.val}</span>
                </div>
              ))}
              {details.metrics && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(201,169,110,.06)', borderRadius: 8, fontSize: 12, color: '#C9A96E' }}>
                  أيام في البيب لاين: {Math.floor(details.metrics.daysInPipeline)} يوم
                </div>
              )}
            </div>

            {/* Stage History */}
            {details.stageHistory?.length > 0 && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#C9A96E', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>تاريخ المراحل</div>
                {details.stageHistory.slice(0, 5).map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid rgba(51,65,85,.3)' : 'none', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{fmt(h.changedAt)} · {h.changedByName}</span>
                    <span style={{ color: '#f1f5f9' }}>{h.fromStage ? `${h.fromStage} ← ` : ''}{h.toStage}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Timeline */}
            {details.activityTimeline?.length > 0 && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#C9A96E', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>آخر الأنشطة</div>
                {details.activityTimeline.slice(0, 8).map((a, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < 7 ? '1px solid rgba(51,65,85,.3)' : 'none', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{
                        background: a.type === 'Note' ? 'rgba(167,139,250,.15)' : a.type === 'Stage' ? 'rgba(52,211,153,.12)' : 'rgba(56,189,248,.12)',
                        color: a.type === 'Note' ? '#a78bfa' : a.type === 'Stage' ? '#34d399' : '#38bdf8',
                        padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      }}>{a.type}</span>
                      <span style={{ color: '#64748b', fontSize: 11 }}>{fmt(a.createdAt)} · {a.createdByName}</span>
                    </div>
                    {a.description && <div style={{ color: '#cbd5e1', lineHeight: 1.5 }}>{a.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── shared mini-styles ─── */
const lbl = { fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }
const inp = {
  width: '100%', boxSizing: 'border-box', height: 38,
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  color: '#f1f5f9', fontSize: 13, padding: '0 11px',
  fontFamily: "'Cairo',sans-serif", outline: 'none',
}
const sel = { ...inp, cursor: 'pointer' }
const btnPrim = {
  height: 38, padding: '0 20px', borderRadius: 8, border: 'none',
  background: '#C9A96E', color: '#0f172a', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'Cairo',sans-serif",
}
const btnSec = {
  height: 38, padding: '0 16px', borderRadius: 8,
  border: '1px solid #334155', background: 'transparent',
  color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'Cairo',sans-serif",
}

/* ─── Badge ─── */
function Badge({ status }) {
  const b = BADGES[status] || { bg: 'rgba(148,163,184,.13)', color: '#94a3b8', label: status || '—' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      background: b.bg, color: b.color,
    }}>{b.label}</span>
  )
}

/* ─── Mobile detection ─── */
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mob
}

/* ═══════════════════════════════════════
    MAIN DASHBOARD
═══════════════════════════════════════ */
export default function Dashboard() {
  const [all, setAll]           = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [fStatus, setFStatus]   = useState('')
  const [fSource, setFSource]   = useState('')
  const [sources, setSources]   = useState([])
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const [toast, setToast]       = useState(null)

  /* modal state */
  const [modal, setModal]       = useState(null) // { type, lead }
  const [drawer, setDrawer]     = useState(null) // lead

  const isMobile = useIsMobile()

  /* ─ fetch leads ─ */
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      })
    } catch (_) {}
    localStorage.removeItem('token')
    window.location.href = '/dashboard/login'
  }

  const loadLeads = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setError('غير مسجل الدخول'); setLoading(false); return }
    try {
      let pg = 1, size = 100, total = Infinity, acc = []
      while (acc.length < total) {
        const res = await fetch(`${API_BASE_URL}/api/leads?pageNumber=${pg}&pageSize=${size}`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
        })
        if (!res.ok) throw new Error(res.status)
        const json = await res.json()
        const d = json?.data || json
        const items = d?.data || d || []
        total = d?.totalCount ?? items.length
        acc = [...acc, ...items]
        if (items.length < size) break
        pg++
      }
      setAll(acc)
      setFiltered(acc)
      setSources([...new Set(acc.map(l => l.source).filter(Boolean))])
      setLastUpdate('آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG'))
      setLoading(false)
    } catch (e) {
      setError('فشل تحميل البيانات: ' + e.message)
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  /* ─ filters ─ */
  const applyFilters = useCallback(() => {
    const q = search.trim().toLowerCase()
    setFiltered(all.filter(l =>
      (!q || (l.fullName || '').toLowerCase().includes(q) || (l.phone || '').includes(q)) &&
      (!fStatus || resolveStatus(l.status) === fStatus) &&
      (!fSource || l.source === fSource)
    ))
    setPage(1)
  }, [all, search, fStatus, fSource])

  useEffect(() => { applyFilters() }, [applyFilters])

  /* ─ toast helper ─ */
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  /* ─ action handler ─ */
  const handleAction = (type, lead) => {
    if (type === 'details') { setDrawer(lead); return }
    setModal({ type, lead })
  }

  const onModalSuccess = () => {
    setModal(null)
    showToast('تم الحفظ بنجاح ✓')
    loadLeads()
  }

  /* ─ export ─ */
  const exportCSV = () => {
    const h = ['الاسم', 'التليفون', 'الإيميل', 'المصدر', 'الحالة', 'تاريخ الإضافة', 'مسند لـ']
    const rows = filtered.map(l =>
      [l.fullName, l.phone, l.email, l.source, BADGES[l.status]?.label || l.status, fmt(l.createdAt), l.assignedTo || '']
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + [h.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = 'zeiia-leads.csv'
    a.click()
  }

  /* ─ stats ─ */
  const stats = [
    { label: 'إجمالي الليدز', val: all.length,                                                                        sub: 'كل السجلات' },
    { label: 'جدد',           val: all.filter(l => resolveStatus(l.status) === 'New').length,            sub: 'New' },
    { label: 'مهتمين',        val: all.filter(l => resolveStatus(l.status) === 'Interested').length,     sub: 'Interested' },
    { label: 'تم التحويل',    val: all.filter(l => resolveStatus(l.status) === 'Converted').length,      sub: 'Converted' },
  ]

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const slice      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* ─ loading / error ─ */
  const wrapBase = { background: '#0f172a', minHeight: '100vh', padding: 24, direction: 'rtl', color: '#fff', fontFamily: "'Cairo',sans-serif" }
  if (loading) return <div style={{ ...wrapBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#C9A96E' }}>جاري تحميل البيانات...</span></div>
  if (error)    return <div style={{ ...wrapBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#f87171' }}>{error}</span></div>

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))',
    gap: 10, marginBottom: 20,
  }

  const COLS = [
    { label: 'الاسم',            key: 'fullName',             width: 160 },
    { label: 'التليفون',        key: 'phone',                 width: 130 },
    { label: 'الحالة',           key: 'status',                width: 110 },
    { label: 'المصدر',           key: 'source',                width: 110 },
    { label: 'مسند لـ',          key: 'assignedTo',            width: 130 },
    { label: 'آخر تفاعل',        key: 'lastInteraction',       width: 160 },
    { label: 'الإيميل',         key: 'email',                 width: 180 },
    { label: 'تاريخ الإضافة',    key: 'createdAt',             width: 120 },
    { label: 'إجراءات',         key: 'actions',               width: 130 },
  ]

  return (
    <div style={wrapBase}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
          background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)',
          border: `1px solid ${toast.ok ? '#34d399' : '#f87171'}`,
          color: toast.ok ? '#34d399' : '#f87171',
          borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)', pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A96E' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9A96E', letterSpacing: 2 }}>ZEIIA CRM</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Leads Dashboard</div>
          <div style={{ width: 36, height: 2, background: '#C9A96E', borderRadius: 2, margin: '5px 0' }} />
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{lastUpdate}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={loadLeads} style={{ ...btnSec, height: 36, padding: '0 14px', fontSize: 13 }}>↻ تحديث</button>
          <button onClick={exportCSV} style={{ ...btnPrim, height: 36, fontSize: 13 }}>↓ تصدير CSV</button>
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            style={{
              height: 36, width: 36, borderRadius: 8, border: '1px solid #334155',
              background: 'rgba(248,113,113,.08)', color: '#f87171',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.18)'; e.currentTarget.style.borderColor = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.08)'; e.currentTarget.style.borderColor = '#334155' }}
          >
            <IconLogout />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={statsGridStyle}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: '#C9A96E' }} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#C9A96E', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input
          style={{ height: 36, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, padding: '0 11px', fontFamily: "'Cairo',sans-serif", outline: 'none', flex: 1, maxWidth: 240 }}
          placeholder="ابحث بالاسم أو التليفون..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select style={{ height: 36, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, padding: '0 11px', fontFamily: "'Cairo',sans-serif", outline: 'none' }} value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select style={{ height: 36, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, padding: '0 11px', fontFamily: "'Cairo',sans-serif", outline: 'none' }} value={fSource} onChange={e => setFSource(e.target.value)}>
          <option value="">كل المصادر</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        {!isMobile ? (
          /* ── Desktop: horizontal scroll table ── */
          <>
          <style>{`
          .leads-table-scroll::-webkit-scrollbar { height: 6px; }
          .leads-table-scroll::-webkit-scrollbar-track { background: #0f172a; }
          .leads-table-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
          .leads-table-scroll::-webkit-scrollbar-thumb:hover { background: #C9A96E; }
        `}</style>
        <div className="leads-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {COLS.map(c => (
                    <th key={c.key} style={{
                      fontSize: 11, fontWeight: 700, color: '#94a3b8',
                      textAlign: 'right', padding: '11px 14px',
                      borderBottom: '1px solid #334155', whiteSpace: 'nowrap',
                      minWidth: c.width,
                    }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.length === 0
                  ? <tr><td colSpan={COLS.length} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>لا توجد نتائج</td></tr>
                  : slice.map(l => (
                    <tr key={l.id}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'rgba(201,169,110,.04)')}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}>

                      {/* Name */}
                      <td style={{ fontSize: 13, color: '#f1f5f9', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.hasComplaint && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f87171', marginLeft: 5, verticalAlign: 'middle' }} title="شكوى" />}
                        {l.fullName || '—'}
                      </td>

                      {/* Phone */}
                      <td style={{ fontSize: 12, color: '#f1f5f9', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', fontFamily: 'monospace', letterSpacing: .5, whiteSpace: 'nowrap' }}>
                        {l.phone || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap' }}>
                        <Badge status={resolveStatus(l.status)} />
                      </td>

                      {/* Source */}
                      <td style={{ fontSize: 13, color: '#f1f5f9', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap' }}>
                        {l.source
                          ? <span style={{ background: 'rgba(201,169,110,.08)', color: '#C9A96E', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{l.source}</span>
                          : '—'}
                      </td>

                      {/* Assigned */}
                      <td style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap' }}>
                        {l.assignedTo || <span style={{ color: '#475569', fontStyle: 'italic' }}>غير مسند</span>}
                      </td>

                      {/* Last Interaction */}
                      <td style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap' }}>
                        {fmtI(l.lastInteractionDate, l.lastInteractionType)}
                      </td>

                      {/* Email */}
                      <td style={{ fontSize: 12, color: '#64748b', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.email || '—'}
                      </td>

                      {/* Created */}
                      <td style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap' }}>
                        {fmt(l.createdAt)}
                      </td>

                      {/* Actions — last */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(51,65,85,.4)', whiteSpace: 'nowrap' }}>
                        <ActionMenu lead={l} onAction={handleAction} />
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          </>
        ) : (
          /* ── Mobile cards ── */
          <div>
            {slice.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>لا توجد نتائج</div>
              : slice.map(l => (
                <div key={l.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(51,65,85,.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {l.hasComplaint && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f87171', marginLeft: 5, verticalAlign: 'middle' }} />}
                      {l.fullName || '—'}
                    </div>
                    <Badge status={resolveStatus(l.status)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'التليفون', val: l.phone || '—' },
                      { label: 'المصدر',    val: l.source || '—' },
                      { label: 'مسند لـ',  val: l.assignedTo || 'غير مسند' },
                      { label: 'التاريخ',   val: fmt(l.createdAt) },
                    ].map(f => (
                      <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: .5 }}>{f.label}</div>
                        <div style={{ fontSize: 12, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                  <ActionMenu lead={l} onAction={handleAction} />
                </div>
              ))
            }
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #334155', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {filtered.length === 0 ? 'لا توجد نتائج' : `عرض ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} من ${filtered.length}`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <button
              style={{ height: 30, minWidth: 30, padding: '0 9px', fontSize: 12, borderRadius: 7, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', margin: '0 2px', fontFamily: "'Cairo',sans-serif" }}
              disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const s = Math.max(1, page - 2), p = s + i
              if (p > totalPages) return null
              return (
                <button key={p}
                  style={{ height: 30, minWidth: 30, padding: '0 9px', fontSize: 12, borderRadius: 7, border: '1px solid #334155', cursor: 'pointer', margin: '0 2px', fontFamily: "'Cairo',sans-serif", ...(p === page ? { background: '#C9A96E', color: '#0f172a', borderColor: '#C9A96E', fontWeight: 700 } : { background: 'transparent', color: '#94a3b8' }) }}
                  onClick={() => setPage(p)}>{p}</button>
              )
            })}
            <button
              style={{ height: 30, minWidth: 30, padding: '0 9px', fontSize: 12, borderRadius: 7, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', margin: '0 2px', fontFamily: "'Cairo',sans-serif" }}
              disabled={page >= totalPages || !totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'status'   && <StatusModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'assign'   && <AssignModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'note'     && <NoteModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'followup' && <FollowUpModal lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}

      {/* Details Drawer */}
      {drawer && <DetailsDrawer lead={drawer} onClose={() => setDrawer(null)} />}
    </div>
  )
}