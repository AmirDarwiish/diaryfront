import { useEffect, useState, useCallback, useRef } from 'react'
import API_BASE_URL from '../../config'
import { useNavigate } from 'react-router-dom'  // في الأعلى


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
// خلينا القيم أرقام (تأكد إنها مطابقة للأرقام في الـ C# Enum عندك)
const INTERACTION_TYPES = [
  { value: 0, label: 'ملاحظة عامة' },
  { value: 1, label: 'مكالمة' },
  { value: 2, label: 'إيميل' },
  { value: 3, label: 'واتساب' },
  { value: 4, label: 'اجتماع' },
  { value: 5, label: 'شكوى' },
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
   SHARED STYLES
════════════════════════════════ */
const lbl      = { fontSize:12, color:'#94a3b8', fontWeight:600, display:'block', marginBottom:6 }
const inp      = { width:'100%', boxSizing:'border-box', height:38, background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none' }
const sel      = { ...inp, cursor:'pointer' }
const btnPrim  = { height:38, padding:'0 20px', borderRadius:8, border:'none', background:'#C9A96E', color:'#0f172a', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }
const btnSec   = { height:38, padding:'0 16px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#94a3b8', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }
const btnDanger= { height:38, padding:'0 16px', borderRadius:8, border:'1px solid rgba(248,113,113,.3)', background:'rgba(248,113,113,.08)', color:'#f87171', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }

/* ════════════════════════════════
   SVG ICONS
════════════════════════════════ */
const Ico = ({ children, ...p }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
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
const IconLogout   = () => <Ico><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>
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
    if (typeof window === 'undefined') return;
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
   MODAL BACKDROP
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
      <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:16, width:'100%', maxWidth, padding:24, direction:'rtl', boxShadow:'0 25px 60px rgba(0,0,0,.5)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
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
   ACTION MENU (Mobile Responsive)
════════════════════════════════ */
function ActionMenu({ lead, onAction }) {
  const [open, setOpen]           = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const btnRef  = useRef()
  const menuRef = useRef()

  // 1. التحكم في قفل القائمة عند الضغط خارجها أو عند السحب
  useEffect(() => {
    const close = e => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)

    // ضفنا touchstart لدعم أقوى على الموبايل
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    
    // لو القائمة مفتوحة واليوزر عمل سكرول، تقفل تلقائي عشان متفضلش طايرة
    if (open) window.addEventListener('scroll', closeOnScroll, { passive: true })

    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      window.removeEventListener('scroll', closeOnScroll)
    }
  }, [open])

  // 2. حساب الموضع الذكي (Smart Positioning)
  useEffect(() => {
    if (!open || !btnRef.current) return
    const rect   = btnRef.current.getBoundingClientRect()
    
    // حساب المساحة الرأسية (فوق أو تحت)
    const openUp = window.innerHeight - rect.bottom < 320
    
    // حساب المساحة الأفقية (عشان متخرجش برا الشاشة)
    const menuWidth = 195;
    let safeLeft = rect.left;

    // لو القائمة هتخرج من يمين الشاشة
    if (safeLeft + menuWidth > window.innerWidth) {
      safeLeft = window.innerWidth - menuWidth - 16; // 16px هامش أمان
    }
    // لو هتخرج من شمال الشاشة
    if (safeLeft < 16) {
      safeLeft = 16;
    }

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
    { key:'note',     Icon:IconNote,     label:'إضافة ملاحظة',  color:'#C9A96E' },
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
        background: open ? 'rgba(201,169,110,.12)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${open ? '#C9A96E' : '#334155'}`,
        borderRadius:8, color: open ? '#C9A96E' : '#94a3b8',
        cursor:'pointer', padding:'5px 12px', fontSize:12,
        fontFamily:"'Cairo',sans-serif", display:'flex', alignItems:'center', gap:6, transition:'all .15s',
      }}>
        إجراءات <IconChevron up={open} />
      </button>

      {open && (
        <div ref={menuRef} style={{ ...menuStyle, background:'#0d1829', border:'1px solid #1e3a5f', borderRadius:10, boxShadow:'0 16px 40px rgba(0,0,0,.6)', overflow:'hidden' }}>
          {actions.map((a, i) => (
            <button key={a.key}
              onClick={() => { setOpen(false); onAction(a.key, lead) }}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'none', border:'none', borderBottom: i < actions.length-1 ? '1px solid rgba(30,58,95,.6)' : 'none', color:'#cbd5e1', cursor:'pointer', padding:'10px 14px', fontSize:13, fontFamily:"'Cairo',sans-serif", textAlign:'right', transition:'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(201,169,110,.07)'; e.currentTarget.style.color='#f1f5f9'; e.currentTarget.querySelector('.ai').style.color=a.color }}
              onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#cbd5e1'; e.currentTarget.querySelector('.ai').style.color='#475569' }}
            >
              <span className="ai" style={{ color:'#475569', display:'flex', alignItems:'center', transition:'color .12s' }}><a.Icon /></span>
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
      const res = await fetch(`${API_BASE_URL}/api/leads`, {
        method:'POST', headers:authHeaders(), credentials:'include',
        body:JSON.stringify(form),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="إضافة ليد جديد" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[
          { k:'fullName', label:'الاسم الكامل *', ph:'الاسم...' },
          { k:'phone',    label:'التليفون *',      ph:'01xxxxxxxxx' },
          { k:'email',    label:'الإيميل',         ph:'example@mail.com' },
          { k:'source',   label:'المصدر',          ph:'Facebook, Website...' },
        ].map(f => (
          <div key={f.k}><label style={lbl}>{f.label}</label><input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={inp} /></div>
        ))}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={{ ...btnPrim, display:'flex', alignItems:'center', gap:6 }}><IconAdd /> {loading ? '...' : 'إضافة'}</button>
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
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/status`, {
        method:'PUT', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ status:statusId, ...(statusId===6 && reason ? { reason } : {}) }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.detail || j?.title || j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
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
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`, { headers:authHeaders(), credentials:'include' })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : (data?.data || []))
      } catch { setUsers([]) }
      finally { setFetching(false) }
    })()
  }, [])

  const submit = async () => {
    if (!userId) { setError('اختر موظف'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/assign`, {
        method:'PUT', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ userId:parseInt(userId) }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تعيين موظف: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {fetching
          ? <div style={{ color:'#94a3b8', textAlign:'center', padding:20 }}>جاري التحميل...</div>
          : <div><label style={lbl}>اختر الموظف</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} style={sel}>
                <option value="">-- اختر --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
        }
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
  const [note, setNote]       = useState('')
  const [type, setType]       = useState(0) // <-- تم التعديل لرقم 0
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const submit = async () => {
    if (!note.trim()) { setError('اكتب الملاحظة'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/notes`, {
        method:'POST', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ note, interactionType: type }), // type هنا رقم
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`إضافة ملاحظة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div><label style={lbl}>نوع التفاعل</label>
          {/* تم إضافة parseInt لتحويل القيمة المختارة لرقم */}
          <select value={type} onChange={e => setType(parseInt(e.target.value))} style={sel}>
            {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div><label style={lbl}>الملاحظة</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="اكتب ملاحظتك هنا..." rows={4}
            style={{ ...inp, resize:'vertical', height:'auto', padding:'10px 11px', lineHeight:1.6 }} />
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
   TASK MODAL
════════════════════════════════ */
function TaskModal({ lead, onClose, onSuccess }) {
  const [title, setTitle]     = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const submit = async () => {
    if (!title.trim()) { setError('اكتب عنوان المهمة'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/tasks`, {
        method:'POST', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ title, ...(dueDate ? { dueDate } : {}) }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`إضافة مهمة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div><label style={lbl}>عنوان المهمة *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="اكتب المهمة..." style={inp} /></div>
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/follow-up`, {
        method:'PUT', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ followUpDate:date, reason }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}`, {
        method:'PUT', headers:authHeaders(), credentials:'include',
        body:JSON.stringify(form),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تعديل: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[
          { k:'fullName', label:'الاسم الكامل *', ph:'الاسم...' },
          { k:'phone',    label:'التليفون *',      ph:'01xxxxxxxxx' },
          { k:'email',    label:'الإيميل',         ph:'example@mail.com' },
          { k:'source',   label:'المصدر',          ph:'Facebook, Website...' },
        ].map(f => (
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
      try {
        const res = await fetch(`${API_BASE_URL}/api/course-classes`, { headers:authHeaders(), credentials:'include' })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setClasses(Array.isArray(data) ? data : (data?.data || []))
      } catch { setClasses([]) }
      finally { setFetching(false) }
    })()
  }, [])

  const selected = classes.find(c => c.id === parseInt(classId))

  const submit = async () => {
    if (!classId) { setError('اختر الكورس'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/convert`, {
        method:'POST', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ courseClassId:parseInt(classId), ...(paid ? { paidAmount:parseFloat(paid) } : {}) }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تحويل لعميل: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#34d399' }}>
          سيتم إنشاء حساب عميل جديد وتسجيله في الكورس المختار
        </div>
        <div><label style={lbl}>الكورس *</label>
          {fetching
            ? <div style={{ color:'#94a3b8', padding:10 }}>جاري التحميل...</div>
            : <select value={classId} onChange={e => setClassId(e.target.value)} style={sel}>
                <option value="">-- اختر الكورس --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.courseName || c.name} {c.price ? `-- ${c.price} ج` : ''}</option>)}
              </select>
          }
        </div>
        {selected && (
          <div><label style={lbl}>المبلغ المدفوع (اختياري -- max: {selected.price} ج)</label>
            <input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" max={selected.price} style={inp} />
          </div>
        )}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={{ ...btnPrim, background:'#34d399' }}>{loading ? '...' : 'تحويل الآن'}</button>
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
    try {
      const url = isArchived
        ? `${API_BASE_URL}/api/leads/${lead.id}/restore`
        : `${API_BASE_URL}/api/leads/${lead.id}/archive`
      const res = await fetch(url, { method:'PUT', headers:authHeaders(), credentials:'include' })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={isArchived ? `استعادة: ${lead.fullName}` : `أرشفة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ color:'#94a3b8', fontSize:14, lineHeight:1.7 }}>
          {isArchived ? 'هل تريد استعادة هذا الليد وإعادته للقائمة النشطة؟' : 'هل تريد أرشفة هذا الليد؟ يمكنك استعادته لاحقاً من تاب الأرشيف.'}
        </div>
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
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE_URL}/api/leads/import`, {
        method:'POST', headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` },
        credentials:'include', body:fd,
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      setResult(await res.json())
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="استيراد Leads من Excel" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#38bdf8', lineHeight:1.7 }}>
          الأعمدة المطلوبة بالترتيب: <strong>FullName - Phone - Email - Source</strong>
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#C9A96E' }}
          onDragLeave={e => { e.currentTarget.style.borderColor = file ? '#C9A96E' : '#334155' }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) setFile(f) }}
          style={{ border:`2px dashed ${file ? '#C9A96E' : '#334155'}`, borderRadius:10, padding:'28px 16px', textAlign:'center', cursor:'pointer', background: file ? 'rgba(201,169,110,.06)' : 'transparent', transition:'all .15s' }}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
          <div style={{ fontSize:13, color: file ? '#C9A96E' : '#64748b' }}>{file ? `ok ${file.name}` : 'اضغط أو اسحب ملف Excel هنا'}</div>
        </div>
        <ErrBox msg={error} />
        {result && (
          <div style={{ background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, padding:'12px 14px', fontSize:13 }}>
            <div style={{ color:'#34d399', fontWeight:700, marginBottom:6 }}>تم الاستيراد بنجاح</div>
            <div style={{ color:'#94a3b8' }}>تم استيراد: <strong style={{ color:'#f1f5f9' }}>{result.imported}</strong></div>
            <div style={{ color:'#94a3b8' }}>تم تخطيه: <strong style={{ color:'#fbbf24' }}>{result.skipped}</strong></div>
            {result.errors?.slice(0, 3).map((e, i) => <div key={i} style={{ fontSize:11, color:'#f87171', marginTop:2 }}>{e}</div>)}
          </div>
        )}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={result ? onSuccess : onClose} style={btnSec}>{result ? 'إغلاق وتحديث' : 'إلغاء'}</button>
          {!result && <button onClick={submit} disabled={loading || !file} style={btnPrim}>{loading ? 'جاري الاستيراد...' : 'استيراد'}</button>}
        </div>
      </div>
    </Modal>
  )
}

/* ════════════════════════════════
   DETAILS DRAWER  (tabbed)
════════════════════════════════ */
function DetailsDrawer({ lead, onClose }) {
  const [details, setDetails]         = useState(null)
  const [notes, setNotes]             = useState([])
  const [followHistory, setFollowHistory] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [tab, setTab]                 = useState('info')

  useEffect(() => {
    ;(async () => {
      try {
        const [dr, nr, fhr] = await Promise.all([
          fetch(`${API_BASE_URL}/api/leads/${lead.id}/details`,            { headers:authHeaders(), credentials:'include' }),
          fetch(`${API_BASE_URL}/api/leads/${lead.id}/notes`,              { headers:authHeaders(), credentials:'include' }),
          fetch(`${API_BASE_URL}/api/leads/${lead.id}/follow-up-history`, { headers:authHeaders(), credentials:'include' }),
        ])
        if (dr.ok)  setDetails(await dr.json())
        if (nr.ok)  { const nd = await nr.json(); setNotes(Array.isArray(nd) ? nd : (nd?.data || [])) }
        if (fhr.ok) { const fd = await fhr.json(); setFollowHistory(Array.isArray(fd) ? fd : (fd?.data || [])) }
      } catch(e) { setError(e.message) }
      finally { setLoading(false) }
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
    height:30, padding:'0 12px', borderRadius:6, border:'none', cursor:'pointer',
    fontSize:12, fontFamily:"'Cairo',sans-serif", transition:'all .15s',
    background: tab === id ? 'rgba(201,169,110,.15)' : 'transparent',
    color:        tab === id ? '#C9A96E' : '#64748b',
    borderBottom: tab === id ? '2px solid #C9A96E' : '2px solid transparent',
    fontWeight:   tab === id ? 700 : 400,
  })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)', display:'flex', justifyContent:'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth:520, height:'100%', display:'flex', flexDirection:'column', background:'#0f172a', borderLeft:'1px solid #334155', direction:'rtl' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #334155', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:17, fontWeight:800, color:'#C9A96E' }}>تفاصيل الليد</span>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:22, cursor:'pointer' }}>x</button>
          </div>
          <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
            {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(t.id)}>{t.label}</button>)}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {loading && <div style={{ color:'#94a3b8', textAlign:'center', padding:40 }}>جاري التحميل...</div>}
          {error   && <div style={{ color:'#f87171', padding:16, background:'rgba(248,113,113,.08)', borderRadius:8 }}>{error}</div>}

          {!loading && tab === 'info' && details && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, color:'#C9A96E', fontWeight:700, marginBottom:12, letterSpacing:1 }}>معلومات أساسية</div>
                {[
                  { label:'الاسم',      val: details.leadInfo?.name },
                  { label:'التليفون',    val: details.leadInfo?.phone },
                  { label:'الإيميل',     val: details.leadInfo?.email },
                  { label:'المصدر',      val: details.leadInfo?.source },
                  { label:'مسند لـ',     val: details.leadInfo?.assignedUser?.fullName },
                  { label:'الحالة',      val: details.currentStage?.name },
                  { label:'سبب الخسارة', val: details.leadInfo?.lostReason },
                ].filter(f => f.val).map(f => (
                  <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(51,65,85,.4)', fontSize:13 }}>
                    <span style={{ color:'#94a3b8' }}>{f.label}</span>
                    <span style={{ color:'#f1f5f9', fontWeight:500 }}>{f.val}</span>
                  </div>
                ))}
                {details.metrics && (
                  <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(201,169,110,.06)', borderRadius:8, fontSize:12, color:'#C9A96E' }}>
                    أيام في البيب لاين: {Math.floor(details.metrics.daysInPipeline)} يوم
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && tab === 'notes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {notes.length === 0
                ? <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>لا توجد ملاحظات</div>
                : notes.map((n, i) => (
                  <div key={i} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ background:'rgba(167,139,250,.12)', color:'#a78bfa', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{n.interactionType}</span>
                      <span style={{ fontSize:11, color:'#64748b' }}>{fmt(n.createdAt)} - {n.createdBy}</span>
                    </div>
                    <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.6 }}>{n.note}</div>
                  </div>
                ))
              }
            </div>
          )}

          {!loading && tab === 'stages' && details && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(!details.stageHistory || details.stageHistory.length === 0)
                ? <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>لا يوجد تاريخ مراحل</div>
                : details.stageHistory.map((h, i) => (
                  <div key={i} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:600 }}>{h.fromStage ? `${h.fromStage} - ` : ''}{h.toStage}</span>
                      <span style={{ fontSize:11, color:'#64748b' }}>{fmt(h.changedAt)}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>بواسطة: {h.changedByName}</div>
                  </div>
                ))
              }
            </div>
          )}

          {!loading && tab === 'followup' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {followHistory.length === 0
                ? <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>لا توجد متابعات مسجلة</div>
                : followHistory.map((f, i) => (
                  <div key={i} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, color:'#fbbf24', fontWeight:600 }}>{fmt(f.followUpDate)}</span>
                      <span style={{ background:'rgba(251,191,36,.1)', color:'#fbbf24', padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{f.source}</span>
                    </div>
                    {f.reason && <div style={{ fontSize:12, color:'#94a3b8' }}>{f.reason}</div>}
                    <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{fmt(f.createdAt)}</div>
                  </div>
                ))
              }
            </div>
          )}

          {!loading && tab === 'activity' && details && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(!details.activityTimeline || details.activityTimeline.length === 0)
                ? <div style={{ color:'#64748b', textAlign:'center', padding:40 }}>لا توجد أنشطة</div>
                : details.activityTimeline.map((a, i) => (
                  <div key={i} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{
                        background: a.type==='Note' ? 'rgba(167,139,250,.15)' : a.type==='Stage' ? 'rgba(52,211,153,.12)' : 'rgba(56,189,248,.12)',
                        color:      a.type==='Note' ? '#a78bfa' : a.type==='Stage' ? '#34d399' : '#38bdf8',
                        padding:'1px 7px', borderRadius:4, fontSize:10, fontWeight:700,
                      }}>{a.type}</span>
                      <span style={{ color:'#64748b', fontSize:11 }}>{fmt(a.createdAt)} - {a.createdByName}</span>
                    </div>
                    {a.description && <div style={{ color:'#cbd5e1', fontSize:13, lineHeight:1.5 }}>{a.description}</div>}
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
   KANBAN BOARD
════════════════════════════════ */
function KanbanBoard({ onAction }) {
  const [pipeline, setPipeline] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leads/pipeline`, { headers:authHeaders(), credentials:'include' })
        if (!res.ok) throw new Error(`خطأ ${res.status}`)
        const data = await res.json()
        setPipeline(Array.isArray(data) ? data : (data?.data || []))
      } catch(e) { setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div style={{ color:'#C9A96E', textAlign:'center', padding:60 }}>جاري تحميل البيب لاين...</div>
  if (error)   return <div style={{ color:'#f87171', textAlign:'center', padding:40 }}>{error}</div>

  const stageColor = { New:'#38bdf8', Contacted:'#a78bfa', Interested:'#C9A96E', FollowUp:'#fbbf24', Converted:'#34d399', Lost:'#f87171', Cold:'#94a3b8' }

  return (
    <>
      <style>{`.kb-sc::-webkit-scrollbar{height:6px}.kb-sc::-webkit-scrollbar-track{background:#0f172a}.kb-sc::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}.kb-sc::-webkit-scrollbar-thumb:hover{background:#C9A96E}`}</style>
      <div className="kb-sc" style={{ overflowX:'auto', paddingBottom:12 }}>
        <div style={{ display:'flex', gap:12, minWidth:'max-content', padding:'4px 2px 12px' }}>
          {pipeline.map(stage => {
            const color = stageColor[stage.stageName] || '#94a3b8'
            return (
              <div key={stage.stageId} style={{ width:230, background:'#1e293b', border:'1px solid #334155', borderRadius:12, overflow:'hidden', flexShrink:0 }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid #334155', background:'rgba(15,23,42,.6)', borderTop:`3px solid ${color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>{BADGES[stage.stageName]?.label || stage.stageName}</span>
                    <span style={{ background:`${color}22`, color, padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>{stage.totalLeads}</span>
                  </div>
                </div>
                <div style={{ padding:8, display:'flex', flexDirection:'column', gap:8, maxHeight:500, overflowY:'auto' }}>
                  {(!stage.leads || stage.leads.length === 0)
                    ? <div style={{ color:'#475569', textAlign:'center', padding:'20px 0', fontSize:12 }}>لا يوجد</div>
                    : stage.leads.map(l => (
                      <div key={l.id} style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{l.name}</div>
                        {l.assignedUser && <div style={{ fontSize:11, color:'#64748b', marginBottom:6 }}>{l.assignedUser.fullName}</div>}
                        {l.lastActivityAt && <div style={{ fontSize:10, color:'#475569' }}>آخر نشاط: {fmt(l.lastActivityAt)}</div>}
                        <div style={{ marginTop:8 }}>
                          <button onClick={() => onAction('details', { id:l.id, fullName:l.name })}
                            style={{ height:24, padding:'0 10px', borderRadius:5, border:'1px solid #334155', background:'transparent', color:'#94a3b8', fontSize:11, cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}>
                            التفاصيل
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>
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
      } catch {}
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div style={{ color:'#C9A96E', textAlign:'center', padding:60 }}>جاري التحميل...</div>

  const Row = ({ l, color }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', flexWrap:'wrap', gap:8 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>{l.fullName}</div>
        <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{l.phone}{l.followUpReason ? ` - ${l.followUpReason}` : ''}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <Badge status={resolveStatus(l.status)} />
        <span style={{ fontSize:11, color, fontWeight:700 }}>{fmt(l.followUpDate)}</span>
        <button onClick={() => onAction('details', { id:l.id, fullName:l.fullName })} style={{ ...btnSec, height:28, padding:'0 10px', fontSize:11 }}>تفاصيل</button>
        <button onClick={() => onAction('note',    { id:l.id, fullName:l.fullName })} style={{ ...btnSec, height:28, padding:'0 10px', fontSize:11 }}>ملاحظة</button>
      </div>
    </div>
  )

  const Section = ({ title, leads, color, empty }) => (
    <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #334155', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#f1f5f9' }}>{title}</span>
        <span style={{ background:`${color}22`, color, padding:'2px 10px', borderRadius:10, fontSize:12, fontWeight:700 }}>{leads.length}</span>
      </div>
      {leads.length === 0
        ? <div style={{ padding:24, textAlign:'center', color:'#475569', fontSize:13 }}>{empty}</div>
        : leads.map((l, i) => <Row key={i} l={l} color={color} />)
      }
    </div>
  )

  return (
    <>
      <Section title="متابعات اليوم"   leads={today}  color="#C9A96E" empty="لا توجد متابعات اليوم" />
      <Section title="متابعات متأخرة"  leads={overdue} color="#f87171" empty="لا توجد متابعات متأخرة" />
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
      try {
        const res = await fetch(`${API_BASE_URL}/api/leads/archived`, { headers:authHeaders(), credentials:'include' })
        if (res.ok) {
           const data = await res.json()
           setLeads(Array.isArray(data) ? data : (data?.data || []))
        }
      } catch {}
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div style={{ color:'#C9A96E', textAlign:'center', padding:60 }}>جاري التحميل...</div>

  return (
    <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12, overflow:'hidden' }}>
      {leads.length === 0
        ? <div style={{ padding:40, textAlign:'center', color:'#475569' }}>لا توجد leads مؤرشفة</div>
        : leads.map(l => (
          <div key={l.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid rgba(51,65,85,.4)', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>{l.fullName}</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>أُرشف: {fmt(l.archivedAt)}</div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Badge status={resolveStatus(l.status)} />
              <button onClick={() => onAction('archive', { ...l, isArchived:true })}
                style={{ ...btnPrim, height:30, padding:'0 12px', fontSize:12 }}>استعادة</button>
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
  const isMobile = useIsMobile()

  const handleLogout = async () => {
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { method:'POST', headers:authHeaders(), credentials:'include' }) } catch {}
    localStorage.removeItem('token')
    navigate('/dashboard/login')
  }

  const loadLeads = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setError('غير مسجل الدخول'); setLoading(false); return }
    try {
      let pg = 1, size = 100, total = Infinity, acc = []
      while (acc.length < total) {
        const res = await fetch(`${API_BASE_URL}/api/leads?pageNumber=${pg}&pageSize=${size}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
        if (!res.ok) throw new Error(res.status)
        const json = await res.json()
        const d    = json?.data || json
        const items= d?.data || d || []
        total = d?.totalCount ?? items.length
        acc   = [...acc, ...items]
        if (items.length < size) break
        pg++
      }
      setAll(acc); setFiltered(acc)
      setSources([...new Set(acc.map(l => l.source).filter(Boolean))])
      setLastUpdate('آخر تحديث: ' + new Date().toLocaleTimeString('ar-EG'))
      setLoading(false)
    } catch(e) { setError('فشل تحميل البيانات: ' + e.message); setLoading(false) }
  }, [])

  const loadTodayCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/follow-ups?today=true`, { headers:authHeaders(), credentials:'include' })
      if (res.ok) { 
        const d = await res.json(); 
        setTodayCount(Array.isArray(d) ? d.length : (d?.data?.length || 0)) 
      }
    } catch {}
  }, [])

  useEffect(() => { loadLeads(); loadTodayCount() }, [loadLeads, loadTodayCount])

  const applyFilters = useCallback(() => {
    const q = search.trim().toLowerCase()
    setFiltered(all.filter(l =>
      (!q || (l.fullName||'').toLowerCase().includes(q) || (String(l.phone||'')).includes(q)) &&
      (!fStatus || resolveStatus(l.status) === fStatus) &&
      (!fSource || l.source === fSource)
    ))
    setPage(1)
  }, [all, search, fStatus, fSource])

  useEffect(() => { applyFilters() }, [applyFilters])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const handleAction = (type, lead) => {
    if (type === 'details') { setDrawer(lead); return }
    setModal({ type, lead })
  }

  const onModalSuccess = () => { setModal(null); showToast('تم الحفظ بنجاح'); loadLeads(); loadTodayCount() }

  const exportCSV = () => {
    const h    = ['الاسم','التليفون','الإيميل','المصدر','الحالة','تاريخ الإضافة','مسند لـ']
    const rows = filtered.map(l =>
      [l.fullName, l.phone, l.email, l.source, BADGES[resolveStatus(l.status)]?.label || l.status, fmt(l.createdAt), l.assignedTo || '']
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + [h.join(','), ...rows].join('\n')], { type:'text/csv;charset=utf-8' }))
    a.download = 'zeiia-leads.csv'; a.click()
  }

  const exportExcel = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/export`, { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` }, credentials:'include' })
      if (!res.ok) throw new Error('فشل التصدير')
      const blob = await res.blob()
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = `leads_${new Date().toLocaleDateString('ar-EG').replace(/\//g,'-')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { showToast(e.message, false) }
  }

  const stats = [
    { label:'إجمالي الليدز', val: all.length,                                                      sub:'كل السجلات' },
    { label:'جدد',           val: all.filter(l => resolveStatus(l.status) === 'New').length,         sub:'New' },
    { label:'مهتمين',        val: all.filter(l => resolveStatus(l.status) === 'Interested').length,  sub:'Interested' },
    { label:'تم التحويل',    val: all.filter(l => resolveStatus(l.status) === 'Converted').length,   sub:'Converted' },
  ]

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const slice      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const COLS = [
    { label:'الاسم',         key:'fullName',        width:160 },
    { label:'التليفون',      key:'phone',           width:130 },
    { label:'الحالة',        key:'status',          width:110 },
    { label:'المصدر',        key:'source',          width:110 },
    { label:'مسند لـ',       key:'assignedTo',      width:130 },
    { label:'آخر تفاعل',     key:'lastInteraction', width:160 },
    { label:'الإيميل',       key:'email',           width:180 },
    { label:'تاريخ الإضافة', key:'createdAt',       width:120 },
    { label:'إجراءات',       key:'actions',         width:140 },
  ]

  const wrapBase = { background:'#0f172a', minHeight:'100vh', padding:24, direction:'rtl', color:'#fff', fontFamily:"'Cairo',sans-serif" }

  if (loading) return <div style={{ ...wrapBase, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'#C9A96E' }}>جاري تحميل البيانات...</span></div>
  if (error)   return <div style={{ ...wrapBase, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'#f87171' }}>{error}</span></div>

  const viewTabs = [
    { id:'table',     label:'القائمة',    Icon:IconList },
    { id:'kanban',    label:'البيب لاين', Icon:IconKanban },
    { id:'followups', label:`المتابعات${todayCount > 0 ? ` (${todayCount})` : ''}`, Icon:IconCalendar },
    { id:'archived',  label:'الأرشيف',   Icon:IconArchive },
  ]

  return (
    <div style={wrapBase}>
      <style>{`
        .leads-tbl::-webkit-scrollbar{height:6px}
        .leads-tbl::-webkit-scrollbar-track{background:#0f172a}
        .leads-tbl::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
        .leads-tbl::-webkit-scrollbar-thumb:hover{background:#C9A96E}
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:2000,
          background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)',
          border:`1px solid ${toast.ok ? '#34d399' : '#f87171'}`,
          color: toast.ok ? '#34d399' : '#f87171',
          borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:600,
          boxShadow:'0 8px 24px rgba(0,0,0,.4)', pointerEvents:'none',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:22 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#C9A96E' }} />
            <div style={{ fontSize:11, fontWeight:700, color:'#C9A96E', letterSpacing:2 }}>ZEIIA CRM</div>
          </div>
          <div style={{ fontSize:22, fontWeight:800 }}>Leads Dashboard</div>
          <div style={{ width:36, height:2, background:'#C9A96E', borderRadius:2, margin:'5px 0' }} />
          <div style={{ fontSize:12, color:'#94a3b8' }}>{lastUpdate}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => setShowCreate(true)} style={{ ...btnPrim, height:36, padding:'0 14px', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <IconAdd /> ليد جديد
          </button>
          <button onClick={loadLeads}            style={{ ...btnSec, height:36, padding:'0 12px', fontSize:13 }}>تحديث</button>
          <button onClick={exportCSV}            style={{ ...btnSec, height:36, padding:'0 12px', fontSize:13 }}>CSV</button>
          <button onClick={exportExcel}          style={{ ...btnSec, height:36, padding:'0 12px', fontSize:13 }}>Excel</button>
          <button onClick={() => setShowImport(true)} style={{ ...btnSec, height:36, padding:'0 12px', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <IconUpload /> استيراد
       
          <button
  onClick={() => navigate('/dashboard/users')}
  title="إدارة المستخدمين"
  style={{
    height:36, width:36, borderRadius:8, border:'1px solid #334155',
    background:'rgba(167,139,250,.08)', color:'#a78bfa', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  }}
  onMouseEnter={e => { e.currentTarget.style.background='rgba(167,139,250,.2)'; e.currentTarget.style.borderColor='#a78bfa' }}
  onMouseLeave={e => { e.currentTarget.style.background='rgba(167,139,250,.08)'; e.currentTarget.style.borderColor='#334155' }}
>
  <IconUser />
  
</button>
          </button>
          <button onClick={handleLogout} title="تسجيل الخروج"
            style={{ height:36, width:36, borderRadius:8, border:'1px solid #334155', background:'rgba(248,113,113,.08)', color:'#f87171', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,.2)'; e.currentTarget.style.borderColor='#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,.08)'; e.currentTarget.style.borderColor='#334155' }}
          ><IconLogout /></button>
        
        </div>

      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))', gap:10, marginBottom:20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, right:0, width:3, height:'100%', background:'#C9A96E' }} />
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, fontWeight:500 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800 }}>{s.val}</div>
            <div style={{ fontSize:10, color:'#C9A96E', marginTop:3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, flexWrap:'wrap' }}>
        {viewTabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            height:36, padding:'0 16px', borderRadius:8, border:'1px solid',
            borderColor:  view === t.id ? '#C9A96E' : '#334155',
            background:   view === t.id ? 'rgba(201,169,110,.1)' : 'transparent',
            color:        view === t.id ? '#C9A96E' : '#64748b',
            cursor:'pointer', fontSize:13, fontFamily:"'Cairo',sans-serif",
            display:'flex', alignItems:'center', gap:6, transition:'all .15s',
            fontWeight: view === t.id ? 700 : 400,
          }}>
            <t.Icon /> {t.label}
          </button>
        ))}
      </div>

      {view === 'kanban'    && <KanbanBoard   onAction={handleAction} />}
      {view === 'followups' && <FollowUpsView onAction={handleAction} />}
      {view === 'archived'  && <ArchivedView  onAction={handleAction} />}

      {view === 'table' && (
        <>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            <input
              style={{ height:36, background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#fff', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none', flex:1, maxWidth:240 }}
              placeholder="ابحث بالاسم أو التليفون..." value={search} onChange={e => setSearch(e.target.value)}
            />
            <select style={{ height:36, background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#fff', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none' }}
              value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select style={{ height:36, background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#fff', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none' }}
              value={fSource} onChange={e => setFSource(e.target.value)}>
              <option value="">كل المصادر</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:14, overflow:'visible' }}>
            {!isMobile ? (
              <div className="leads-tbl" style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', borderRadius:14 }}>
                <table style={{ width:'max-content', minWidth:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#0f172a' }}>
                      {COLS.map(c => (
                        <th key={c.key} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textAlign:'right', padding:'11px 14px', borderBottom:'1px solid #334155', whiteSpace:'nowrap', minWidth:c.width }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slice.length === 0
                      ? <tr><td colSpan={COLS.length} style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>لا توجد نتائج</td></tr>
                      : slice.map(l => (
                        <tr key={l.id}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = 'rgba(201,169,110,.04)')}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.background = '')}>
                          <td style={{ fontSize:13, color:'#f1f5f9', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis' }}>
                            {l.hasComplaint && <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#f87171', marginLeft:5, verticalAlign:'middle' }} title="شكوى" />}
                            {l.fullName || 'unknown'}
                          </td>
{/* Mobile card fields */}
<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
  {/* التليفون — منفصل عشان فيه أيقونة */}
  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, letterSpacing:.5 }}>التليفون</div>
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:12, color:'#f1f5f9' }}>{l.phone || 'unknown'}</span>
      {l.phone && (
        <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', color:'#25d366', textDecoration:'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.428a.5.5 0 00.609.61l5.627-1.476A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.857a9.857 9.857 0 01-5.028-1.374l-.36-.214-3.732.979.998-3.645-.235-.374A9.821 9.821 0 012.143 12C2.143 6.54 6.54 2.143 12 2.143c5.46 0 9.857 4.397 9.857 9.857 0 5.46-4.397 9.857-9.857 9.857z"/>
          </svg>
        </a>
      )}
    </div>
  </div>
  {/* باقي الفيلدز */}
  {[
    { label:'المصدر',  val: l.source || 'unknown' },
    { label:'مسند لـ', val: l.assignedTo || 'غير مسند' },
    { label:'التاريخ', val: fmt(l.createdAt) },
  ].map(f => (
    <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, letterSpacing:.5 }}>{f.label}</div>
      <div style={{ fontSize:12, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.val}</div>
    </div>
  ))}
</div>                          <td style={{ padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}><Badge status={resolveStatus(l.status)} /></td>
                          <td style={{ fontSize:13, color:'#f1f5f9', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>
                            {l.source ? <span style={{ background:'rgba(201,169,110,.08)', color:'#C9A96E', padding:'2px 8px', borderRadius:6, fontSize:11 }}>{l.source}</span> : 'unknown'}
                          </td>
                          <td style={{ fontSize:12, color:'#94a3b8', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>
                            {l.assignedTo || <span style={{ color:'#475569', fontStyle:'italic' }}>غير مسند</span>}
                          </td>
                          <td style={{ fontSize:12, color:'#94a3b8', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>{fmtI(l.lastInteractionDate, l.lastInteractionType)}</td>
                          <td style={{ fontSize:12, color:'#64748b', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.email || 'unknown'}</td>
                          <td style={{ fontSize:12, color:'#94a3b8', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>{fmt(l.createdAt)}</td>
                          <td style={{ padding:'10px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>
                            <ActionMenu lead={l} onAction={handleAction} />
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {slice.length === 0
                  ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>لا توجد نتائج</div>
                  : slice.map(l => (
                    <div key={l.id} style={{ padding:'14px 16px', borderBottom:'1px solid rgba(51,65,85,.4)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>
                          {l.hasComplaint && <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#f87171', marginLeft:5, verticalAlign:'middle' }} />}
                          {l.fullName || 'unknown'}
                        </div>
                        <Badge status={resolveStatus(l.status)} />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                        {[
                          { label:'التليفون', val: l.phone || 'unknown' },
                          { label:'المصدر',   val: l.source || 'unknown' },
                          { label:'مسند لـ',  val: l.assignedTo || 'غير مسند' },
                          { label:'التاريخ',  val: fmt(l.createdAt) },
                        ].map(f => (
                          <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                            <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, letterSpacing:.5 }}>{f.label}</div>
                            <div style={{ fontSize:12, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.val}</div>
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
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid #334155', flexWrap:'wrap', gap:8 }}>
              <div style={{ fontSize:12, color:'#94a3b8' }}>
                {filtered.length === 0 ? 'لا توجد نتائج' : `عرض ${(page-1)*PAGE_SIZE+1}--${Math.min(page*PAGE_SIZE,filtered.length)} من ${filtered.length}`}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                <button style={{ height:30, minWidth:30, padding:'0 9px', fontSize:12, borderRadius:7, border:'1px solid #334155', background:'transparent', color:'#94a3b8', cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}
                  disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const s = Math.max(1, page - 2), p = s + i
                  if (p > totalPages) return null
                  return <button key={p} onClick={() => setPage(p)}
                    style={{ height:30, minWidth:30, padding:'0 9px', fontSize:12, borderRadius:7, border:'1px solid #334155', cursor:'pointer', fontFamily:"'Cairo',sans-serif",
                      ...(p === page ? { background:'#C9A96E', color:'#0f172a', borderColor:'#C9A96E', fontWeight:700 } : { background:'transparent', color:'#94a3b8' }) }}>{p}</button>
                })}
                <button style={{ height:30, minWidth:30, padding:'0 9px', fontSize:12, borderRadius:7, border:'1px solid #334155', background:'transparent', color:'#94a3b8', cursor:'pointer', fontFamily:"'Cairo',sans-serif" }}
                  disabled={page >= totalPages || !totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      {showCreate               && <CreateLeadModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); showToast('تم إضافة الليد'); loadLeads() }} />}
      {modal?.type === 'status'  && <StatusModal    lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'assign'  && <AssignModal    lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'note'    && <NoteModal      lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'task'    && <TaskModal      lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'followup'&& <FollowUpModal  lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'edit'    && <EditModal      lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'convert' && <ConvertModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'archive' && <ArchiveModal   lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {drawer     && <DetailsDrawer lead={drawer} onClose={() => setDrawer(null)} />}
      {showImport && <ImportModal   onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); showToast('تم الاستيراد بنجاح'); loadLeads() }} />}
    </div>
  )
}