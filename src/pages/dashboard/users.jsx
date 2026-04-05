import { useState, useEffect, useCallback } from "react"
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../config'
import DashboardLayout from './DashboardLayout'
import '../../styles/dashboard.css'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

/* ═══════════════════════════════
   PERMISSION TRANSLATIONS
═══════════════════════════════ */
const PERM_NAMES = {
  // Assessments
  ASSESSMENTS_ANSWERS_CREATE:       'إضافة إجابات',
  ASSESSMENTS_ANSWERS_EDIT:         'تعديل إجابات',
  ASSESSMENTS_ATTEMPTS_VIEW:        'عرض المحاولات',
  ASSESSMENTS_QUESTIONS_CREATE:     'إضافة أسئلة',
  ASSESSMENTS_QUESTIONS_EDIT:       'تعديل أسئلة',
  ASSESSMENTS_RESULT_RANGES_CREATE: 'إضافة نطاقات النتائج',
  ASSESSMENTS_RESULT_RANGES_EDIT:   'تعديل نطاقات النتائج',
  ASSESSMENTS_RESULT_RANGES_VIEW:   'عرض نطاقات النتائج',
  ASSESSMENTS_TESTS_CREATE:         'إضافة اختبارات',
  ASSESSMENTS_TESTS_EDIT:           'تعديل اختبارات',
  ASSESSMENTS_TESTS_MANAGE:         'إدارة الاختبارات',
  // Categories
  'Categories.Create': 'إضافة تصنيف',
  'Categories.Delete': 'حذف تصنيف',
  'Categories.Edit':   'تعديل تصنيف',
  'Categories.View':   'عرض التصنيفات',
  // Classes
  CLASSES_CHANGE_STATUS: 'تغيير حالة الفصل',
  CLASSES_CREATE:        'إضافة فصل',
  CLASSES_DELETE:        'حذف فصل',
  CLASSES_EDIT:          'تعديل فصل',
  CLASSES_VIEW:          'عرض الفصول',
  // Courses
  COURSES_CREATE: 'إضافة كورس',
  COURSES_DELETE: 'حذف كورس',
  COURSES_EDIT:   'تعديل كورس',
  COURSES_VIEW:   'عرض الكورسات',
  // Customers
  CUSTOMERS_CREATE: 'إضافة عميل',
  CUSTOMERS_DELETE: 'حذف عميل',
  CUSTOMERS_EDIT:   'تعديل عميل',
  CUSTOMERS_VIEW:   'عرض العملاء',
  // Enrollments
  ENROLLMENTS_CANCEL:        'إلغاء تسجيل',
  ENROLLMENTS_CHANGE_STATUS: 'تغيير حالة التسجيل',
  ENROLLMENTS_COMPLETE:      'إكمال تسجيل',
  ENROLLMENTS_CREATE:        'إضافة تسجيل',
  ENROLLMENTS_DELETE:        'حذف تسجيل',
  ENROLLMENTS_EDIT:          'تعديل تسجيل',
  ENROLLMENTS_VIEW:          'عرض التسجيلات',
  // General
  View_Notes: 'عرض الملاحظات',
  // Leads
  LEADS_ASSIGN:        'تعيين ليد',
  LEADS_CONVERT:       'تحويل ليد لعميل',
  LEADS_CREATE:        'إضافة ليد',
  LEADS_DELETE:        'حذف ليد',
  LEADS_EDIT:          'تعديل ليد',
  LEADS_EXPORT:        'تصدير الليدز',
  LEADS_IMPORT:        'استيراد الليدز',
  LEADS_NOTES_CREATE:  'إضافة ملاحظات الليد',
  LEADS_NOTES_DELETE:  'حذف ملاحظات الليد',
  LEADS_NOTES_EDIT:    'تعديل ملاحظات الليد',
  LEADS_TASKS_CREATE:  'إضافة مهام الليد',
  LEADS_VIEW:          'عرض ليداتك',
  LEADS_VIEW_ALL:      'عرض كل الليدز',
  // Payments
  PAYMENTS_CREATE: 'إضافة دفعة',
  PAYMENTS_VIEW:   'عرض المدفوعات',
  // Permissions
  PERMISSIONS_VIEW: 'عرض الصلاحيات',
  // Roles
  ROLES_CREATE:             'إضافة دور',
  ROLES_EDIT:               'تعديل دور',
  ROLES_PERMISSIONS_ASSIGN: 'إسناد صلاحيات للدور',
  ROLES_PERMISSIONS_REMOVE: 'إزالة صلاحيات من الدور',
  ROLES_PERMISSIONS_VIEW:   'عرض صلاحيات الدور',
  ROLES_VIEW:               'عرض الأدوار',
  // Students
  STUDENTS_CREATE: 'إضافة طالب',
  STUDENTS_DELETE: 'حذف طالب',
  STUDENTS_EDIT:   'تعديل طالب',
  STUDENTS_VIEW:   'عرض الطلاب',
  // Users
  USERS_CHANGE_ROLE:     'تغيير دور المستخدم',
  USERS_CHANGE_STATUS:   'تغيير حالة المستخدم',
  USERS_CREATE:          'إضافة مستخدم',
  USERS_EDIT:            'تعديل مستخدم',
  USERS_RESET_PASSWORD:  'إعادة تعيين كلمة المرور',
  USERS_VIEW:            'عرض المستخدمين',
}

const MODULE_NAMES = {
  ASSESSMENTS: 'الاختبارات',
  Categories:  'التصنيفات',
  CLASSES:     'الفصول',
  COURSES:     'الكورسات',
  CUSTOMERS:   'العملاء',
  ENROLLMENTS: 'التسجيلات',
  General:     'عام',
  LEADS:       'الليدز',
  PAYMENTS:    'المدفوعات',
  PERMISSIONS: 'الصلاحيات',
  ROLES:       'الأدوار',
  STUDENTS:    'الطلاب',
  USERS:       'المستخدمون',
}

const permName   = code => PERM_NAMES[code]   || code
const moduleName = mod  => MODULE_NAMES[mod]   || mod

/* ═══════════════════════════════
   STYLES
═══════════════════════════════ */
const S = {
  wrap:     { background:'var(--bg-base)', minHeight:'100vh', padding:'20px 16px', direction:'rtl', color:'var(--text)', fontFamily:"'Cairo',sans-serif", boxSizing:'border-box' },
  card:     { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' },
  row:      { padding:'11px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap', transition:'background .12s' },
  lbl:      { fontSize:11, color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:5 },
  inp:      { width:'100%', boxSizing:'border-box', height:38, background:'var(--bg-base)', border:'1px solid var(--border-md)', borderRadius:8, color:'var(--text)', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none' },
  sel:      { width:'100%', boxSizing:'border-box', height:38, background:'var(--bg-base)', border:'1px solid var(--border-md)', borderRadius:8, color:'var(--text)', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none', cursor:'pointer' },
  btnGold:  { height:36, padding:'0 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#d4a855,var(--gold))', color:'#080d16', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo',sans-serif", whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:6 },
  btnGhost: { height:32, padding:'0 12px', borderRadius:7, border:'1px solid var(--border-md)', background:'transparent', color:'var(--text-muted)', fontSize:12, cursor:'pointer', fontFamily:"'Cairo',sans-serif", whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:6 },
  btnBack:  { height:34, padding:'0 12px', borderRadius:8, border:'1px solid var(--border-md)', background:'transparent', color:'var(--text-muted)', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif", display:'flex', alignItems:'center', gap:6 },
  tag:      (color='var(--gold)') => ({ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:700, background:`${color}22`, color, whiteSpace:'nowrap' }),
  err:      { color:'var(--red)', fontSize:12, padding:'7px 10px', background:'var(--red-bg)', borderRadius:7 },
}

/* ═══════════════════════════════
   MODAL
═══════════════════════════════ */
function Modal({ title, onClose, children, maxWidth=480 }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}
    >
      <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:16, width:'100%', maxWidth, padding:24, direction:'rtl', boxShadow:'0 25px 60px rgba(0,0,0,.6)', margin:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:800, color:'#C9A96E' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', fontSize:22, cursor:'pointer', lineHeight:1, padding:4 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════
   TOAST
═══════════════════════════════ */
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:2000,
      background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)',
      border:`1px solid ${toast.ok ? '#34d399' : '#f87171'}`,
      color: toast.ok ? '#34d399' : '#f87171',
      borderRadius:10, padding:'10px 24px', fontSize:14, fontWeight:600,
      boxShadow:'0 8px 24px rgba(0,0,0,.4)', pointerEvents:'none', whiteSpace:'nowrap',
    }}>{toast.msg}</div>
  )
}

/* ═══════════════════════════════
   PERMISSION CHECKBOXES
═══════════════════════════════ */
function PermissionCheckboxes({ all, selected, onChange }) {
  const grouped = all.reduce((acc, p) => {
    const m = p.module || 'General'
    if (!acc[m]) acc[m] = []
    acc[m].push(p)
    return acc
  }, {})

  const toggle = code => {
    if (selected.includes(code)) onChange(selected.filter(c => c !== code))
    else onChange([...selected, code])
  }

  const toggleModule = perms => {
    const codes = perms.map(p => p.code)
    const allOn = codes.every(c => selected.includes(c))
    if (allOn) onChange(selected.filter(c => !codes.includes(c)))
    else onChange([...new Set([...selected, ...codes])])
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {Object.entries(grouped).map(([module, perms]) => {
        const allOn = perms.every(p => selected.includes(p.code))
        const someOn = perms.some(p => selected.includes(p.code))
        return (
          <div key={module} style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:10, overflow:'hidden' }}>
            {/* Module Header */}
            <div
              onClick={() => toggleModule(perms)}
              style={{ padding:'9px 14px', borderBottom:'1px solid #334155', display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}
            >
              <input
                type="checkbox"
                checked={allOn}
                ref={el => { if (el) el.indeterminate = someOn && !allOn }}
                onChange={() => toggleModule(perms)}
                onClick={e => e.stopPropagation()}
                style={{ accentColor:'#C9A96E', width:15, height:15, flexShrink:0 }}
              />
              <span style={{ fontSize:12, fontWeight:800, color:'#C9A96E' }}>{moduleName(module)}</span>
              <span style={{ fontSize:11, color:'#475569', marginRight:'auto' }}>
                {perms.filter(p => selected.includes(p.code)).length}/{perms.length}
              </span>
            </div>
            {/* Permissions Grid */}
            <div style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'8px 12px' }}>
              {perms.map(p => {
                const isOn = selected.includes(p.code)
                return (
                  <label
                    key={p.code}
                    style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', padding:'5px 8px', borderRadius:6, background: isOn ? 'rgba(201,169,110,.07)' : 'transparent', transition:'background .1s' }}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(p.code)}
                      style={{ accentColor:'#C9A96E', width:13, height:13, flexShrink:0 }}
                    />
                    <span style={{ fontSize:12, color: isOn ? '#f1f5f9' : '#64748b', lineHeight:1.3 }}>
                      {permName(p.code)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════
   USERS TAB
═══════════════════════════════ */
function UsersTab({ showToast }) {
  const [users, setUsers]       = useState([])
  const [roles, setRoles]       = useState([])
  const navigate = useNavigate()  
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ur, rr] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/roles`, { headers: authHeaders() }),
      ])
      if (ur.ok) { const d = await ur.json(); setUsers(Array.isArray(d) ? d : d?.data || []) }
      if (rr.ok) { const d = await rr.json(); setRoles(Array.isArray(d) ? d : d?.data || []) }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u =>
    !search ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <input
          style={{ ...S.inp, flex:1, minWidth:180, maxWidth:300 }}
          placeholder="بحث بالاسم أو الإيميل..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
            <button style={{ ...S.btnGhost, display:'flex', alignItems:'center', gap:6 }} onClick={() => navigate('/dashboard/reports/activity')}>
     تقارير النشاط
  </button>
        <button style={S.btnGold} onClick={() => { setSelected(null); setModal('create') }}>+ مستخدم جديد</button>
     

      </div>
      <div style={S.card}>
        {loading
          ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>جاري التحميل...</div>
          : filtered.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#475569' }}>لا توجد نتائج</div>
            : filtered.map(u => (
              <div key={u.id} style={{ ...S.row }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(201,169,110,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#C9A96E', fontWeight:800, fontSize:14, flexShrink:0 }}>
                    {(u.fullName || '?')[0]}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.fullName}</div>
                    <div style={{ fontSize:11, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', flexShrink:0 }}>
                  {u.roles?.map(r => <span key={r} style={S.tag('#a78bfa')}>{r}</span>)}
                  <span style={S.tag(u.isActive ? '#34d399' : '#f87171')}>{u.isActive ? 'نشط' : 'غير نشط'}</span>
                  <button style={S.btnGhost} onClick={() => { setSelected(u); setModal('edit') }}>تعديل</button>
                  <button style={S.btnGhost} onClick={() => { setSelected(u); setModal('resetpw') }}>كلمة المرور</button>
                </div>
              </div>
            ))
        }
      </div>

      {modal === 'create' && <CreateUserModal roles={roles} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showToast('تم إضافة المستخدم'); load() }} />}
      {modal === 'edit'   && <EditUserModal   user={selected} roles={roles} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showToast('تم الحفظ'); load() }} />}
      {modal === 'resetpw'&& <ResetPwModal    user={selected} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showToast('تم تغيير كلمة المرور') }} />}
    </div>
  )
}

function CreateUserModal({ roles, onClose, onSuccess }) {
  const [form, setForm]       = useState({ fullName:'', email:'', password:'', roleId:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.fullName.trim()) { setError('الاسم مطلوب'); return }
    if (!form.email.trim())    { setError('الإيميل مطلوب'); return }
    if (!form.password.trim()) { setError('كلمة المرور مطلوبة'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...form, roleId: form.roleId ? parseInt(form.roleId) : undefined }),
      })
      if (!res.ok) { const j = await res.json().catch(() => {}); throw new Error(j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="إضافة مستخدم جديد" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        {[
          { k:'fullName', label:'الاسم الكامل *', ph:'الاسم...', type:'text' },
          { k:'email',    label:'الإيميل *',       ph:'user@mail.com', type:'text' },
          { k:'password', label:'كلمة المرور *',   ph:'••••••••', type:'password' },
        ].map(f => (
          <div key={f.k}>
            <label style={S.lbl}>{f.label}</label>
            <input type={f.type} value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={S.inp} />
          </div>
        ))}
        <div>
          <label style={S.lbl}>الدور</label>
          <select value={form.roleId} onChange={e => set('roleId', e.target.value)} style={S.sel}>
            <option value="">-- بدون دور --</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {error && <div style={S.err}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnGold}>{loading ? '...' : 'إضافة'}</button>
        </div>
      </div>
    </Modal>
  )
}

function EditUserModal({ user, roles, onClose, onSuccess }) {
  const [form, setForm]       = useState({ fullName: user?.fullName || '', email: user?.email || '', isActive: user?.isActive ?? true })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ fullName: form.fullName, email: form.email, isActive: form.isActive }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تعديل: ${user?.fullName}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div><label style={S.lbl}>الاسم الكامل</label><input value={form.fullName} onChange={e => set('fullName', e.target.value)} style={S.inp} /></div>
        <div><label style={S.lbl}>الإيميل</label><input value={form.email} onChange={e => set('email', e.target.value)} style={S.inp} /></div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor:'#C9A96E', width:16, height:16 }} />
          <label htmlFor="isActive" style={{ fontSize:13, color:'#94a3b8', cursor:'pointer' }}>الحساب نشط</label>
        </div>
        {error && <div style={S.err}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnGold}>{loading ? '...' : 'حفظ'}</button>
        </div>
      </div>
    </Modal>
  )
}

function ResetPwModal({ user, onClose, onSuccess }) {
  const [pw, setPw]           = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const submit = async () => {
    if (!pw.trim()) { setError('ادخل كلمة المرور'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/reset-password`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ newPassword: pw }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تغيير كلمة المرور: ${user?.fullName}`} onClose={onClose} maxWidth={380}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div>
          <label style={S.lbl}>كلمة المرور الجديدة</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={S.inp} />
        </div>
        {error && <div style={S.err}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnGold}>{loading ? '...' : 'تغيير'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════
   ROLES TAB
═══════════════════════════════ */
function RolesTab({ showToast }) {
  const [roles, setRoles]       = useState([])
  const [allPerms, setAllPerms] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rr, pr] = await Promise.all([
        fetch(`${API_BASE_URL}/api/roles`,       { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/permissions`, { headers: authHeaders() }),
      ])
      if (rr.ok) { const d = await rr.json(); setRoles(Array.isArray(d) ? d : d?.data || []) }
      if (pr.ok) { const d = await pr.json(); setAllPerms(Array.isArray(d) ? d : d?.data || []) }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button style={S.btnGold} onClick={() => { setSelected(null); setModal('create') }}>+ دور جديد</button>
      </div>
      <div style={S.card}>
        {loading
          ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>جاري التحميل...</div>
          : roles.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#475569' }}>لا توجد أدوار</div>
            : roles.map(r => (
              <div key={r.id} style={{ ...S.row }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#C9A96E', flexShrink:0 }} />
                  <span style={{ fontSize:14, fontWeight:700, color:'#f1f5f9' }}>{r.name}</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button style={S.btnGhost} onClick={() => { setSelected(r); setModal('edit') }}>تعديل الصلاحيات</button>
                </div>
              </div>
            ))
        }
      </div>

      {modal === 'create' && <CreateRoleModal allPerms={allPerms} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showToast('تم إنشاء الدور'); load() }} />}
      {modal === 'edit'   && <EditRoleModal   role={selected} allPerms={allPerms} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showToast('تم الحفظ'); load() }} />}
    </div>
  )
}

function CreateRoleModal({ allPerms, onClose, onSuccess }) {
  const [name, setName]         = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const submit = async () => {
    if (!name.trim()) { setError('اسم الدور مطلوب'); return }
    setLoading(true); setError('')
    try {
      const r1 = await fetch(`${API_BASE_URL}/api/roles`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: name.trim() }),
      })
      if (!r1.ok) { const j = await r1.json().catch(() => {}); throw new Error(j?.message || `خطأ ${r1.status}`) }
      const created = await r1.json()
      if (selected.length > 0 && created.roleId) {
        await fetch(`${API_BASE_URL}/api/roles/${created.roleId}`, {
          method: 'PUT', headers: authHeaders(),
          body: JSON.stringify({ roleName: name.trim(), permissionCodes: selected }),
        })
      }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="إنشاء دور جديد" onClose={onClose} maxWidth={600}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={S.lbl}>اسم الدور *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مدير المبيعات" style={S.inp} />
        </div>
        <div>
          <label style={{ ...S.lbl, marginBottom:10 }}>الصلاحيات ({selected.length} محددة)</label>
          <div style={{ maxHeight:380, overflowY:'auto', paddingLeft:2, paddingRight:2 }}>
            <PermissionCheckboxes all={allPerms} selected={selected} onChange={setSelected} />
          </div>
        </div>
        {error && <div style={S.err}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>إلغاء</button>
          <button onClick={submit} disabled={loading} style={S.btnGold}>{loading ? '...' : 'إنشاء'}</button>
        </div>
      </div>
    </Modal>
  )
}

function EditRoleModal({ role, allPerms, onClose, onSuccess }) {
  const [name, setName]         = useState(role?.name || '')
  const [selected, setSelected] = useState([])
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/roles/${role.id}/permissions`, { headers: authHeaders() })
        if (r.ok) { const d = await r.json(); setSelected((d.permissions || []).map(p => p.code)) }
      } catch {}
      setFetching(false)
    })()
  }, [role.id])

  const submit = async () => {
    if (!name.trim()) { setError('الاسم مطلوب'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/roles/${role.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ roleName: name.trim(), permissionCodes: selected }),
      })
      if (!res.ok) { const j = await res.json().catch(() => {}); throw new Error(j?.message || `خطأ ${res.status}`) }
      onSuccess()
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`تعديل الدور: ${role?.name}`} onClose={onClose} maxWidth={620}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={S.lbl}>اسم الدور *</label>
          <input value={name} onChange={e => setName(e.target.value)} style={S.inp} />
        </div>

        {/* Summary bar */}
        <div style={{ background:'rgba(201,169,110,.06)', border:'1px solid rgba(201,169,110,.2)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'#C9A96E', display:'flex', justifyContent:'space-between' }}>
          <span>الصلاحيات المحددة</span>
          <span style={{ fontWeight:800 }}>{selected.length} من {allPerms.length}</span>
        </div>

        <div>
          {fetching
            ? <div style={{ color:'#94a3b8', padding:24, textAlign:'center' }}>جاري التحميل...</div>
            : (
              <div style={{ maxHeight:420, overflowY:'auto', paddingLeft:2, paddingRight:2 }}>
                <style>{`
                  .perm-scroll::-webkit-scrollbar { width: 5px }
                  .perm-scroll::-webkit-scrollbar-track { background: #0f172a }
                  .perm-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px }
                  .perm-scroll::-webkit-scrollbar-thumb:hover { background: #C9A96E }
                `}</style>
                <div className="perm-scroll" style={{ maxHeight:420, overflowY:'auto' }}>
                  <PermissionCheckboxes all={allPerms} selected={selected} onChange={setSelected} />
                </div>
              </div>
            )
          }
        </div>

        {error && <div style={S.err}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>إلغاء</button>
          <button onClick={submit} disabled={loading || fetching} style={S.btnGold}>{loading ? '...' : 'حفظ التعديلات'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════
   MAIN PAGE
═══════════════════════════════ */
export default function UsersRolesPage() {
  const navigate  = useNavigate()
  const [tab, setTab]     = useState('users')
  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const tabs = [
    { id:'users', label:'المستخدمون' },
    { id:'roles', label:'الأدوار والصلاحيات' },
  ]

  return (
    <DashboardLayout title="إدارة المستخدمين والأدوار" breadcrumb="الإدارة">
      <div style={{ ...S.wrap, padding:0 }}>
        <Toast toast={toast} />

        <div style={{ padding:'0 24px 24px', direction:'rtl' }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:1, overflowX:'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                height:38, padding:'0 20px', border:'none', cursor:'pointer', whiteSpace:'nowrap',
                background:'transparent', fontFamily:"'Cairo',sans-serif", fontSize:14,
                color:        tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight:   tab === t.id ? 800 : 400,
                borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                marginBottom: -1, transition:'all .15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Content */}
          {tab === 'users' && <UsersTab showToast={showToast} />}
          {tab === 'roles' && <RolesTab showToast={showToast} />}
        </div>
      </div>
    </DashboardLayout>
  )
}