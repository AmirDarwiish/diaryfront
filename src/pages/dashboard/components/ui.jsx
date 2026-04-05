/**
 * src/pages/dashboard/components/ui.jsx
 * المكونات المشتركة: Modal, Badge, ErrBox, ActionMenu, shared hooks
 */

import { useState, useEffect, useRef } from 'react'
import { BADGES, STATUS_OPTIONS, resolveStatus, resolveStatusId, S } from '../constants'
import {
  IconRefresh, IconUser, IconNote, IconCalendar,
  IconEye, IconEdit, IconArchive, IconConvert, IconTask, IconChevron,
} from './icons'

// ── Hook: is mobile ──────────────────────────────────────
export function useIsMobile() {
  const [mob, setMob] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fn = () => setMob(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mob
}

// ── ErrBox ───────────────────────────────────────────────
export const ErrBox = ({ msg }) => msg
  ? <div style={{ color:'#f87171', fontSize:12, background:'rgba(248,113,113,.08)', padding:'8px 10px', borderRadius:7 }}>{msg}</div>
  : null

// ── Badge ────────────────────────────────────────────────
export function Badge({ status }) {
  const b = BADGES[status] || { bg:'rgba(148,163,184,.13)', color:'#94a3b8', label: status || 'unknown' }
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:b.bg, color:b.color }}>
      {b.label}
    </span>
  )
}

// ── Modal ────────────────────────────────────────────────
export function Modal({ title, onClose, children, maxWidth = 420 }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:16, width:'100%', maxWidth, padding:24, direction:'rtl', boxShadow:'0 25px 60px rgba(0,0,0,.5)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div style={{
      position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:2000,
      background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)',
      border:`1px solid ${toast.ok ? '#34d399' : '#f87171'}`,
      color: toast.ok ? '#34d399' : '#f87171',
      borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:600,
      boxShadow:'0 8px 24px rgba(0,0,0,.4)', pointerEvents:'none', fontFamily:"'Cairo',sans-serif",
    }}>{toast.msg}</div>
  )
}

// ── ActionMenu ───────────────────────────────────────────
export function ActionMenu({ lead, onAction }) {
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