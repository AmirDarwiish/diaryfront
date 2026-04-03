/**
 * src/pages/dashboard/index.jsx
 * الـ root component للـ Leads Dashboard
 * ~300 سطر — فقط الـ state والـ data fetching والـ layout الرئيسي
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../config'
import '../../styles/dashboard.css'

import { PAGE_SIZE, BADGES, STATUS_LIST, resolveStatus, fmt, fmtI, authHeaders, S } from './constants'
import { WaIcon, IconAdd, IconKanban, IconList, IconCalendar, IconArchive, IconLogout, IconUser, IconUpload, IconRefresh } from './components/icons'
import { useIsMobile, Badge, ActionMenu, Toast } from './components/ui'
import { KanbanBoard, FollowUpsView, ArchivedView } from './components/KanbanBoard'
import {
  CreateLeadModal, StatusModal, AssignModal, NoteModal,
  LeadTaskModal, FollowUpModal, EditModal, ConvertModal,
  ArchiveModal, ImportModal, DetailsDrawer,
} from './components/LeadModals'
import NotificationBell from './NotificationBell'

// ── WA Button (table) ────────────────────────────────────
const WaBtn = ({ phone }) => phone ? (
  <a href={`https://wa.me/${phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" title="واتساب"
    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:6, background:'rgba(37,211,102,.12)', flexShrink:0, textDecoration:'none', transition:'all .15s' }}
    onMouseEnter={e => { e.currentTarget.style.background='rgba(37,211,102,.3)'; e.currentTarget.style.transform='scale(1.12)' }}
    onMouseLeave={e => { e.currentTarget.style.background='rgba(37,211,102,.12)'; e.currentTarget.style.transform='scale(1)' }}
  ><WaIcon size={12} /></a>
) : null

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

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════ */
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

  // ── Logout ───────────────────────────────────────────
  const handleLogout = async () => {
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { method:'POST', headers:authHeaders(), credentials:'include' }) } catch {}
    localStorage.removeItem('token')
    navigate('/dashboard/login')
  }

  // ── Load Leads ───────────────────────────────────────
  const loadLeads = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setError('غير مسجل الدخول'); setLoading(false); return }
    try {
      let pg = 1, size = 100, total = Infinity, acc = []
      while (acc.length < total) {
        const res = await fetch(`${API_BASE_URL}/api/leads?pageNumber=${pg}&pageSize=${size}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
        if (!res.ok) throw new Error(res.status)
        const json  = await res.json()
        const d     = json?.data || json
        const items = d?.data || d || []
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
      if (res.ok) { const d = await res.json(); setTodayCount(Array.isArray(d) ? d.length : (d?.data?.length || 0)) }
    } catch {}
  }, [])

  useEffect(() => { loadLeads(); loadTodayCount() }, [loadLeads, loadTodayCount])

  // ── Filters ──────────────────────────────────────────
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

  // ── Export CSV ───────────────────────────────────────
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
      a.href = URL.createObjectURL(blob)
      a.download = `leads_${new Date().toLocaleDateString('ar-EG').replace(/\//g,'-')}.xlsx`
      a.click(); URL.revokeObjectURL(a.href)
    } catch(e) { showToast(e.message, false) }
  }

  // ── Stats ────────────────────────────────────────────
  const stats = [
    { label:'إجمالي الليدز', val: all.length,                                              sub:'كل السجلات' },
    { label:'جدد',           val: all.filter(l => resolveStatus(l.status) === 'New').length,        sub:'New' },
    { label:'مهتمين',        val: all.filter(l => resolveStatus(l.status) === 'Interested').length, sub:'Interested' },
    { label:'تم التحويل',    val: all.filter(l => resolveStatus(l.status) === 'Converted').length,  sub:'Converted' },
  ]

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const slice      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
      <style>{`.leads-tbl::-webkit-scrollbar{height:6px}.leads-tbl::-webkit-scrollbar-track{background:#0f172a}.leads-tbl::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}.leads-tbl::-webkit-scrollbar-thumb:hover{background:#C9A96E}`}</style>
      <Toast toast={toast} />

      {/* ── Header ── */}
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
          <button onClick={() => setShowCreate(true)} style={{ ...S.btnPrim, height:36, padding:'0 14px', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <IconAdd /> ليد جديد
          </button>
          <button onClick={() => navigate('/dashboard/projects')} style={{ ...S.btnSec, height:36, padding:'0 12px', fontSize:13, color:'#C9A96E', borderColor:'rgba(201,169,110,0.3)' }}>
            إدارة البروجكتات
          </button>
          <button onClick={loadLeads} style={{ ...S.btnSec, height:36, padding:'0 12px', fontSize:13 }}>تحديث</button>
          <button onClick={exportCSV} style={{ ...S.btnSec, height:36, padding:'0 12px', fontSize:13 }}>CSV</button>
          <button onClick={exportExcel} style={{ ...S.btnSec, height:36, padding:'0 12px', fontSize:13 }}>Excel</button>
          <button onClick={() => setShowImport(true)} style={{ ...S.btnSec, height:36, padding:'0 12px', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <IconUpload /> استيراد
          </button>
          <NotificationBell onOpenLead={(leadId) => { setDrawer({ id: leadId, fullName: '', openTab: 'notes' }); setView('table') }} />
          <button onClick={() => navigate('/dashboard/users')} title="إدارة المستخدمين"
            style={{ height:36, width:36, borderRadius:8, border:'1px solid #334155', background:'rgba(167,139,250,.08)', color:'#a78bfa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(167,139,250,.2)'; e.currentTarget.style.borderColor='#a78bfa' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(167,139,250,.08)'; e.currentTarget.style.borderColor='#334155' }}
          ><IconUser /></button>
          <button onClick={handleLogout} title="تسجيل الخروج"
            style={{ height:36, width:36, borderRadius:8, border:'1px solid #334155', background:'rgba(248,113,113,.08)', color:'#f87171', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,.2)'; e.currentTarget.style.borderColor='#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,.08)'; e.currentTarget.style.borderColor='#334155' }}
          ><IconLogout /></button>
        </div>
      </div>

      {/* ── Stats ── */}
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

      {/* ── View Tabs ── */}
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

      {/* ── Table View ── */}
      {view === 'table' && (
        <>
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
                        <th key={c.key} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textAlign:'right', padding:'11px 14px', borderBottom:'1px solid #334155', whiteSpace:'nowrap', minWidth:c.width }}>{c.label}</th>
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
                          <td style={{ fontSize:12, color:'#f1f5f9', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontFamily:'monospace', letterSpacing:.5 }}>{l.phone || 'unknown'}</span>
                              <WaBtn phone={l.phone} />
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}><Badge status={resolveStatus(l.status)} /></td>
                          <td style={{ fontSize:13, color:'#f1f5f9', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>
                            {l.source ? <span style={{ background:'rgba(201,169,110,.08)', color:'#C9A96E', padding:'2px 8px', borderRadius:6, fontSize:11 }}>{l.source}</span> : <span style={{ color:'#475569' }}>—</span>}
                          </td>
                          <td style={{ fontSize:12, color:'#94a3b8', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>{l.assignedTo || <span style={{ color:'#475569', fontStyle:'italic' }}>غير مسند</span>}</td>
                          <td style={{ fontSize:12, color:'#94a3b8', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>{fmtI(l.lastInteractionDate, l.lastInteractionType)}</td>
                          <td style={{ fontSize:12, color:'#64748b', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.email || '—'}</td>
                          <td style={{ fontSize:12, color:'#94a3b8', textAlign:'right', padding:'12px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}>{fmt(l.createdAt)}</td>
                          <td style={{ padding:'10px 14px', borderBottom:'1px solid rgba(51,65,85,.4)', whiteSpace:'nowrap' }}><ActionMenu lead={l} onAction={handleAction} /></td>
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
                        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                          <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, letterSpacing:.5 }}>التليفون</div>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ fontSize:12, color:'#f1f5f9' }}>{l.phone || '—'}</span>
                            <WaBtn phone={l.phone} />
                          </div>
                        </div>
                        {[
                          { label:'المصدر',  val: l.source    || '—' },
                          { label:'مسند لـ', val: l.assignedTo || 'غير مسند' },
                          { label:'التاريخ', val: fmt(l.createdAt) },
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
                {filtered.length === 0 ? 'لا توجد نتائج' : `عرض ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} من ${filtered.length}`}
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

      {/* ── Modals ── */}
      {showCreate                && <CreateLeadModal  onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); showToast('تم إضافة الليد'); loadLeads() }} />}
      {modal?.type === 'status'  && <StatusModal      lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'assign'  && <AssignModal      lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'note'    && <NoteModal        lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'task'    && <LeadTaskModal    lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'followup'&& <FollowUpModal    lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'edit'    && <EditModal        lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'convert' && <ConvertModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'archive' && <ArchiveModal     lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {drawer     && <DetailsDrawer lead={drawer} onClose={() => setDrawer(null)} />}
      {showImport && <ImportModal  onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); showToast('تم الاستيراد بنجاح'); loadLeads() }} />}
    </div>
  )
}