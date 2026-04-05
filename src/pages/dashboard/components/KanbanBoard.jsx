/**
 * src/pages/dashboard/components/KanbanBoard.jsx
 * الـ Kanban board كامل مع الـ drag-and-drop
 * يشمل: KanbanCard, KanbanBoard, FollowUpsView, ArchivedView
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import API_BASE_URL from '../../../config'
import { KANBAN_STATUSES, resolveStatus, fmt, authHeaders, S } from '../constants'
import { WaIcon, IconUser, IconNote, IconTask, IconCalendar, IconEye } from './icons'
import { Badge } from './ui'
import { NoteModal, LeadTaskModal, FollowUpModal, AssignModal } from './LeadModals'

// ── Kanban Action Button ─────────────────────────────────
function KanbanActionBtn({ onClick, title, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:4,
        height:26, padding:'0 8px', borderRadius:6,
        border:`1px solid ${hov ? '#475569' : '#1e3a5f'}`,
        background: hov ? 'rgba(255,255,255,.06)' : 'transparent',
        color: hov ? '#e2e8f0' : '#475569',
        cursor:'pointer', fontSize:11, fontFamily:"'Cairo',sans-serif",
        transition:'all .12s', whiteSpace:'nowrap',
      }}
    >
      {children}
      <span style={{ fontSize:11 }}>{title}</span>
    </button>
  )
}

function KanbanWaBtn({ phone }) {
  const [hov, setHov] = useState(false)
  if (!phone) return null
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g,'')}`}
      target="_blank" rel="noopener noreferrer" title="واتساب"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:4,
        height:26, padding:'0 8px', borderRadius:6,
        border:`1px solid ${hov ? 'rgba(37,211,102,.5)' : 'rgba(37,211,102,.2)'}`,
        background: hov ? 'rgba(37,211,102,.12)' : 'rgba(37,211,102,.05)',
        color:'#25d366', cursor:'pointer', fontSize:11, fontFamily:"'Cairo',sans-serif",
        transition:'all .12s', textDecoration:'none', whiteSpace:'nowrap',
      }}
    >
      <WaIcon size={11} />
      <span style={{ fontSize:11 }}>واتساب</span>
    </a>
  )
}

// ── Kanban Card ──────────────────────────────────────────
function KanbanCard({ lead, onDragStart, onDragEnd, onAction }) {
  const [hov, setHov] = useState(false)
  const fmtShort = d => d ? new Date(d).toLocaleDateString('ar-EG', { day:'numeric', month:'short' }) : null
  const lastAct = fmtShort(lead.lastActivityAt)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:'#0d1829', border:`1px solid ${hov ? '#334155' : '#1e3a5f'}`,
        borderRadius:10, padding:'11px 13px', cursor:'grab', userSelect:'none',
        transition:'border-color .15s, box-shadow .15s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
      }}
    >
      <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {lead.name || lead.fullName}
      </div>
      {(lead.assignedUser?.fullName || lastAct) && (
        <div style={{ fontSize:11, color:'#475569', marginBottom:9, display:'flex', gap:8, alignItems:'center' }}>
          {lead.assignedUser?.fullName && (
            <span style={{ display:'flex', alignItems:'center', gap:3 }}>
              <IconUser size={10} /> {lead.assignedUser.fullName}
            </span>
          )}
          {lastAct && <span>· {lastAct}</span>}
        </div>
      )}
      <div style={{ height:'1px', background:'#1e3a5f', margin:'0 0 9px' }} />
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

// ── Kanban Board ─────────────────────────────────────────
export function KanbanBoard({ onAction }) {
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/pipeline`, { headers:authHeaders(), credentials:'include' })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      const data = await res.json()
      setPipeline(Array.isArray(data) ? data : (data?.data || []))
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const getLeads = statusId => (pipeline.find(p => p.stageId === statusId)?.leads || [])

  const handleDrop = async (toStatusId) => {
    setDragOverCol(null)
    const lead   = dragged.current
    const fromId = dragFromId.current
    if (!lead || fromId === toStatusId) return
    const toStatus = KANBAN_STATUSES.find(s => s.id === toStatusId)
    setPipeline(prev => prev.map(stage => {
      if (stage.stageId === fromId) return { ...stage, leads: stage.leads.filter(l => l.id !== lead.id), totalLeads: Math.max(0, (stage.totalLeads || 1) - 1) }
      if (stage.stageId === toStatusId) return { ...stage, leads: [...(stage.leads || []), lead], totalLeads: (stage.totalLeads || 0) + 1 }
      return stage
    }))
    showToast(`جاري نقل ${lead.name || lead.fullName} إلى ${toStatus?.label}...`)
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${lead.id}/status`, {
        method:'PUT', headers:authHeaders(), credentials:'include',
        body:JSON.stringify({ status: toStatusId }),
      })
      if (!res.ok) throw new Error(`خطأ ${res.status}`)
      showToast(`تم نقل ${lead.name || lead.fullName} إلى ${toStatus?.label}`)
    } catch(e) { showToast(e.message, false); load() }
  }

  const handleCardAction = (type, lead) => {
    if (type === 'details') { onAction('details', { id: lead.id, fullName: lead.name || lead.fullName }); return }
    setModal({ type, lead: { ...lead, fullName: lead.name || lead.fullName } })
  }

  const onModalSuccess = () => { setModal(null); showToast('تم الحفظ بنجاح') }

  if (loading) return <div style={{ color:'#C9A96E', textAlign:'center', padding:60, fontFamily:"'Cairo',sans-serif" }}>جاري تحميل البيب لاين...</div>
  if (error)   return <div style={{ color:'#f87171', textAlign:'center', padding:40,  fontFamily:"'Cairo',sans-serif" }}>{error}</div>

  return (
    <>
      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:2000,
          background: toast.ok ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)',
          border:`1px solid ${toast.ok ? '#34d399' : '#f87171'}`,
          color: toast.ok ? '#34d399' : '#f87171',
          borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:600,
          boxShadow:'0 8px 24px rgba(0,0,0,.35)', pointerEvents:'none', fontFamily:"'Cairo',sans-serif",
        }}>{toast.msg}</div>
      )}

      <style>{`
        .kb-sc::-webkit-scrollbar{height:6px} .kb-sc::-webkit-scrollbar-track{background:#0f172a}
        .kb-sc::-webkit-scrollbar-thumb{background:#334155;border-radius:3px} .kb-sc::-webkit-scrollbar-thumb:hover{background:#C9A96E}
        .kb-col::-webkit-scrollbar{display:none} .kb-col{scrollbar-width:none;-ms-overflow-style:none}
      `}</style>

      <div className="kb-sc" style={{ overflowX:'auto', paddingBottom:12 }}>
        <div style={{ display:'flex', gap:10, minWidth:'max-content', padding:'4px 2px 12px', alignItems:'flex-start' }}>
          {KANBAN_STATUSES.map(s => {
            const leads = getLeads(s.id)
            const isOver = dragOverCol === s.id
            return (
              <div key={s.id} style={{ width:225, flexShrink:0, display:'flex', flexDirection:'column', borderRadius:12, background:'#1e293b', border:'1px solid #334155' }}>
                <div style={{ padding:'10px 13px 9px', borderBottom:'1px solid #334155', borderTop:`3px solid ${s.color}`, background:'rgba(15,23,42,.5)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:10, background:s.bg, color:s.color }}>{leads.length}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#e2e8f0' }}>{s.label}</span>
                  </div>
                </div>
                <div
                  className="kb-col"
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect='move'; setDragOverCol(s.id) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null) }}
                  onDrop={() => handleDrop(s.id)}
                  style={{
                    flex:1, padding:8, display:'flex', flexDirection:'column', gap:7, minHeight:80,
                    background: isOver ? 'rgba(201,169,110,.05)' : 'transparent',
                    border: isOver ? '1.5px dashed rgba(201,169,110,.35)' : '1.5px solid transparent',
                    borderRadius: isOver ? 8 : 0, transition:'background .12s, border .12s',
                  }}
                >
                  {leads.length === 0
                    ? <div style={{ color:'#2d3f55', textAlign:'center', fontSize:12, padding:'18px 0', fontStyle:'italic' }}>لا يوجد</div>
                    : leads.map(l => (
                      <KanbanCard
                        key={l.id} lead={l}
                        onDragStart={() => { dragged.current = l; dragFromId.current = s.id }}
                        onDragEnd={() => { dragged.current = null; dragFromId.current = null; setDragOverCol(null) }}
                        onAction={handleCardAction}
                      />
                    ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modal?.type === 'note'     && <NoteModal      lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'task'     && <LeadTaskModal  lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'followup' && <FollowUpModal  lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
      {modal?.type === 'assign'   && <AssignModal    lead={modal.lead} onClose={() => setModal(null)} onSuccess={onModalSuccess} />}
    </>
  )
}

// ── FollowUps View ───────────────────────────────────────
export function FollowUpsView({ onAction }) {
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
        <button onClick={() => onAction('details', { id:l.id, fullName:l.fullName })} style={{ ...S.btnSec, height:28, padding:'0 10px', fontSize:11 }}>تفاصيل</button>
        <button onClick={() => onAction('note',    { id:l.id, fullName:l.fullName })} style={{ ...S.btnSec, height:28, padding:'0 10px', fontSize:11 }}>ملاحظة</button>
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
      <Section title="متابعات اليوم"  leads={today}  color="#C9A96E" empty="لا توجد متابعات اليوم" />
      <Section title="متابعات متأخرة" leads={overdue} color="#f87171" empty="لا توجد متابعات متأخرة" />
    </>
  )
}

// ── Archived View ────────────────────────────────────────
export function ArchivedView({ onAction }) {
  const [leads, setLeads]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leads/archived`, { headers:authHeaders(), credentials:'include' })
        if (res.ok) { const data = await res.json(); setLeads(Array.isArray(data) ? data : (data?.data || [])) }
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
              <button onClick={() => onAction('archive', { ...l, isArchived:true })} style={{ ...S.btnPrim, height:30, padding:'0 12px', fontSize:12 }}>استعادة</button>
            </div>
          </div>
        ))
      }
    </div>
  )
}