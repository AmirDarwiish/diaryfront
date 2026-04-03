/**
 * src/pages/dashboard/components/LeadModals.jsx
 * كل الـ modals الخاصة بالـ Leads:
 * CreateLeadModal, StatusModal, AssignModal, NoteModal,
 * TaskModal, FollowUpModal, EditModal, ConvertModal,
 * ArchiveModal, ImportModal, DetailsDrawer
 */

import { useState, useEffect, useRef } from 'react'
import API_BASE_URL from '../../../config'
import { STATUS_OPTIONS, INTERACTION_TYPES, resolveStatusId, fmt, authHeaders, S } from '../constants'
import { Modal, ErrBox } from './ui'
import { IconAdd } from './icons'

// ── Create Lead ──────────────────────────────────────────
export function CreateLeadModal({ onClose, onSuccess }) {
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
        method:'POST', headers:authHeaders(), credentials:'include', body:JSON.stringify(form),
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
          <div key={f.k}><label style={S.lbl}>{f.label}</label><input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={S.inp} /></div>
        ))}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={{ ...S.btnPrim, display:'flex', alignItems:'center', gap:6 }}>
            <IconAdd /> {loading ? '...' : 'إضافة'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Status Modal ─────────────────────────────────────────
export function StatusModal({ lead, onClose, onSuccess }) {
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
        <div><label style={S.lbl}>الحالة الجديدة</label>
          <select value={statusId} onChange={e => setStatusId(parseInt(e.target.value))} style={S.sel}>
            {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {statusId === 6 && <div><label style={S.lbl}>سبب الخسارة</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="اكتب السبب..." style={S.inp} /></div>}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnPrim}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Assign Modal ─────────────────────────────────────────
export function AssignModal({ lead, onClose, onSuccess }) {
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
          : <div><label style={S.lbl}>اختر الموظف</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} style={S.sel}>
                <option value="">-- اختر --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
        }
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={S.btnPrim}>{loading ? '...' : 'تعيين'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Note Modal ───────────────────────────────────────────
export function NoteModal({ lead, onClose, onSuccess }) {
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
    fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setUsers(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {})
  }, [])

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleNoteChange = (e) => {
    const val = e.target.value
    const cursor = e.target.selectionStart
    setNote(val)
    const textBefore = val.slice(0, cursor)
    const atIndex = textBefore.lastIndexOf('@')
    if (atIndex !== -1) {
      const query = textBefore.slice(atIndex + 1)
      if (!query.includes(' ')) { setMentionQuery(query); setMentionPos(atIndex); setShowMention(true); return }
    }
    setShowMention(false)
  }

  const selectUser = (user) => {
    const handle = user.fullName?.replace(/\s/g, '') || user.email?.split('@')[0]
    const cursor = textareaRef.current.selectionStart
    const before = note.slice(0, mentionPos)
    const after  = note.slice(cursor)
    setNote(`${before}@${handle} ${after}`)
    setShowMention(false)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const submit = async () => {
    if (!note.trim()) { setError('اكتب الملاحظة'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/notes`, {
        method:'POST', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ note, interactionType: type }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`إضافة ملاحظة: ${lead.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={S.lbl}>نوع التفاعل</label>
          <select value={type} onChange={e => setType(parseInt(e.target.value))} style={S.sel}>
            {INTERACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ position:'relative' }}>
          <label style={S.lbl}>الملاحظة</label>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={handleNoteChange}
            placeholder="اكتب ملاحظتك... استخدم @ لذكر موظف"
            rows={4}
            style={{ ...S.inp, resize:'vertical', height:'auto', padding:'10px 11px', lineHeight:1.6 }}
          />
          {showMention && filteredUsers.length > 0 && (
            <div style={{ position:'absolute', bottom:'100%', right:0, width:'100%', background:'#0d1829', border:'1px solid #1e3a5f', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.5)', zIndex:999, maxHeight:200, overflowY:'auto', marginBottom:4 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => selectUser(u)}
                  style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(30,58,95,.4)', display:'flex', flexDirection:'column', gap:2 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,169,110,.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:600 }}>{u.fullName}</span>
                  <span style={{ fontSize:11, color:'#64748b' }}>@{u.fullName?.replace(/\s/g,'')} · {u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnPrim}>{loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Lead Task Modal ──────────────────────────────────────
export function LeadTaskModal({ lead, onClose, onSuccess }) {
  const [title, setTitle]             = useState('')
  const [dueDate, setDueDate]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [users, setUsers]             = useState([])
  const [showMention, setShowMention] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPos, setMentionPos]   = useState(0)
  const inputRef = useRef()

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setUsers(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {})
  }, [])

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleTitleChange = (e) => {
    const val = e.target.value
    const cursor = e.target.selectionStart
    setTitle(val)
    const textBefore = val.slice(0, cursor)
    const atIndex = textBefore.lastIndexOf('@')
    if (atIndex !== -1) {
      const query = textBefore.slice(atIndex + 1)
      if (!query.includes(' ')) { setMentionQuery(query); setMentionPos(atIndex); setShowMention(true); return }
    }
    setShowMention(false)
  }

  const selectUser = (user) => {
    const handle = user.fullName?.replace(/\s/g, '') || user.email?.split('@')[0]
    const cursor = inputRef.current.selectionStart
    const before = title.slice(0, mentionPos)
    const after  = title.slice(cursor)
    setTitle(`${before}@${handle} ${after}`)
    setShowMention(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

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
        <div style={{ position:'relative' }}>
          <label style={S.lbl}>عنوان المهمة *</label>
          <input ref={inputRef} value={title} onChange={handleTitleChange} placeholder="اكتب المهمة... استخدم @ لذكر موظف" style={S.inp} />
          {showMention && filteredUsers.length > 0 && (
            <div style={{ position:'absolute', bottom:'100%', right:0, width:'100%', background:'#0d1829', border:'1px solid #1e3a5f', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.5)', zIndex:999, maxHeight:200, overflowY:'auto', marginBottom:4 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => selectUser(u)}
                  style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(30,58,95,.4)', display:'flex', flexDirection:'column', gap:2 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,169,110,.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:600 }}>{u.fullName}</span>
                  <span style={{ fontSize:11, color:'#64748b' }}>@{u.fullName?.replace(/\s/g,'')} · {u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={S.lbl}>تاريخ الاستحقاق (اختياري)</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...S.inp, colorScheme:'dark' }} />
        </div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnPrim}>{loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── FollowUp Modal ───────────────────────────────────────
export function FollowUpModal({ lead, onClose, onSuccess }) {
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
        <div><label style={S.lbl}>تاريخ المتابعة *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.inp, colorScheme:'dark' }} /></div>
        <div><label style={S.lbl}>السبب (اختياري)</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="سبب المتابعة..." style={S.inp} /></div>
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnPrim}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit Modal ───────────────────────────────────────────
export function EditModal({ lead, onClose, onSuccess }) {
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
        method:'PUT', headers:authHeaders(), credentials:'include', body:JSON.stringify(form),
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
          <div key={f.k}><label style={S.lbl}>{f.label}</label><input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={S.inp} /></div>
        ))}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnPrim}>{loading ? '...' : 'حفظ التعديلات'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Convert Modal ────────────────────────────────────────
export function ConvertModal({ lead, onClose, onSuccess }) {
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
        <div><label style={S.lbl}>الكورس *</label>
          {fetching
            ? <div style={{ color:'#94a3b8', padding:10 }}>جاري التحميل...</div>
            : <select value={classId} onChange={e => setClassId(e.target.value)} style={S.sel}>
                <option value="">-- اختر الكورس --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.courseName || c.name} {c.price ? `-- ${c.price} ج` : ''}</option>)}
              </select>
          }
        </div>
        {selected && (
          <div><label style={S.lbl}>المبلغ المدفوع (اختياري — max: {selected.price} ج)</label>
            <input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" max={selected.price} style={S.inp} />
          </div>
        )}
        <ErrBox msg={error} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={{ ...S.btnPrim, background:'#34d399' }}>{loading ? '...' : 'تحويل الآن'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Archive Modal ────────────────────────────────────────
export function ArchiveModal({ lead, onClose, onSuccess }) {
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
          <button onClick={onClose} style={S.btnSec}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={isArchived ? S.btnPrim : S.btnDanger}>{loading ? '...' : (isArchived ? 'استعادة' : 'أرشفة')}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Import Excel Modal ───────────────────────────────────
export function ImportModal({ onClose, onSuccess }) {
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
          الأعمدة المطلوبة: <strong>FullName - Phone - Email - Source</strong>
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#C9A96E' }}
          onDragLeave={e => { e.currentTarget.style.borderColor = file ? '#C9A96E' : '#334155' }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) setFile(f) }}
          style={{ border:`2px dashed ${file ? '#C9A96E' : '#334155'}`, borderRadius:10, padding:'28px 16px', textAlign:'center', cursor:'pointer', background: file ? 'rgba(201,169,110,.06)' : 'transparent', transition:'all .15s' }}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
          <div style={{ fontSize:13, color: file ? '#C9A96E' : '#64748b' }}>{file ? `✓ ${file.name}` : 'اضغط أو اسحب ملف Excel هنا'}</div>
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
          <button onClick={result ? onSuccess : onClose} style={S.btnSec}>{result ? 'إغلاق وتحديث' : 'إلغاء'}</button>
          {!result && <button onClick={submit} disabled={loading || !file} style={S.btnPrim}>{loading ? 'جاري الاستيراد...' : 'استيراد'}</button>}
        </div>
      </div>
    </Modal>
  )
}

// ── Details Drawer ───────────────────────────────────────
export function DetailsDrawer({ lead, onClose }) {
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
    background:   tab === id ? 'rgba(201,169,110,.15)' : 'transparent',
    color:        tab === id ? '#C9A96E' : '#64748b',
    borderBottom: tab === id ? '2px solid #C9A96E' : '2px solid transparent',
    fontWeight:   tab === id ? 700 : 400,
  })

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)', display:'flex', justifyContent:'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width:'100%', maxWidth:520, height:'100%', display:'flex', flexDirection:'column', background:'#0f172a', borderLeft:'1px solid #334155', direction:'rtl' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #334155', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:17, fontWeight:800, color:'#C9A96E' }}>تفاصيل الليد</span>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:22, cursor:'pointer' }}>×</button>
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
                  { label:'الاسم',      val: details.leadInfo?.name || details.leadInfo?.fullName },
                  { label:'التليفون',    val: details.leadInfo?.phone },
                  { label:'الإيميل',     val: details.leadInfo?.email },
                  { label:'المصدر',      val: details.leadInfo?.source },
                  { label:'مسند لـ',     val: details.leadInfo?.assignedUser?.fullName || details.leadInfo?.assignedTo },
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
                      <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:600 }}>{h.fromStage ? `${h.fromStage} → ` : ''}{h.toStage}</span>
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