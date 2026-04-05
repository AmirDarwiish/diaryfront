import { useEffect, useState, useCallback, useRef } from 'react'
import API_BASE_URL from '../../config'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import '../../styles/dashboard.css'

/* ════════════════════════════════
   CONSTANTS
════════════════════════════════ */
const PAGE_SIZE = 15

const BADGES = {
  New:        { bg: 'rgba(56,189,248,.15)',   color: '#38bdf8', label: 'جديد' },
  Contacted:  { bg: 'rgba(167,139,250,.15)',  color: '#a78bfa', label: 'تم التواصل' },
  Interested: { bg: 'rgba(201,169,110,.18)',  color: '#C9A96E', label: 'مهتم' },
  FollowUp:   { bg: 'rgba(251,191,36,.15)',   color: '#fbbf24', label: 'متابعة' },
  Converted:  { bg: 'rgba(52,211,153,.15)',   color: '#34d399', label: 'تم التحويل' },
  Lost:       { bg: 'rgba(248,113,113,.15)',  color: '#f87171', label: 'خسرنا' },
  Cold:       { bg: 'rgba(148,163,184,.15)',  color: '#94a3b8', label: 'بارد' },
}

const STATUS_LIST    = Object.entries(BADGES).map(([k, v]) => ({ value: k, label: v.label }))
const STATUS_NUM_MAP = { 1:'New', 2:'Contacted', 3:'Interested', 4:'FollowUp', 5:'Converted', 6:'Lost', 7:'Cold' }
const STATUS_OPTIONS = [
  { id:1, key:'New',        label:'جديد' },
  { id:2, key:'Contacted',  label:'تم التواصل' },
  { id:3, key:'Interested', label:'مهتم' },
  { id:4, key:'FollowUp',   label:'متابعة' },
  { id:5, key:'Converted',  label:'تم التحويل' },
  { id:6, key:'Lost',       label:'خسرنا' },
  { id:7, key:'Cold',       label:'بارد' },
]
const INTERACTION_TYPES = [
  { value: 0, label: 'ملاحظة عامة' },
  { value: 1, label: 'مكالمة' },
  { value: 2, label: 'إيميل' },
  { value: 3, label: 'واتساب' },
  { value: 4, label: 'اجتماع' },
  { value: 5, label: 'شكوى' },
]
const KANBAN_STATUSES = [
  { id:1, key:'New',        label:'جديد',       color:'#38bdf8', bg:'rgba(56,189,248,.12)'  },
  { id:2, key:'Contacted',  label:'تم التواصل', color:'#a78bfa', bg:'rgba(167,139,250,.12)' },
  { id:3, key:'Interested', label:'مهتم',       color:'#C9A96E', bg:'rgba(201,169,110,.15)' },
  { id:4, key:'FollowUp',   label:'متابعة',     color:'#fbbf24', bg:'rgba(251,191,36,.12)'  },
  { id:5, key:'Converted',  label:'تم التحويل', color:'#34d399', bg:'rgba(52,211,153,.12)'  },
  { id:6, key:'Lost',       label:'خسرنا',      color:'#f87171', bg:'rgba(248,113,113,.12)' },
  { id:7, key:'Cold',       label:'بارد',       color:'#94a3b8', bg:'rgba(148,163,184,.12)' },
]

/* ════════════════════════════════
   HELPERS
════════════════════════════════ */
const resolveStatus = s => {
  if (typeof s === 'number') return STATUS_NUM_MAP[s] || String(s)
  if (typeof s === 'string' && /^\d+$/.test(s)) return STATUS_NUM_MAP[parseInt(s)] || s
  return s
}
const resolveStatusId = s => {
  if (typeof s === 'number') return s
  if (typeof s === 'string' && /^\d+$/.test(s)) return parseInt(s)
  const found = STATUS_OPTIONS.find(o => o.key === s)
  return found ? found.id : 1
}
const fmt  = d => d ? new Date(d).toLocaleDateString('ar-EG') : '—'
const fmtI = (d, t) => d ? fmt(d) + (t ? ' · ' + t : '') : '—'
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

/* ════════════════════════════════
   WHATSAPP ICON SVG
════════════════════════════════ */
const WaIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25d366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.428a.5.5 0 00.609.61l5.627-1.476A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.857a9.857 9.857 0 01-5.028-1.374l-.36-.214-3.732.979.998-3.645-.235-.374A9.821 9.821 0 012.143 12C2.143 6.54 6.54 2.143 12 2.143c5.46 0 9.857 4.397 9.857 9.857 0 5.46-4.397 9.857-9.857 9.857z"/>
  </svg>
)

/* ════════════════════════════════
   SHARED STYLES
════════════════════════════════ */
const lbl       = { fontSize:12, color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:6 }
const inp       = { width:'100%', boxSizing:'border-box', height:38, background:'var(--bg-base)', border:'1px solid var(--border-md)', borderRadius:8, color:'var(--text)', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none' }
const sel       = { ...inp, cursor:'pointer' }
const btnPrim   = { height:36, padding:'0 18px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#d4a855,var(--gold))', color:'#080d16', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo',sans-serif", display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }
const btnSec    = { height:36, padding:'0 14px', borderRadius:8, border:'1px solid var(--border-md)', background:'transparent', color:'var(--text-muted)', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif", display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }
const btnDanger = { height:36, padding:'0 14px', borderRadius:8, border:'1px solid rgba(248,113,113,.3)', background:'rgba(248,113,113,.08)', color:'#f87171', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }

/* ════════════════════════════════
   SVG ICONS
════════════════════════════════ */
const Ico = ({ children, size = 14, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)
const IconRefresh  = () => <Ico><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ico>
const IconUser     = () => <Ico><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>
const IconNote     = () => <Ico><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ico>
const IconCalendar = () => <Ico><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>
const IconEye      = () => <Ico><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ico>
const IconEdit     = () => <Ico><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>
const IconArchive  = () => <Ico><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></Ico>
const IconConvert  = () => <Ico><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></Ico>
const IconTask     = () => <Ico><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></Ico>
const IconChevron  = ({ up }) => <Ico>{up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</Ico>
const IconUpload   = () => <Ico><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></Ico>
const IconKanban   = () => <Ico><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Ico>
const IconList     = () => <Ico><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Ico>
const IconAdd      = () => <Ico><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>

/* ════════════════════════════════
   MOBILE HOOK
════════════════════════════════ */
function useIsMobile() {
  const [mob, setMob] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fn = () => setMob(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mob
}

/* ════════════════════════════════
   ERROR BOX
════════════════════════════════ */
const ErrBox = ({ msg }) => msg
  ? <div style={{ color:'#f87171', fontSize:12, background:'rgba(248,113,113,.08)', padding:'8px 10px', borderRadius:7 }}>{msg}</div>
  : null

/* ════════════════════════════════
   MODAL
════════════════════════════════ */
function Modal({ title, onClose, children, maxWidth = 420 }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:16, width:'100%', maxWidth, padding:24, direction:'rtl', boxShadow:'var(--shadow-modal)', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <div style={{ position:'absolute', top:0, right:0, left:0, height:3, background:'linear-gradient(90deg,var(--gold),var(--gold-light),transparent)', borderRadius:'16px 16px 0 0' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer', lineHeight:1, fontFamily:"'Cairo',sans-serif" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ════════════════════════════════
   BADGE
════════════════════════════════ */
function Badge({ status }) {
  const b = BADGES[status] || { bg:'rgba(148,163,184,.13)', color:'#94a3b8', label: status || 'unknown' }
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:b.bg, color:b.color }}>{b.label}</span>
}

/* ════════════════════════════════
   TOAST
════════════════════════════════ */
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div style={{
      position:'fixed', top:'calc(var(--header-h, 60px) + 12px)', left:'50%', transform:'translateX(-50%)', zIndex:2000,
      background: toast.ok ? 'var(--green-bg)' : 'var(--red-bg)',
      border:`1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`,
      color: toast.ok ? 'var(--green)' : 'var(--red)',
      borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:600,
      boxShadow:'var(--shadow-modal)', pointerEvents:'none', fontFamily:"'Cairo',sans-serif",
      whiteSpace:'nowrap', animation:'db-toast-in .2s ease',
    }}>{toast.msg}</div>
  )
}

/* ════════════════════════════════
   ACTION MENU
════════════════════════════════ */
function ActionMenu({ lead, onAction }) {
  const [open, setOpen]           = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const btnRef  = useRef()
  const menuRef = useRef()

  useEffect(() => {
    const close = e => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    if (open) window.addEventListener('scroll', closeOnScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      window.removeEventListener('scroll', closeOnScroll)
    }
  }, [open])

  useEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const openUp = window.innerHeight - rect.bottom < 320
    const menuWidth = 195
    let safeLeft = rect.left
    if (safeLeft + menuWidth > window.innerWidth) safeLeft = window.innerWidth - menuWidth - 16
    if (safeLeft < 16) safeLeft = 16
    setMenuStyle({
      position:'fixed', zIndex:9999, left: safeLeft,
      ...(openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
      minWidth: menuWidth,
    })
  }, [open])

  const isConverted = resolveStatus(lead.status) === 'Converted'
  const actions = [
    { key:'status',   Icon:IconRefresh,  label:'تغيير الحالة',  color:'#38bdf8' },
    { key:'assign',   Icon:IconUser,     label:'تعيين موظف',    color:'#a78bfa' },
    { key:'note',     Icon:IconNote,     label:'إضافة ملاحظة',  color:'var(--gold)' },
    { key:'task',     Icon:IconTask,     label:'إضافة مهمة',    color:'#fbbf24' },
    { key:'followup', Icon:IconCalendar, label:'موعد متابعة',   color:'#fbbf24' },
    { key:'details',  Icon:IconEye,      label:'التفاصيل',      color:'#34d399' },
    { key:'edit',     Icon:IconEdit,     label:'تعديل',         color:'#60a5fa' },
    ...(!isConverted ? [{ key:'convert', Icon:IconConvert, label:'تحويل لعميل', color:'#34d399' }] : []),
    { key:'archive',  Icon:IconArchive,  label: lead.isArchived ? 'استعادة' : 'أرشفة', color:'#f87171' },
  ]

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)} style={{
        background: open ? 'var(--gold-12)' : 'var(--bg-hover)',
        border: `1px solid ${open ? 'var(--gold)' : 'var(--border-md)'}`,
        borderRadius:8, color: open ? 'var(--gold)' : 'var(--text-muted)',
        cursor:'pointer', padding:'5px 12px', fontSize:12,
        fontFamily:"'Cairo',sans-serif", display:'flex', alignItems:'center', gap:6, transition:'all .15s',
      }}>
        إجراءات <IconChevron up={open} />
      </button>
      {open && (
        <div ref={menuRef} style={{ ...menuStyle, background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:10, boxShadow:'var(--shadow-modal)', overflow:'hidden' }}>
          {actions.map((a, i) => (
            <button key={a.key}
              onClick={() => { setOpen(false); onAction(a.key, lead) }}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'none', border:'none', borderBottom: i < actions.length-1 ? '1px solid var(--border)' : 'none', color:'var(--text-sec)', cursor:'pointer', padding:'10px 14px', fontSize:13, fontFamily:"'Cairo',sans-serif", textAlign:'right', transition:'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--gold-08)'; e.currentTarget.style.color='var(--text)'; e.currentTarget.querySelector('.ai').style.color=a.color }}
              onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-sec)'; e.currentTarget.querySelector('.ai').style.color='var(--text-muted)' }}
            >
              <span className="ai" style={{ color:'var(--text-muted)', display:'flex', alignItems:'center', transition:'color .12s' }}><a.Icon /></span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ════════════════════════════════
   CREATE LEAD MODAL
════════════════════════════════ */
function CreateLeadModal({ onClose, onSuccess }) {
  const [form, setForm]       = useState({ fullName:'', phone:'', email:'', source:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }))
  const submit = async () => {
    if (!form.fullName.trim()) { setError('الاسم مطلوب'); return }
    if (!form.phone.trim())    { setError('التليفون مطلوب'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads`, { method:'POST', headers:authHeaders(), credentials:'include', body:JSON.stringify(form) })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title="إضافة ليد جديد" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[{k:'fullName',label:'الاسم الكامل *',ph:'الاسم...'},{k:'phone',label:'التليفون *',ph:'01xxxxxxxxx'},{k:'email',label:'الإيميل',ph:'example@mail.com'},{k:'source',label:'المصدر',ph:'Facebook, Website...'}].map(f => (
          <div key={f.k}><label style={lbl}>{f.label}</label><input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={inp} /></div>
        ))}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}><IconAdd /> {loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   STATUS MODAL
════════════════════════════════ */
function StatusModal({ lead, onClose, onSuccess }) {
  const [statusId, setStatusId] = useState(resolveStatusId(lead.status))
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const submit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/status`, { method:'PUT', headers:authHeaders(), credentials:'include', body:JSON.stringify({ status:statusId, ...(statusId===6 && reason ? { reason } : {}) }) })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.detail || j?.title || j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`تغيير حالة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div><label style={lbl}>الحالة الجديدة</label>
          <select value={statusId} onChange={e => setStatusId(parseInt(e.target.value))} style={sel}>
            {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {statusId === 6 && <div><label style={lbl}>سبب الخسارة</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="اكتب السبب..." style={inp} /></div>}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   ASSIGN MODAL
════════════════════════════════ */
function AssignModal({ lead, onClose, onSuccess }) {
  const [users, setUsers]       = useState([])
  const [userId, setUserId]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError]       = useState('')
  useEffect(() => {
    ;(async () => {
      try { const res = await fetch(`${API_BASE_URL}/api/users`, { headers:authHeaders(), credentials:'include' }); if (!res.ok) throw new Error(); const data = await res.json(); setUsers(Array.isArray(data) ? data : (data?.data || [])) }
      catch { setUsers([]) } finally { setFetching(false) }
    })()
  }, [])
  const submit = async () => {
    if (!userId) { setError('اختر موظف'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/assign`, { method:'PUT', headers:authHeaders(), credentials:'include', body:JSON.stringify({ userId:parseInt(userId) }) })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`تعيين موظف: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {fetching ? <div style={{ color:'var(--text-muted)', textAlign:'center', padding:20 }}>جاري التحميل...</div> : <div><label style={lbl}>اختر الموظف</label><select value={userId} onChange={e => setUserId(e.target.value)} style={sel}><option value="">-- اختر --</option>{users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></div>}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={btnPrim}>{loading ? '...' : 'تعيين'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   NOTE MODAL
════════════════════════════════ */
function NoteModal({ lead, onClose, onSuccess }) {
  const [note, setNote]               = useState('')
  const [type, setType]               = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [users, setUsers]             = useState([])
  const [showMention, setShowMention] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPos, setMentionPos]   = useState(0)
  const textareaRef = useRef()
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []).then(d => setUsers(Array.isArray(d) ? d : (d?.data || []))).catch(() => {})
  }, [])
  const filteredUsers = users.filter(u => u.fullName?.toLowerCase().includes(mentionQuery.toLowerCase()) || u.email?.toLowerCase().includes(mentionQuery.toLowerCase()))
  const handleNoteChange = (e) => {
    const val = e.target.value; const cursor = e.target.selectionStart; setNote(val)
    const textBefore = val.slice(0, cursor); const atIndex = textBefore.lastIndexOf('@')
    if (atIndex !== -1) { const query = textBefore.slice(atIndex + 1); if (!query.includes(' ')) { setMentionQuery(query); setMentionPos(atIndex); setShowMention(true); return } }
    setShowMention(false)
  }
  const selectUser = (user) => {
    const handle = user.fullName?.replace(/\s/g, '') || user.email?.split('@')[0]
    const cursor = textareaRef.current.selectionStart; const before = note.slice(0, mentionPos); const after = note.slice(cursor)
    setNote(`${before}@${handle} ${after}`); setShowMention(false); setTimeout(() => textareaRef.current?.focus(), 0)
  }
  const submit = async () => {
    if (!note.trim()) { setError('اكتب الملاحظة'); return }
    setLoading(true); setError('')
    try { const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/notes`, { method:'POST', headers:authHeaders(), credentials:'include', body:JSON.stringify({ note, interactionType: type }) }); if (!res.ok) throw new Error(`خطأ ${res.status}`); onSuccess() }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`إضافة ملاحظة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div><label style={lbl}>نوع التفاعل</label><select value={type} onChange={e => setType(parseInt(e.target.value))} style={sel}>{INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div style={{ position:'relative' }}>
          <label style={lbl}>الملاحظة</label>
          <textarea ref={textareaRef} value={note} onChange={handleNoteChange} placeholder="اكتب ملاحظتك... استخدم @ لذكر موظف" rows={4} style={{ ...inp, resize:'vertical', height:'auto', padding:'10px 11px', lineHeight:1.6 }} />
          {showMention && filteredUsers.length > 0 && (
            <div style={{ position:'absolute', bottom:'100%', right:0, width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:8, boxShadow:'var(--shadow-modal)', zIndex:999, maxHeight:200, overflowY:'auto', marginBottom:4 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => selectUser(u)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:2 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--gold-08)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{u.fullName}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>@{u.fullName?.replace(/\s/g,'')} · {u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   TASK MODAL (Lead)
════════════════════════════════ */
function TaskModal({ lead, onClose, onSuccess }) {
  const [title, setTitle]             = useState('')
  const [dueDate, setDueDate]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [users, setUsers]             = useState([])
  const [showMention, setShowMention] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPos, setMentionPos]   = useState(0)
  const inputRef = useRef()
  useEffect(() => { fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []).then(d => setUsers(Array.isArray(d) ? d : (d?.data || []))).catch(() => {}) }, [])
  const filteredUsers = users.filter(u => u.fullName?.toLowerCase().includes(mentionQuery.toLowerCase()) || u.email?.toLowerCase().includes(mentionQuery.toLowerCase()))
  const handleTitleChange = (e) => {
    const val = e.target.value; const cursor = e.target.selectionStart; setTitle(val)
    const textBefore = val.slice(0, cursor); const atIndex = textBefore.lastIndexOf('@')
    if (atIndex !== -1) { const query = textBefore.slice(atIndex + 1); if (!query.includes(' ')) { setMentionQuery(query); setMentionPos(atIndex); setShowMention(true); return } }
    setShowMention(false)
  }
  const selectUser = (user) => {
    const handle = user.fullName?.replace(/\s/g, '') || user.email?.split('@')[0]
    const cursor = inputRef.current.selectionStart; const before = title.slice(0, mentionPos); const after = title.slice(cursor)
    setTitle(`${before}@${handle} ${after}`); setShowMention(false); setTimeout(() => inputRef.current?.focus(), 0)
  }
  const submit = async () => {
    if (!title.trim()) { setError('اكتب عنوان المهمة'); return }
    setLoading(true); setError('')
    try { const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/tasks`, { method:'POST', headers:authHeaders(), credentials:'include', body:JSON.stringify({ title, ...(dueDate ? { dueDate } : {}) }) }); if (!res.ok) throw new Error(`خطأ ${res.status}`); onSuccess() }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`إضافة مهمة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ position:'relative' }}>
          <label style={lbl}>عنوان المهمة *</label>
          <input ref={inputRef} value={title} onChange={handleTitleChange} placeholder="اكتب المهمة... استخدم @ لذكر موظف" style={inp} />
          {showMention && filteredUsers.length > 0 && (
            <div style={{ position:'absolute', bottom:'100%', right:0, width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border-md)', borderRadius:8, boxShadow:'var(--shadow-modal)', zIndex:999, maxHeight:200, overflowY:'auto', marginBottom:4 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => selectUser(u)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:2 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--gold-08)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{u.fullName}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>@{u.fullName?.replace(/\s/g,'')} · {u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div><label style={lbl}>تاريخ الاستحقاق (اختياري)</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inp, colorScheme:'dark' }} /></div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   FOLLOW-UP MODAL
════════════════════════════════ */
function FollowUpModal({ lead, onClose, onSuccess }) {
  const [date, setDate]       = useState('')
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const submit = async () => {
    if (!date) { setError('اختر التاريخ'); return }
    setLoading(true); setError('')
    try { const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/follow-up`, { method:'PUT', headers:authHeaders(), credentials:'include', body:JSON.stringify({ followUpDate:date, reason }) }); if (!res.ok) throw new Error(`خطأ ${res.status}`); onSuccess() }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`موعد متابعة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div><label style={lbl}>تاريخ المتابعة *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, colorScheme:'dark' }} /></div>
        <div><label style={lbl}>السبب (اختياري)</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="سبب المتابعة..." style={inp} /></div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   EDIT MODAL
════════════════════════════════ */
function EditModal({ lead, onClose, onSuccess }) {
  const [form, setForm]       = useState({ fullName:lead.fullName||'', phone:lead.phone||'', email:lead.email||'', source:lead.source||'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }))
  const submit = async () => {
    if (!form.fullName.trim()) { setError('الاسم مطلوب'); return }
    if (!form.phone.trim())    { setError('التليفون مطلوب'); return }
    setLoading(true); setError('')
    try { const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}`, { method:'PUT', headers:authHeaders(), credentials:'include', body:JSON.stringify(form) }); if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `خطأ ${res.status}`) }; onSuccess() }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`تعديل: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[{k:'fullName',label:'الاسم الكامل *',ph:'الاسم...'},{k:'phone',label:'التليفون *',ph:'01xxxxxxxxx'},{k:'email',label:'الإيميل',ph:'example@mail.com'},{k:'source',label:'المصدر',ph:'Facebook, Website...'}].map(f => (
          <div key={f.k}><label style={lbl}>{f.label}</label><input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={inp} /></div>
        ))}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={btnPrim}>{loading ? '...' : 'حفظ التعديلات'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   CONVERT MODAL
════════════════════════════════ */
function ConvertModal({ lead, onClose, onSuccess }) {
  const [classes, setClasses]   = useState([])
  const [classId, setClassId]   = useState('')
  const [paid, setPaid]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError]       = useState('')
  useEffect(() => {
    ;(async () => {
      try { const res = await fetch(`${API_BASE_URL}/api/course-classes`, { headers:authHeaders(), credentials:'include' }); if (!res.ok) throw new Error(); const data = await res.json(); setClasses(Array.isArray(data) ? data : (data?.data || [])) }
      catch { setClasses([]) } finally { setFetching(false) }
    })()
  }, [])
  const selected = classes.find(c => c.id === parseInt(classId))
  const submit = async () => {
    if (!classId) { setError('اختر الكورس'); return }
    setLoading(true); setError('')
    try { const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/convert`, { method:'POST', headers:authHeaders(), credentials:'include', body:JSON.stringify({ courseClassId:parseInt(classId), ...(paid ? { paidAmount:parseFloat(paid) } : {}) }) }); if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `خطأ ${res.status}`) }; onSuccess() }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={`تحويل لعميل: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--green-bg)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--green)' }}>سيتم إنشاء حساب عميل جديد وتسجيله في الكورس المختار</div>
        <div><label style={lbl}>الكورس *</label>
          {fetching ? <div style={{ color:'var(--text-muted)', padding:10 }}>جاري التحميل...</div>
            : <select value={classId} onChange={e => setClassId(e.target.value)} style={sel}><option value="">-- اختر الكورس --</option>{classes.map(c => <option key={c.id} value={c.id}>{c.courseName || c.name} {c.price ? `-- ${c.price} ج` : ''}</option>)}</select>}
        </div>
        {selected && <div><label style={lbl}>المبلغ المدفوع (اختياري — max: {selected.price} ج)</label><input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" max={selected.price} style={inp} /></div>}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={{ ...btnPrim, background:'var(--green)' }}>{loading ? '...' : 'تحويل الآن'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   ARCHIVE MODAL
════════════════════════════════ */
function ArchiveModal({ lead, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const isArchived = lead.isArchived
  const submit = async () => {
    setLoading(true); setError('')
    try { const url = isArchived ? `${API_BASE_URL}/api/leads/${lead.id}/restore` : `${API_BASE_URL}/api/leads/${lead.id}/archive`; const res = await fetch(url, { method:'PUT', headers:authHeaders(), credentials:'include' }); if (!res.ok) throw new Error(`خطأ ${res.status}`); onSuccess() }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title={isArchived ? `استعادة: ${lead.fullName}` : `أرشفة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ color:'var(--text-sec)', fontSize:14, lineHeight:1.7 }}>{isArchived ? 'هل تريد استعادة هذا الليد وإعادته للقائمة النشطة؟' : 'هل تريد أرشفة هذا الليد؟ يمكنك استعادته لاحقاً من تاب الأرشيف.'}</div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={isArchived ? btnPrim : btnDanger}>{loading ? '...' : (isArchived ? 'استعادة' : 'أرشفة')}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   IMPORT EXCEL MODAL
════════════════════════════════ */
function ImportModal({ onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const fileRef = useRef()
  const submit = async () => {
    if (!file) { setError('اختر ملف Excel'); return }
    setLoading(true); setError(''); setResult(null)
    try { const fd = new FormData(); fd.append('file', file); const res = await fetch(`${API_BASE_URL}/api/leads/import`, { method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` }, credentials:'include', body:fd }); if (!res.ok) throw new Error(`خطأ ${res.status}`); setResult(await res.json()) }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <Modal title="استيراد Leads من Excel" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--teal-bg)', border:'1px solid rgba(56,189,248,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--teal)', lineHeight:1.7 }}>الأعمدة المطلوبة: <strong>FullName - Phone - Email - Source</strong></div>
        <div onClick={() => fileRef.current?.click()} onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--gold)' }} onDragLeave={e => { e.currentTarget.style.borderColor = file ? 'var(--gold)' : 'var(--border-md)' }} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) setFile(f) }}
          style={{ border:`2px dashed ${file ? 'var(--gold)' : 'var(--border-md)'}`, borderRadius:10, padding:'28px 16px', textAlign:'center', cursor:'pointer', background: file ? 'var(--gold-08)' : 'transparent', transition:'all .15s' }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
          <div style={{ fontSize:13, color: file ? 'var(--gold)' : 'var(--text-muted)' }}>{file ? `✓ ${file.name}` : 'اضغط أو اسحب ملف Excel هنا'}</div>
        </div>
        <ErrBox msg={error} />
        {result && <div style={{ background:'var(--green-bg)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, padding:'12px 14px', fontSize:13 }}><div style={{ color:'var(--green)', fontWeight:700, marginBottom:6 }}>تم الاستيراد بنجاح</div><div style={{ color:'var(--text-muted)' }}>تم استيراد: <strong style={{ color:'var(--text)' }}>{result.imported}</strong></div><div style={{ color:'var(--text-muted)' }}>تم تخطيه: <strong style={{ color:'var(--yellow)' }}>{result.skipped}</strong></div>{result.errors?.slice(0, 3).map((e, i) => <div key={i} style={{ fontSize:11, color:'var(--red)', marginTop:2 }}>{e}</div>)}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={result ? onSuccess : onClose} style={btnSec}>{result ? 'إغلاق وتحديث' : 'إلغاء'}</button>
          {!result && <button onClick={submit} disabled={loading || !file} style={btnPrim}>{loading ? 'جاري الاستيراد...' : 'استيراد'}</button>}
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   DETAILS DRAWER
════════════════════════════════ */
function DetailsDrawer({ lead, onClose }) {
  const [details, setDetails]             = useState(null)
  const [notes, setNotes]                 = useState([])
  const [followHistory, setFollowHistory] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [tab, setTab] = useState(lead.openTab || 'info')
  useEffect(() => {
    ;(async () => {
      try {
        const [dr, nr, fhr] = await Promise.all([
          fetch(`${API_BASE_URL}/api/leads/${lead.id}/details`,           { headers:authHeaders(), credentials:'include' }),
          fetch(`${API_BASE_URL}/api/leads/${lead.id}/notes`,             { headers:authHeaders(), credentials:'include' }),
          fetch(`${API_BASE_URL}/api/leads/${lead.id}/follow-up-history`, { headers:authHeaders(), credentials:'include' }),
        ])
        if (dr.ok) { const d = await dr.json(); setDetails(d?.data || d) }
        if (nr.ok)  { const nd = await nr.json(); setNotes(Array.isArray(nd) ? nd : (nd?.data || [])) }
        if (fhr.ok) { const fd = await fhr.json(); setFollowHistory(Array.isArray(fd) ? fd : (fd?.data || [])) }
      } catch(e) { setError(e.message) } finally { setLoading(false) }
    })()
  }, [lead.id])
  const tabs = [
    { id:'info',     label:'المعلومات' },
    { id:'notes',    label:`الملاحظات${notes.length ? ` (${notes.length})` : ''}` },
    { id:'stages',   label:'المراحل' },
    { id:'followup', label:'المتابعات' },
    { id:'activity', label:'الأنشطة' },
  ]
  const tabBtn = id => ({
    height:30, padding:'0 12px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontFamily:"'Cairo',sans-serif", transition:'all .15s',
    background: tab === id ? 'var(--gold-12)' : 'transparent', color: tab === id ? 'var(--gold)' : 'var(--text-muted)',
    borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent', fontWeight: tab === id ? 700 : 400,
  })
  return (
    <div style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)', display:'flex', justifyContent:'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth:520, height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-base)', borderLeft:'1px solid var(--border)', direction:'rtl' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:17, fontWeight:800, color:'var(--gold)' }}>تفاصيل الليد</span>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:22, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}>×</button>
          </div>
          <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(t.id)}>{t.label}</button>)}</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {loading && <div style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>جاري التحميل...</div>}
          {error   && <div style={{ color:'var(--red)', padding:16, background:'var(--red-bg)', borderRadius:8 }}>{error}</div>}
          {!loading && tab === 'info' && details && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, marginBottom:12, letterSpacing:1 }}>معلومات أساسية</div>
                {[
                  { label:'الاسم',      val: details.leadInfo?.name || details.leadInfo?.fullName },
                  { label:'التليفون',    val: details.leadInfo?.phone },
                  { label:'الإيميل',     val: details.leadInfo?.email },
                  { label:'المصدر',      val: details.leadInfo?.source },
                  { label:'مسند لـ',     val: details.leadInfo?.assignedUser?.fullName || details.leadInfo?.assignedTo },
                  { label:'الحالة',      val: details.currentStage?.name },
                  { label:'سبب الخسارة', val: details.leadInfo?.lostReason },
                ].filter(f => f.val).map(f => (
                  <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)' }}>{f.label}</span>
                    <span style={{ color:'var(--text)', fontWeight:500 }}>{f.val}</span>
                  </div>
                ))}
                {details.metrics && <div style={{ marginTop:10, padding:'8px 10px', background:'var(--gold-08)', borderRadius:8, fontSize:12, color:'var(--gold)' }}>أيام في البيب لاين: {Math.floor(details.metrics.daysInPipeline)} يوم</div>}
              </div>
            </div>
          )}
          {!loading && tab === 'notes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {notes.length === 0 ? <div style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>لا توجد ملاحظات</div>
                : notes.map((n, i) => (
                  <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ background:'var(--purple-bg)', color:'var(--purple)', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{n.interactionType}</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt(n.createdAt)} - {n.createdBy}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-sec)', lineHeight:1.6 }}>{n.note}</div>
                  </div>
                ))
              }
            </div>
          )}
          {!loading && tab === 'stages' && details && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(!details.stageHistory || details.stageHistory.length === 0) ? <div style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>لا يوجد تاريخ مراحل</div>
                : details.stageHistory.map((h, i) => (
                  <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>{h.fromStage ? `${h.fromStage} → ` : ''}{h.toStage}</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmt(h.changedAt)}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>بواسطة: {h.changedByName}</div>
                  </div>
                ))
              }
            </div>
          )}
          {!loading && tab === 'followup' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {followHistory.length === 0 ? <div style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>لا توجد متابعات مسجلة</div>
                : followHistory.map((f, i) => (
                  <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, color:'var(--yellow)', fontWeight:600 }}>{fmt(f.followUpDate)}</span>
                      <span style={{ background:'var(--yellow-bg)', color:'var(--yellow)', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{f.source}</span>
                    </div>
                    {f.reason && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{f.reason}</div>}
                    <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>{fmt(f.createdAt)}</div>
                  </div>
                ))
              }
            </div>
          )}
          {!loading && tab === 'activity' && details && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(!details.activityTimeline || details.activityTimeline.length === 0) ? <div style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>لا توجد أنشطة</div>
                : details.activityTimeline.map((a, i) => (
                  <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ background: a.type==='Note' ? 'var(--purple-bg)' : a.type==='Stage' ? 'var(--green-bg)' : 'var(--teal-bg)', color: a.type==='Note' ? 'var(--purple)' : a.type==='Stage' ? 'var(--green)' : 'var(--teal)', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{a.type}</span>
                      <span style={{ color:'var(--text-muted)', fontSize:11 }}>{fmt(a.createdAt)} - {a.createdByName}</span>
                    </div>
                    {a.description && <div style={{ color:'var(--text-sec)', fontSize:13, lineHeight:1.5 }}>{a.description}</div>}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════
   KANBAN CARD & BOARD
════════════════════════════════ */
function KanbanActionBtn({ onClick, title, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, height:26, padding:'0 8px', borderRadius:6, border:`1px solid ${hov ? 'var(--border-md)' : 'var(--border)'}`, background: hov ? 'var(--bg-hover)' : 'transparent', color: hov ? 'var(--text)' : 'var(--text-muted)', cursor:'pointer', fontSize:11, fontFamily:"'Cairo',sans-serif", transition:'all .12s', whiteSpace:'nowrap' }}>
      {children}<span style={{ fontSize:11 }}>{title}</span>
    </button>
  )
}
function KanbanWaBtn({ phone }) {
  const [hov, setHov] = useState(false)
  if (!phone) return null
  return (
    <a href={`https://wa.me/${phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" title="واتساب"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, height:26, padding:'0 8px', borderRadius:6, border:`1px solid ${hov ? 'rgba(37,211,102,.5)' : 'rgba(37,211,102,.2)'}`, background: hov ? 'rgba(37,211,102,.12)' : 'rgba(37,211,102,.05)', color:'#25d366', cursor:'pointer', fontSize:11, fontFamily:"'Cairo',sans-serif", transition:'all .12s', textDecoration:'none', whiteSpace:'nowrap' }}>
      <WaIcon size={11} /><span style={{ fontSize:11 }}>واتساب</span>
    </a>
  )
}
function KanbanCard({ lead, onDragStart, onDragEnd, onAction }) {
  const [hov, setHov] = useState(false)
  const fmtShort = d => d ? new Date(d).toLocaleDateString('ar-EG', { day:'numeric', month:'short' }) : null
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'var(--bg-card)', border:`1px solid ${hov ? 'var(--border-md)' : 'var(--border)'}`, borderRadius:10, padding:'11px 13px', cursor:'grab', userSelect:'none', transition:'border-color .15s, box-shadow .15s', boxShadow: hov ? 'var(--shadow-card)' : 'none' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name || lead.fullName}</div>
      {(lead.assignedUser?.fullName || fmtShort(lead.lastActivityAt)) && (
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:9, display:'flex', gap:8, alignItems:'center' }}>
          {lead.assignedUser?.fullName && <span style={{ display:'flex', alignItems:'center', gap:3 }}><IconUser size={10} /> {lead.assignedUser.fullName}</span>}
          {fmtShort(lead.lastActivityAt) && <span>· {fmtShort(lead.lastActivityAt)}</span>}
        </div>
      )}
      <div style={{ height:'1px', background:'var(--border)', margin:'0 0 9px' }} />
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        <KanbanWaBtn phone={lead.phone} />
        <KanbanActionBtn onClick={() => onAction('note',    lead)} title="ملاحظة"><IconNote size={11} /></KanbanActionBtn>
        <KanbanActionBtn onClick={() => onAction('task',    lead)} title="مهمة"><IconTask size={11} /></KanbanActionBtn>
        <KanbanActionBtn onClick={() => onAction('followup',lead)} title="متابعة"><IconCalendar size={11} /></KanbanActionBtn>
        <KanbanActionBtn onClick={() => onAction('assign',  lead)} title="تعيين"><IconUser size={11} /></KanbanActionBtn>
        <KanbanActionBtn onClick={() => onAction('details', lead)} title="تفاصيل"><IconEye size={11} /></KanbanActionBtn>
      </div>
    </div>
  )
}
function KanbanBoard({ onAction }) {
  const [pipeline, setPipeline]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [dragOverCol, setDragOverCol] = useState(null)
  const [modal, setModal]             = useState(null)
  const [toast, setToast]             = useState(null)
  const dragged    = useRef(null)
  const dragFromId = useRef(null)
  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800) }
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const res = await fetch(`${API_BASE_URL}/api/leads/pipeline`, { headers:authHeaders(), credentials:'include' }); if (!res.ok) throw new Error(`خطأ ${res.status}`); const data = await res.json(); setPipeline(Array.isArray(data) ? data : (data?.data || [])) }
    catch(e) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  const getLeads = statusId => (pipeline.find(p => p.stageId === statusId)?.leads || [])
  const handleDrop = async (toStatusId) => {
    setDragOverCol(null); const lead = dragged.current; const fromId = dragFromId.current
    if (!lead || fromId === toStatusId) return
    const toStatus = KANBAN_STATUSES.find(s => s.id === toStatusId)
    setPipeline(prev => prev.map(stage => {
      if (stage.stageId === fromId) return { ...stage, leads: stage.leads.filter(l => l.id !== lead.id), totalLeads: Math.max(0, (stage.totalLeads || 1) - 1) }
      if (stage.stageId === toStatusId) return { ...stage, leads: [...(stage.leads || []), lead], totalLeads: (stage.totalLeads || 0) + 1 }
      return stage
    }))
    showToast(`جاري نقل ${lead.name || lead.fullName} إلى ${toStatus?.label}...`)
    try { const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/status`, { method:'PUT', headers:authHeaders(), credentials:'include', body:JSON.stringify({ status: toStatusId }) }); if (!res.ok) throw new Error(`خطأ ${res.status}`); showToast(`تم نقل ${lead.name || lead.fullName} إلى ${toStatus?.label}`) }
    catch(e) { showToast(e.message, false); load() }
  }
  const handleCardAction = (type, lead) => {
    if (type === 'details') { onAction('details', { id: lead.id, fullName: lead.name || lead.fullName }); return }
    setModal({ type, lead: { ...lead, fullName: lead.name || lead.fullName } })
  }
  const onModalSuccess = () => { setModal(null); showToast('تم الحفظ بنجاح') }
  if (loading) return <div style={{ color:'var(--gold)', textAlign:'center', padding:60, fontFamily:"'Cairo',sans-serif" }}>جاري تحميل البيب لاين...</div>
  if (error)   return <div style={{ color:'var(--red)', textAlign:'center', padding:40, fontFamily:"'Cairo',sans-serif" }}>{error}</div>
  return (
    <>
      {toast && <div style={{ position:'fixed', top:'calc(var(--header-h,60px) + 12px)', left:'50%', transform:'translateX(-50%)', zIndex:2000, background: toast.ok ? 'var(--green-bg)' : 'var(--red-bg)', border:`1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`, color: toast.ok ? 'var(--green)' : 'var(--red)', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:600, boxShadow:'var(--shadow-modal)', pointerEvents:'none', fontFamily:"'Cairo',sans-serif" }}>{toast.msg}</div>}
      <div className="kb-scroll" style={{ overflowX:'auto', paddingBottom:12 }}>
        <div style={{ display:'flex', gap:10, minWidth:'max-content', padding:'4px 2px 12px', alignItems:'flex-start' }}>
          {KANBAN_STATUSES.map(s => {
            const leads = getLeads(s.id); const isOver = dragOverCol === s.id
            return (
              <div key={s.id} style={{ width:225, flexShrink:0, display:'flex', flexDirection:'column', borderRadius:12, background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <div style={{ padding:'10px 13px 9px', borderBottom:'1px solid var(--border)', borderTop:`3px solid ${s.color}`, background:'var(--bg-base)', borderRadius:'12px 12px 0 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:10, background:s.bg, color:s.color }}>{leads.length}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{s.label}</span>
                  </div>
                </div>
                <div className="kb-col" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect='move'; setDragOverCol(s.id) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null) }} onDrop={() => handleDrop(s.id)}
                  style={{ flex:1, padding:8, display:'flex', flexDirection:'column', gap:7, minHeight:80, background: isOver ? 'var(--gold-08)' : 'transparent', border: isOver ? '1.5px dashed var(--gold-35)' : '1.5px solid transparent', borderRadius: isOver ? 8 : 0, transition:'background .12s, border .12s' }}>
                  {leads.length === 0 ? <div style={{ color:'var(--text-faint)', textAlign:'center', fontSize:12, padding:'18px 0', fontStyle:'italic' }}>لا يوجد</div>
                    : leads.map(l => <KanbanCard key={l.id} lead={l} onDragStart={() => { dragged.current = l; dragFromId.current = s.id }} onDragEnd={() => { dragged.current = null; dragFromId.current = null; setDragOverCol(null) }} onAction={handleCardAction} />)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {modal?.type === 'note'     && <NoteModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'task'     && <TaskModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'followup' && <FollowUpModal lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'assign'   && <AssignModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
    </>
  )
}

/* ════════════════════════════════
   FOLLOW-UPS VIEW
════════════════════════════════ */
function FollowUpsView({ onAction }) {
  const [today, setToday]     = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [tr, or] = await Promise.all([
          fetch(`${API_BASE_URL}/api/leads/follow-ups?today=true`,   { headers:authHeaders(), credentials:'include' }),
          fetch(`${API_BASE_URL}/api/leads/follow-ups?overdue=true`, { headers:authHeaders(), credentials:'include' }),
        ])
        if (tr.ok) { const d = await tr.json(); setToday(Array.isArray(d) ? d : (d?.data || [])) }
        if (or.ok) { const d = await or.json(); setOverdue(Array.isArray(d) ? d : (d?.data || [])) }
      } catch {} finally { setLoading(false) }
    })()
  }, [])
  if (loading) return <div style={{ color:'var(--gold)', textAlign:'center', padding:60 }}>جاري التحميل...</div>
  const Row = ({ l, color }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
      <div><div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{l.fullName}</div><div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{l.phone}{l.followUpReason ? ` - ${l.followUpReason}` : ''}</div></div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <Badge status={resolveStatus(l.status)} />
        <span style={{ fontSize:11, color, fontWeight:700 }}>{fmt(l.followUpDate)}</span>
        <button onClick={() => onAction('details', { id:l.id, fullName:l.fullName })} style={{ ...btnSec, height:28, padding:'0 10px', fontSize:11 }}>تفاصيل</button>
        <button onClick={() => onAction('note',    { id:l.id, fullName:l.fullName })} style={{ ...btnSec, height:28, padding:'0 10px', fontSize:11 }}>ملاحظة</button>
      </div>
    </div>
  )
  const Section = ({ title, leads, color, empty }) => (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{title}</span>
        <span style={{ background:`${color}22`, color, padding:'2px 10px', borderRadius:10, fontSize:12, fontWeight:700 }}>{leads.length}</span>
      </div>
      {leads.length === 0 ? <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>{empty}</div>
        : leads.map((l, i) => <Row key={i} l={l} color={color} />)}
    </div>
  )
  return (
    <>
      <Section title="متابعات اليوم"  leads={today}  color="var(--gold)" empty="لا توجد متابعات اليوم" />
      <Section title="متابعات متأخرة" leads={overdue} color="var(--red)"  empty="لا توجد متابعات متأخرة" />
    </>
  )
}

/* ════════════════════════════════
   ARCHIVED VIEW
════════════════════════════════ */
function ArchivedView({ onAction }) {
  const [leads, setLeads]     = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      try { const res = await fetch(`${API_BASE_URL}/api/leads/archived`, { headers:authHeaders(), credentials:'include' }); if (res.ok) { const data = await res.json(); setLeads(Array.isArray(data) ? data : (data?.data || [])) } }
      catch {} finally { setLoading(false) }
    })()
  }, [])
  if (loading) return <div style={{ color:'var(--gold)', textAlign:'center', padding:60 }}>جاري التحميل...</div>
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
      {leads.length === 0 ? <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>لا توجد leads مؤرشفة</div>
        : leads.map(l => (
          <div key={l.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
            <div><div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>{l.fullName}</div><div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>أُرشف: {fmt(l.archivedAt)}</div></div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Badge status={resolveStatus(l.status)} />
              <button onClick={() => onAction('archive', { ...l, isArchived:true })} style={{ ...btnPrim, height:30, padding:'0 12px', fontSize:12 }}>استعادة</button>
            </div>
          </div>
        ))
      }
    </div>
  )
}

/* ════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [all, setAll]               = useState([])
  const [filtered, setFiltered]     = useState([])
  const [search, setSearch]         = useState('')
  const [fStatus, setFStatus]       = useState('')
  const [fSource, setFSource]       = useState('')
  const [sources, setSources]       = useState([])
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const [toast, setToast]           = useState(null)
  const [view, setView]             = useState('table')
  const [modal, setModal]           = useState(null)
  const [drawer, setDrawer]         = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [todayCount, setTodayCount] = useState(0)

  const loadLeads = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setError('غير مسجل الدخول'); setLoading(false); return }
    try {
      let pg = 1, size = 100, total = Infinity, acc = []
      while (acc.length < total) {
        const res = await fetch(`${API_BASE_URL}/api/leads?pageNumber=${pg}&pageSize=${size}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
        if (!res.ok) throw new Error(res.status)
        const json = await res.json(); const d = json?.data || json; const items = d?.data || d || []
        total = d?.totalCount ?? items.length; acc = [...acc, ...items]
        if (items.length < size) break; pg++
      }
      setAll(acc); setFiltered(acc)
      setSources([...new Set(acc.map(l => l.source).filter(Boolean))])
      setLastUpdate('آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG'))
      setLoading(false)
    } catch(e) { setError('فشل تحميل البيانات: ' + e.message); setLoading(false) }
  }, [])

  const loadTodayCount = useCallback(async () => {
    try { const res = await fetch(`${API_BASE_URL}/api/leads/follow-ups?today=true`, { headers:authHeaders(), credentials:'include' }); if (res.ok) { const d = await res.json(); setTodayCount(Array.isArray(d) ? d.length : (d?.data?.length || 0)) } } catch {}
  }, [])

  useEffect(() => { loadLeads(); loadTodayCount() }, [loadLeads, loadTodayCount])

  const applyFilters = useCallback(() => {
    const q = search.trim().toLowerCase()
    setFiltered(all.filter(l => (!q || (l.fullName||'').toLowerCase().includes(q) || (String(l.phone||'')).includes(q)) && (!fStatus || resolveStatus(l.status) === fStatus) && (!fSource || l.source === fSource)))
    setPage(1)
  }, [all, search, fStatus, fSource])

  useEffect(() => { applyFilters() }, [applyFilters])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }
  const handleAction = (type, lead) => { if (type === 'details') { setDrawer(lead); return }; setModal({ type, lead }) }
  const onModalSuccess = () => { setModal(null); showToast('تم الحفظ بنجاح'); loadLeads(); loadTodayCount() }

  const exportCSV = () => {
    const h = ['الاسم','التليفون','الإيميل','المصدر','الحالة','تاريخ الإضافة','مسند لـ']
    const rows = filtered.map(l => [l.fullName, l.phone, l.email, l.source, BADGES[resolveStatus(l.status)]?.label || l.status, fmt(l.createdAt), l.assignedTo || ''].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(','))
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + [h.join(','), ...rows].join('\n')], { type:'text/csv;charset=utf-8' })); a.download = 'zeiia-leads.csv'; a.click()
  }
  const exportExcel = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/export`, { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` }, credentials:'include' })
      if (!res.ok) throw new Error('فشل التصدير')
      const blob = await res.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `leads_${new Date().toLocaleDateString('ar-EG').replace(/\//g,'-')}.xlsx`; a.click(); URL.revokeObjectURL(a.href)
    } catch(e) { showToast(e.message, false) }
  }

  const stats = [
    { label:'إجمالي الليدز', val: all.length,                                              sub:'كل السجلات' },
    { label:'جدد',           val: all.filter(l => resolveStatus(l.status) === 'New').length,        sub:'New' },
    { label:'مهتمين',        val: all.filter(l => resolveStatus(l.status) === 'Interested').length, sub:'Interested' },
    { label:'تم التحويل',    val: all.filter(l => resolveStatus(l.status) === 'Converted').length,  sub:'Converted' },
  ]

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const slice      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const COLS = [
    { label:'الاسم',         key:'fullName',        width:160 },
    { label:'التليفون',      key:'phone',           width:150 },
    { label:'الحالة',        key:'status',          width:110 },
    { label:'المصدر',        key:'source',          width:110 },
    { label:'مسند لـ',       key:'assignedTo',      width:130 },
    { label:'آخر تفاعل',     key:'lastInteraction', width:160 },
    { label:'الإيميل',       key:'email',           width:180 },
    { label:'تاريخ الإضافة', key:'createdAt',       width:120 },
    { label:'إجراءات',       key:'actions',         width:140 },
  ]

  const viewTabs = [
    { id:'table',     label:'القائمة',    Icon:IconList },
    { id:'kanban',    label:'البيب لاين', Icon:IconKanban },
    { id:'followups', label:`المتابعات${todayCount > 0 ? ` (${todayCount})` : ''}`, Icon:IconCalendar },
    { id:'archived',  label:'الأرشيف',   Icon:IconArchive },
  ]

  const WaBtn = ({ phone }) => phone ? (
    <a href={`https://wa.me/${phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" title="واتساب"
      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:6, background:'rgba(37,211,102,.12)', flexShrink:0, textDecoration:'none', transition:'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(37,211,102,.3)'; e.currentTarget.style.transform='scale(1.12)' }}
      onMouseLeave={e => { e.currentTarget.style.background='rgba(37,211,102,.12)'; e.currentTarget.style.transform='scale(1)' }}
    ><WaIcon size={12} /></a>
  ) : null

  /* ── Header Actions (passed to DashboardLayout) ── */
  const headerActions = (
    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
      <button onClick={() => setShowCreate(true)} style={btnPrim}><IconAdd /> ليد جديد</button>
      <button onClick={loadLeads}                 style={btnSec}><IconRefresh /> تحديث</button>
      <button onClick={exportCSV}                 style={btnSec}>CSV</button>
      <button onClick={exportExcel}               style={btnSec}>Excel</button>
      <button onClick={() => setShowImport(true)} style={btnSec}><IconUpload /> استيراد</button>
    </div>
  )

  const Ico_Refresh = () => <Ico size={13}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ico>
  const IconRefresh = Ico_Refresh

  if (loading) return (
    <DashboardLayout title="Leads Dashboard" breadcrumb="الداشبورد">
      <div className="db-page db-loading"><svg className="db-spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>جاري تحميل البيانات...</div>
    </DashboardLayout>
  )
  if (error) return (
    <DashboardLayout title="Leads Dashboard" breadcrumb="الداشبورد">
      <div className="db-page"><div className="db-error-box">{error}</div></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout
      title="Leads Dashboard"
      breadcrumb="الداشبورد"
      headerActions={headerActions}
      onOpenLead={(leadId) => { setDrawer({ id: leadId, fullName: '', openTab: 'notes' }); setView('table') }}
    >
      <div className="db-page" style={{ direction:'rtl' }}>
        <style>{`
          .leads-tbl::-webkit-scrollbar{height:5px}
          .leads-tbl::-webkit-scrollbar-track{background:var(--bg-base)}
          .leads-tbl::-webkit-scrollbar-thumb{background:var(--bg-elevated);border-radius:3px}
          .leads-tbl::-webkit-scrollbar-thumb:hover{background:var(--gold)}
        `}</style>

        <Toast toast={toast} />

        {/* ── Last update ── */}
        {lastUpdate && <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:16 }}>{lastUpdate}</div>}

        {/* ── Stats ── */}
        <div className="db-stats">
          {stats.map(s => (
            <div key={s.label} className="db-stat">
              <div className="db-stat__accent" style={{ background:'var(--gold)' }} />
              <div className="db-stat__label">{s.label}</div>
              <div className="db-stat__value">{s.val}</div>
              <div className="db-stat__sub" style={{ color:'var(--gold)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── View Tabs ── */}
        <div className="db-tabs" style={{ marginBottom:16 }}>
          {viewTabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`db-tab${view === t.id ? ' db-tab--active' : ''}`}>
              <t.Icon /> {t.label}
            </button>
          ))}
        </div>

        {view === 'kanban'    && <KanbanBoard   onAction={handleAction} />}
        {view === 'followups' && <FollowUpsView onAction={handleAction} />}
        {view === 'archived'  && <ArchivedView  onAction={handleAction} />}

        {/* ── Table View ── */}
        {view === 'table' && (
          <>
            {/* Filters */}
            <div className="db-filters">
              <input
                className="db-input" style={{ flex:1, maxWidth:280 }}
                placeholder="ابحث بالاسم أو التليفون..." value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="db-select" style={{ width:160 }} value={fStatus} onChange={e => setFStatus(e.target.value)}>
                <option value="">كل الحالات</option>
                {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select className="db-select" style={{ width:160 }} value={fSource} onChange={e => setFSource(e.target.value)}>
                <option value="">كل المصادر</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="db-card">
              {/* Desktop table */}
              {!isMobile ? (
                <div className="db-table-wrap leads-tbl">
                  <table className="db-table">
                    <thead>
                      <tr>
                        {COLS.map(c => <th key={c.key} style={{ minWidth:c.width }}>{c.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {slice.length === 0
                        ? <tr><td colSpan={COLS.length} style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>لا توجد نتائج</td></tr>
                        : slice.map(l => (
                          <tr key={l.id}>
                            <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis' }}>
                              {l.hasComplaint && <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'var(--red)', marginLeft:5, verticalAlign:'middle' }} title="شكوى" />}
                              {l.fullName || 'unknown'}
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontFamily:'monospace', letterSpacing:.5 }}>{l.phone || 'unknown'}</span>
                                <WaBtn phone={l.phone} />
                              </div>
                            </td>
                            <td><Badge status={resolveStatus(l.status)} /></td>
                            <td>{l.source ? <span style={{ background:'var(--gold-08)', color:'var(--gold)', padding:'2px 8px', borderRadius:6, fontSize:11 }}>{l.source}</span> : <span style={{ color:'var(--text-faint)' }}>—</span>}</td>
                            <td style={{ color:'var(--text-sec)' }}>{l.assignedTo || <span style={{ color:'var(--text-faint)', fontStyle:'italic' }}>غير مسند</span>}</td>
                            <td style={{ color:'var(--text-muted)' }}>{fmtI(l.lastInteractionDate, l.lastInteractionType)}</td>
                            <td style={{ color:'var(--text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{l.email || '—'}</td>
                            <td style={{ color:'var(--text-muted)' }}>{fmt(l.createdAt)}</td>
                            <td><ActionMenu lead={l} onAction={handleAction} /></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Mobile cards */
                <div>
                  {slice.length === 0
                    ? <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>لا توجد نتائج</div>
                    : slice.map(l => (
                      <div key={l.id} style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>
                            {l.hasComplaint && <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'var(--red)', marginLeft:5, verticalAlign:'middle' }} />}
                            {l.fullName || 'unknown'}
                          </div>
                          <Badge status={resolveStatus(l.status)} />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                            <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, letterSpacing:.5 }}>التليفون</div>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <span style={{ fontSize:12, color:'var(--text)' }}>{l.phone || '—'}</span>
                              <WaBtn phone={l.phone} />
                            </div>
                          </div>
                          {[{ label:'المصدر', val:l.source||'—' },{ label:'مسند لـ', val:l.assignedTo||'غير مسند' },{ label:'التاريخ', val:fmt(l.createdAt) }].map(f => (
                            <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, letterSpacing:.5 }}>{f.label}</div>
                              <div style={{ fontSize:12, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.val}</div>
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
              <div className="db-pagination">
                <div className="db-text-muted" style={{ fontSize:12 }}>
                  {filtered.length === 0 ? 'لا توجد نتائج' : `عرض ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} من ${filtered.length}`}
                </div>
                <div className="db-pagination__pages" style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  <button className="db-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const s = Math.max(1, page - 2), p = s + i
                    if (p > totalPages) return null
                    return <button key={p} onClick={() => setPage(p)} className={`db-page-btn${p === page ? ' db-page-btn--active' : ''}`}>{p}</button>
                  })}
                  <button className="db-page-btn" disabled={page >= totalPages || !totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Modals ── */}
        {showCreate                && <CreateLeadModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); showToast('تم إضافة الليد'); loadLeads() }} />}
        {modal?.type === 'status'  && <StatusModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'assign'  && <AssignModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'note'    && <NoteModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'task'    && <TaskModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'followup'&& <FollowUpModal lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'edit'    && <EditModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'convert' && <ConvertModal  lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {modal?.type === 'archive' && <ArchiveModal  lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
        {drawer     && <DetailsDrawer lead={drawer} onClose={() => setDrawer(null)} />}
        {showImport && <ImportModal  onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); showToast('تم الاستيراد بنجاح'); loadLeads() }} />}
      </div>
    </DashboardLayout>
  )
}