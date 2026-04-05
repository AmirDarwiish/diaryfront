/**
 * src/pages/projects/ProjectDetails.jsx
 * الـ root component فقط — ~200 سطر
 * كل الـ sub-components متقسمة في components/
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Kanban, Users, Zap, BarChart2,
  Plus, Loader2, CheckCircle2, Circle, PauseCircle,
  XCircle, TrendingUp, ChevronDown,
} from 'lucide-react'
import {
  getProject, getBoards, getTasks,
  createBoard, deleteBoard, createTask, moveTask,
  deleteTask, updateProjectStatus,
} from '../../services/projectService'

import { TaskCard, KanbanColumn } from './components/TaskCard'
import { MembersTab, SprintsTab, StatsTab } from './components/MembersSprintsTabs'
import TaskModal from './TaskModal'
import '../../styles/dashboard.css'

// ── Constants ────────────────────────────────────────────
const STATUS_CFG = {
  Planning:  { label: 'تخطيط',  color: '#6ea8fe', bg: 'rgba(110,168,254,.12)', Icon: Circle       },
  Active:    { label: 'نشط',    color: '#34d399', bg: 'rgba(52,211,153,.12)',  Icon: TrendingUp   },
  OnHold:    { label: 'متوقف',  color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  Icon: PauseCircle  },
  Done:      { label: 'مكتمل',  color: '#C9A96E', bg: 'rgba(201,169,110,.12)', Icon: CheckCircle2 },
  Cancelled: { label: 'ملغي',   color: '#f87171', bg: 'rgba(248,113,113,.12)', Icon: XCircle      },
}

const TABS = [
  { key: 'kanban',  label: 'المهام',      Icon: Kanban    },
  { key: 'members', label: 'الأعضاء',     Icon: Users     },
  { key: 'sprints', label: 'السبرينتات',  Icon: Zap       },
  { key: 'stats',   label: 'الإحصائيات',  Icon: BarChart2 },
]

const S = {
  card:    { background: '#0d1420', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 },
  input:   { width: '100%', boxSizing: 'border-box', height: 40, background: '#080d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e8edf5', fontSize: 13, padding: '0 12px', fontFamily: "'Cairo',sans-serif", outline: 'none', transition: 'border-color .2s' },
  lbl:     { fontSize: 11, color: '#6b7891', fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.4px' },
  btnGold: { height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#d4a855,#C9A96E)', color: '#080d16', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 7 },
  btnGhost:{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6b7891', fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 6 },
}

function useIsMobile(bp = 640) {
  const [mob, setMob] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < bp)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return mob
}

/* ══════════════════════════════════════════════════
   PROJECT DETAILS — ROOT
══════════════════════════════════════════════════ */
export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [project, setProject]           = useState(null)
  const [boards, setBoards]             = useState([])
  const [tasks, setTasks]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('kanban')
  const [addColOpen, setAddColOpen]     = useState(false)
  const [newColName, setNewColName]     = useState('')
  const [newColColor, setNewColColor]   = useState('#C9A96E')
  const [statusMenu, setStatusMenu]     = useState(false)
  const [openTaskId, setOpenTaskId]     = useState(null)

  // ── Load data ────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const [proj, bds, tks] = await Promise.all([getProject(id), getBoards(id), getTasks(id)])
        setProject(proj?.data || proj)
        setBoards(Array.isArray(bds) ? bds : bds?.data || [])
        setTasks(Array.isArray(tks)  ? tks : tks?.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [id])

  // ── Board handlers ───────────────────────────────────
  const handleAddBoard = async () => {
    if (!newColName.trim()) return
    try {
      const res = await createBoard(id, { name: newColName, color: newColColor })
      setBoards((b) => [...b, res?.data || res])
      setNewColName(''); setAddColOpen(false)
    } catch (e) { alert(e.message) }
  }

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('حذف الكولومن؟ يجب أن يكون فارغاً.')) return
    try { await deleteBoard(id, boardId); setBoards((b) => b.filter((x) => x.id !== boardId)) }
    catch (e) { alert(e.message) }
  }

  // ── Task handlers ────────────────────────────────────
  const handleAddTask = async (body) => {
    const res = await createTask(id, body)
    setTasks((t) => [...t, res?.data || res])
  }

  const handleMoveTask = async (taskId, boardId) => {
    try {
      await moveTask(id, taskId, boardId)
      const numId = typeof boards[0]?.id === 'number' ? Number(boardId) : boardId
      setTasks((t) => t.map((x) => x.id === taskId ? { ...x, boardColumnId: numId, boardId: numId } : x))
    } catch (e) { alert(e.message) }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('حذف التاسك؟')) return
    try { await deleteTask(id, taskId); setTasks((t) => t.filter((x) => x.id !== taskId)) }
    catch (e) { alert(e.message) }
  }

  const handleStatusChange = async (status) => {
    try { await updateProjectStatus(id, status); setProject((p) => ({ ...p, status })); setStatusMenu(false) }
    catch (e) { alert(e.message) }
  }

  // ── Loading / 404 ────────────────────────────────────
  if (loading) return (
    <div style={{ background: '#080d16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={36} color="#C9A96E" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!project) return (
    <div style={{ background: '#080d16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontFamily: "'Cairo',sans-serif" }}>
      البروجكت مش موجود
    </div>
  )

  const st           = STATUS_CFG[project.status] || STATUS_CFG.Planning
  const tasksTotal   = tasks.length
  const tasksDone    = tasks.filter((t) => t.status === 'Done').length
  const progress     = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
  const activeTabCfg = TABS.find((t) => t.key === activeTab)

  return (
    <div style={{ background: '#080d16', minHeight: '100vh', direction: 'rtl', color: '#e8edf5', fontFamily: "'Cairo',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .kanban-scroll { display: flex; gap: 16px; overflow-x: auto; padding: 16px 16px 24px; }
        @media (min-width: 640px) { .kanban-scroll { padding: 20px 28px 28px; } }
        .kanban-scroll::-webkit-scrollbar { height: 6px; }
        .kanban-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.02); border-radius: 10px; }
        .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(201,169,110,.2); border-radius: 10px; }
        .kanban-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,169,110,.5); }
        ::-webkit-calendar-picker-indicator { filter: invert(0.8); }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: #0a1018; border-top: 1px solid rgba(255,255,255,0.07); display: flex; height: 60px; padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: isMobile ? '16px 16px 0' : '24px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 12 : 18 }}>
          <button onClick={() => navigate('/dashboard/projects')} style={{ ...S.btnGhost, height: 30, fontSize: 11, padding: '0 10px' }}>
            <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />
            {!isMobile && 'البروجكتات'}
          </button>
          <span style={{ color: '#6b7891', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: '#C9A96E', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 160 : 300 }}>
            {project.name || project.title}
          </span>
        </div>

        {/* Title + controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900, color: '#e8edf5', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name || project.title}
            </h1>
            {project.description && !isMobile && <p style={{ fontSize: 12, color: '#6b7891', margin: 0, maxWidth: 500 }}>{project.description}</p>}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Progress mini */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d1420', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '6px 12px' }}>
              <div style={{ width: isMobile ? 44 : 60, height: 4, background: '#080d16', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#f0c98a,#C9A96E)', borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <span style={{ fontSize: 12, color: '#C9A96E', fontWeight: 800 }}>{progress}%</span>
              {!isMobile && <span style={{ fontSize: 11, color: '#6b7891' }}>{tasksTotal} تاسك</span>}
            </div>

            {/* Status dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setStatusMenu((v) => !v)}
                style={{ ...S.btnGhost, height: 34, background: st.bg, color: st.color, borderColor: `${st.color}30`, fontSize: isMobile ? 11 : 12, padding: isMobile ? '0 10px' : '0 12px' }}>
                <st.Icon size={13} /> {st.label} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {statusMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                    style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: '#131b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 6, minWidth: 150, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                    onMouseLeave={() => setStatusMenu(false)}
                  >
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <button key={k} onClick={() => handleStatusChange(k)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 7, background: project.status === k ? `${v.color}15` : 'transparent', border: 'none', color: project.status === k ? v.color : '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", textAlign: 'right' }}>
                        <v.Icon size={13} color={v.color} /> {v.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs — Desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: '9px 9px 0 0', border: 'none', cursor: 'pointer', background: activeTab === tab.key ? '#0d1420' : 'transparent', color: activeTab === tab.key ? '#C9A96E' : '#6b7891', fontSize: 13, fontWeight: 700, fontFamily: "'Cairo',sans-serif", borderBottom: activeTab === tab.key ? '2px solid #C9A96E' : '2px solid transparent', transition: 'all .2s' }}>
                <tab.Icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: current tab label */}
        {isMobile && activeTabCfg && (
          <div style={{ paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C9A96E', fontSize: 13, fontWeight: 800 }}>
              <activeTabCfg.Icon size={14} /> {activeTabCfg.label}
            </div>
          </div>
        )}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ paddingBottom: isMobile ? 72 : 0 }}>

          {/* KANBAN */}
          {activeTab === 'kanban' && (
            <div className="kanban-scroll">
              {boards.map((b) => (
                <KanbanColumn
                  key={b.id} board={b} tasks={tasks} boards={boards} projectId={id}
                  onMoveTask={handleMoveTask} onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask} onDeleteBoard={handleDeleteBoard}
                  onTaskClick={setOpenTaskId} isMobile={isMobile}
                />
              ))}

              {/* Add column */}
              <div style={{ minWidth: isMobile ? 220 : 260, flexShrink: 0 }}>
                {!addColOpen ? (
                  <button
                    onClick={() => setAddColOpen(true)}
                    style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 12, color: '#6b7891', fontSize: 13, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color .2s, color .2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)'; e.currentTarget.style.color = '#C9A96E' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#6b7891' }}
                  >
                    <Plus size={16} /> إضافة كولومن
                  </button>
                ) : (
                  <div style={{ ...S.card, padding: 16 }}>
                    <input style={{ ...S.input, marginBottom: 10 }} placeholder="اسم الكولومن..." value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBoard()} autoFocus
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.4)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <label style={{ ...S.lbl, margin: 0 }}>اللون:</label>
                      <input type="color" value={newColColor} onChange={(e) => setNewColColor(e.target.value)}
                        style={{ width: 36, height: 28, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }} />
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: newColColor }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={handleAddBoard} style={{ ...S.btnGold, height: 32, flex: 1, fontSize: 11 }}><Plus size={12} /> إضافة</button>
                      <button onClick={() => setAddColOpen(false)} style={{ ...S.btnGhost, height: 32 }}>إلغاء</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && <div style={{ padding: isMobile ? '16px' : '24px 28px' }}><MembersTab projectId={id} currentUserRole={project.myRole || 'Member'} /></div>}
          {activeTab === 'sprints' && <div style={{ padding: isMobile ? '16px' : '24px 28px' }}><SprintsTab projectId={id} /></div>}
          {activeTab === 'stats'   && <div style={{ padding: isMobile ? '16px' : '24px 28px' }}><StatsTab   projectId={id} /></div>}
        </motion.div>
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="bottom-nav">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#C9A96E' : '#4a5568', fontFamily: "'Cairo',sans-serif", transition: 'color .2s', position: 'relative' }}>
                {isActive && (
                  <motion.div layoutId="tab-indicator"
                    style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: '#C9A96E', borderRadius: '0 0 4px 4px' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }} />
                )}
                <tab.Icon size={18} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 600 }}>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      )}

      {/* Task Modal */}
      <AnimatePresence>
        {openTaskId && (
          <TaskModal
            taskId={openTaskId} projectId={id}
            onClose={() => setOpenTaskId(null)}
            onUpdated={(updated) => setTasks((t) => t.map((x) => x.id === updated.id ? { ...x, ...updated } : x))}
          />
        )}
      </AnimatePresence>
    </div>
  )
}