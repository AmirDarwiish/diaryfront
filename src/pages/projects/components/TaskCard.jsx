/**
 * src/pages/projects/components/TaskCard.jsx
 * TaskCard + KanbanColumn للمشاريع
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Trash2, Plus, Loader2, Calendar } from 'lucide-react'

const PRIORITY_CFG = {
  Low:      { label: 'منخفضة', color: '#34d399' },
  Medium:   { label: 'متوسطة', color: '#fbbf24' },
  High:     { label: 'عالية',  color: '#f87171' },
  Critical: { label: 'حرجة',   color: '#e879f9' },
}

const S = {
  card:    { background: '#0d1420', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 },
  input:   { width: '100%', boxSizing: 'border-box', height: 40, background: '#080d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e8edf5', fontSize: 13, padding: '0 12px', fontFamily: "'Cairo',sans-serif", outline: 'none', transition: 'border-color .2s' },
  select:  { width: '100%', boxSizing: 'border-box', height: 40, background: '#080d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e8edf5', fontSize: 13, padding: '0 12px', fontFamily: "'Cairo',sans-serif", outline: 'none', cursor: 'pointer', appearance: 'none' },
  lbl:     { fontSize: 11, color: '#6b7891', fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.4px' },
  btnGold: { height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#d4a855,#C9A96E)', color: '#080d16', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 7, transition: 'opacity .2s' },
  btnGhost:{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6b7891', fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 6 },
}

// ── Task Card ────────────────────────────────────────────
export function TaskCard({ task, boards, onMove, onDelete, onClick }) {
  const [menu, setMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const p = PRIORITY_CFG[task.priority]

  const handleOpenMenu = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setMenuPos({ top: spaceBelow < 200 ? rect.top - 150 : rect.bottom + 8, left: rect.left })
    setMenu(true)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      style={{ background: '#080d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', position: 'relative' }}
      whileHover={{ borderColor: 'rgba(201,169,110,0.2)' }}
    >
      {p && <div style={{ position: 'absolute', top: 10, left: 10, width: 6, height: 6, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}60` }} />}

      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5', marginBottom: 8, paddingLeft: 14 }}>{task.title}</div>

      {task.description && (
        <p style={{ fontSize: 11, color: '#6b7891', lineHeight: 1.6, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {p && <span style={{ fontSize: 10, background: `${p.color}14`, color: p.color, padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>{p.label}</span>}
          {task.dueDate && (
            <span style={{ fontSize: 10, color: '#6b7891', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('ar-EG')}
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleOpenMenu} style={{ ...S.btnGhost, height: 26, padding: '0 7px', borderRadius: 6 }}>
            <MoreHorizontal size={13} />
          </button>

          {createPortal(
            <AnimatePresence>
              {menu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={(e) => { e.stopPropagation(); setMenu(false) }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -5 }}
                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, background: '#131b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 6, minWidth: 160, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                  >
                    <div style={{ fontSize: 10, color: '#6b7891', padding: '4px 8px', fontWeight: 700 }}>نقل إلى</div>
                    {boards.filter((b) => String(b.id) !== String(task.boardColumnId ?? task.boardId ?? '')).map((b) => (
                      <button key={b.id} onClick={() => { onMove(task.id, b.id); setMenu(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, background: 'transparent', border: 'none', color: '#e8edf5', fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", textAlign: 'right' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color || '#C9A96E' }} />
                        {b.name}
                      </button>
                    ))}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                    <button onClick={() => { onDelete(task.id); setMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, background: 'transparent', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", textAlign: 'right' }}>
                      <Trash2 size={12} /> حذف التاسك
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Kanban Column ────────────────────────────────────────
export function KanbanColumn({ board, tasks, boards, projectId, onMoveTask, onDeleteTask, onAddTask, onDeleteBoard, onTaskClick, isMobile }) {
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle]     = useState('')
  const [priority, setPriority] = useState('Medium')
  const [saving, setSaving]   = useState(false)

  const colTasks = tasks.filter((t) => String(t.boardColumnId ?? t.boardId ?? '') === String(board.id))

  const handleAdd = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onAddTask({ title, priority, boardColumnId: board.id })
      setTitle(''); setPriority('Medium'); setAddOpen(false)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ ...S.card, minWidth: isMobile ? '85vw' : 280, width: isMobile ? '85vw' : 280, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: isMobile ? 'calc(100vh - 320px)' : 'calc(100vh - 280px)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: board.color || '#C9A96E', boxShadow: `0 0 8px ${board.color || '#C9A96E'}50` }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#e8edf5' }}>{board.name}</span>
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#6b7891', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{colTasks.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setAddOpen((v) => !v)} style={{ ...S.btnGhost, height: 28, padding: '0 8px' }}><Plus size={13} /></button>
          <button onClick={() => onDeleteBoard(board.id)} style={{ ...S.btnGhost, height: 28, padding: '0 8px', color: '#f8717180' }}><Trash2 size={12} /></button>
        </div>
      </div>

      {/* Quick Add */}
      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="عنوان التاسك..." value={title}
                onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} autoFocus
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.4)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
              <select style={{ ...S.select, marginBottom: 10, height: 34, fontSize: 12 }} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleAdd} disabled={saving} style={{ ...S.btnGold, height: 32, flex: 1, fontSize: 11 }}>
                  {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />} إضافة
                </button>
                <button onClick={() => setAddOpen(false)} style={{ ...S.btnGhost, height: 32 }}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks */}
      <div style={{ padding: '10px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {colTasks.length === 0
            ? <div style={{ textAlign: 'center', padding: '30px 10px', color: '#6b7891', fontSize: 12 }}>لا توجد مهام</div>
            : colTasks.map((t) => (
              <TaskCard key={t.id} task={t} boards={boards} onMove={onMoveTask} onDelete={onDeleteTask} onClick={() => onTaskClick(t.id)} />
            ))
          }
        </AnimatePresence>
      </div>
    </div>
  )
}