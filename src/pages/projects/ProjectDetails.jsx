import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, Kanban, Users, Zap, BarChart2,
  Plus, MoreHorizontal, Trash2, Loader2,
  CheckCircle2, Circle, PauseCircle, XCircle, TrendingUp,
  AlertCircle, ChevronDown, UserPlus, Play, Flag,
  Calendar, Activity,
} from "lucide-react"
import {
  getProject, getBoards, getTasks, getMembers, getSprints,
  getProjectStats, createBoard, deleteBoard,
  createTask, moveTask, deleteTask, deleteSprint, startSprint, completeSprint,
  createSprint, updateProjectStatus, addMember, removeMember,
} from "../../services/projectService"
import TaskModal from "./TaskModal"
import ProjectStats from "./ProjectStats"
import DashboardLayout from "../dashboard/DashboardLayout"
import "../../styles/dashboard.css"

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CFG = {
  Planning:  { label: "تخطيط",  color: "#6ea8fe", bg: "rgba(110,168,254,.12)", Icon: Circle       },
  Active:    { label: "نشط",    color: "#34d399", bg: "rgba(52,211,153,.12)",  Icon: TrendingUp   },
  OnHold:    { label: "متوقف",  color: "#fbbf24", bg: "rgba(251,191,36,.12)",  Icon: PauseCircle  },
  Done:      { label: "مكتمل",  color: "#C9A96E", bg: "rgba(201,169,110,.12)", Icon: CheckCircle2 },
  Cancelled: { label: "ملغي",   color: "#f87171", bg: "rgba(248,113,113,.12)", Icon: XCircle      },
}

const PRIORITY_CFG = {
  Low:      { label: "منخفضة", color: "#34d399" },
  Medium:   { label: "متوسطة", color: "#fbbf24" },
  High:     { label: "عالية",  color: "#f87171" },
  Critical: { label: "حرجة",   color: "#e879f9" },
}

const TABS = [
  { key: "kanban",  label: "المهام",      Icon: Kanban    },
  { key: "members", label: "الأعضاء",     Icon: Users     },
  { key: "sprints", label: "السبرينتات",  Icon: Zap       },
  { key: "stats",   label: "الإحصائيات",  Icon: BarChart2 },
]

// ─────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────
const S = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
  },
  input: {
    width: "100%", boxSizing: "border-box", height: 40,
    background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#e8edf5", fontSize: 13,
    padding: "0 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none", transition: "border-color .2s",
  },
  select: {
    width: "100%", boxSizing: "border-box", height: 40,
    background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#e8edf5", fontSize: 13,
    padding: "0 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none", cursor: "pointer", appearance: "none",
  },
  lbl: { fontSize: 11, color: "#6b7891", fontWeight: 700, display: "block", marginBottom: 5, letterSpacing: "0.4px" },
  btnGold: {
    height: 38, padding: "0 18px", borderRadius: 9, border: "none",
    background: "linear-gradient(135deg,#d4a855,#C9A96E)",
    color: "var(--bg-base)", fontSize: 12, fontWeight: 800,
    cursor: "pointer", fontFamily: "'Cairo',sans-serif",
    display: "flex", alignItems: "center", gap: 7,
    transition: "opacity .2s",
  },
  btnGhost: {
    height: 34, padding: "0 12px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
    color: "#6b7891", fontSize: 12, cursor: "pointer",
    fontFamily: "'Cairo',sans-serif",
    display: "flex", alignItems: "center", gap: 6,
  },
}

// ─────────────────────────────────────────────
// useIsMobile
// ─────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [breakpoint])
  return isMobile
}

// ─────────────────────────────────────────────
// Task Card
// ─────────────────────────────────────────────
function TaskCard({ task, boards, onMove, onDelete, onClick }) {
  const [menu, setMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const p = PRIORITY_CFG[task.priority]

  const handleOpenMenu = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    
    // Check if there is enough space below
    const spaceBelow = window.innerHeight - rect.bottom
    const topPos = spaceBelow < 200 ? rect.top - 150 : rect.bottom + 8

    setMenuPos({
      top: topPos,
      left: rect.left,
    })
    setMenu(true)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      style={{
        background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, padding: "12px 14px",
        cursor: "pointer", position: "relative",
      }}
      whileHover={{ borderColor: "rgba(201,169,110,0.2)" }}
    >
      {p && (
        <div style={{
          position: "absolute", top: 10, left: 10,
          width: 6, height: 6, borderRadius: "50%",
          background: p.color, boxShadow: `0 0 6px ${p.color}60`,
        }} />
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5", marginBottom: 8, paddingLeft: 14 }}>
        {task.title}
      </div>

      {task.description && (
        <p style={{
          fontSize: 11, color: "#6b7891", lineHeight: 1.6, marginBottom: 10,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p && (
            <span style={{
              fontSize: 10, background: `${p.color}14`, color: p.color,
              padding: "2px 8px", borderRadius: 5, fontWeight: 700,
            }}>
              {p.label}
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: 10, color: "#6b7891", display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString("ar-EG")}
            </span>
          )}
        </div>

        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleOpenMenu}
            style={{ ...S.btnGhost, height: 26, padding: "0 7px", borderRadius: 6 }}
          >
            <MoreHorizontal size={13} />
          </button>
          
          {createPortal(
            <AnimatePresence>
              {menu && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                    onClick={(e) => { e.stopPropagation(); setMenu(false) }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -5 }}
                    style={{
                      position: "fixed",
                      top: menuPos.top,
                      left: menuPos.left,
                      zIndex: 9999,
                      background: "#131b2a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: 6,
                      minWidth: 160,
                      boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6b7891", padding: "4px 8px", fontWeight: 700 }}>نقل إلى</div>
                    {boards.filter((b) => {
                        const taskCol = String(task.boardColumnId ?? task.boardId ?? '')
                        return String(b.id) !== taskCol
                      }).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => { onMove(task.id, b.id); setMenu(false) }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "7px 10px", borderRadius: 7,
                          background: "transparent", border: "none",
                          color: "#e8edf5", fontSize: 12, cursor: "pointer",
                          fontFamily: "'Cairo',sans-serif", textAlign: "right",
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color || "#C9A96E" }} />
                        {b.name}
                      </button>
                    ))}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                    <button
                      onClick={() => { onDelete(task.id); setMenu(false) }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "7px 10px", borderRadius: 7,
                        background: "transparent", border: "none",
                        color: "#f87171", fontSize: 12, cursor: "pointer",
                        fontFamily: "'Cairo',sans-serif", textAlign: "right",
                      }}
                    >
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

// ─────────────────────────────────────────────
// Kanban Column
// ─────────────────────────────────────────────
function KanbanColumn({ board, tasks, boards, projectId, onMoveTask, onDeleteTask, onAddTask, onDeleteBoard, onTaskClick, isMobile }) {
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [saving, setSaving] = useState(false)

  const colTasks = tasks.filter((t) => String(t.boardColumnId ?? t.boardId ?? "") === String(board.id))

  const handleAdd = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onAddTask({
        title,
        priority,
        boardColumnId: board.id,
      })
      setTitle(""); setPriority("Medium"); setAddOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      ...S.card,
      minWidth: isMobile ? "85vw" : 280,
      width: isMobile ? "85vw" : 280,
      flexShrink: 0,
      display: "flex", flexDirection: "column",
      maxHeight: isMobile ? "calc(100vh - 380px)" : "calc(100vh - 340px)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: board.color || "#C9A96E",
            boxShadow: `0 0 8px ${board.color || "#C9A96E"}50`,
          }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#e8edf5" }}>{board.name}</span>
          <span style={{
            fontSize: 11, background: "rgba(255,255,255,0.06)",
            color: "#6b7891", padding: "1px 7px", borderRadius: 10, fontWeight: 700,
          }}>
            {colTasks.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setAddOpen((v) => !v)} style={{ ...S.btnGhost, height: 28, padding: "0 8px" }}>
            <Plus size={13} />
          </button>
          <button
            onClick={() => onDeleteBoard(board.id)}
            style={{ ...S.btnGhost, height: 28, padding: "0 8px", color: "#f8717180" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Quick Add */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <input
                style={{ ...S.input, marginBottom: 8 }}
                placeholder="عنوان التاسك..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <select
                style={{ ...S.select, marginBottom: 10, height: 34, fontSize: 12 }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {Object.entries(PRIORITY_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleAdd} disabled={saving} style={{ ...S.btnGold, height: 32, flex: 1, fontSize: 11 }}>
                  {saving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />}
                  إضافة
                </button>
                <button onClick={() => setAddOpen(false)} style={{ ...S.btnGhost, height: 32 }}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks */}
      <div className="kanban-col-tasks">
        <AnimatePresence>
          {colTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#6b7891", fontSize: 12 }}>
              لا توجد مهام
            </div>
          ) : (
            colTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                boards={boards}
                onMove={onMoveTask}
                onDelete={onDeleteTask}
                onClick={() => onTaskClick(t.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Members Tab
// ─────────────────────────────────────────────
function MembersTab({ projectId, currentUserRole }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Member")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getMembers(projectId).then((d) => {
      setMembers(Array.isArray(d) ? d : d?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  const handleAdd = async () => {
    if (!email.trim()) return
    setSaving(true); setError("")
    try {
      const res = await addMember(projectId, { email, role })
      const updated = await getMembers(projectId)
      setMembers(Array.isArray(updated) ? updated : updated?.data || [])
      setEmail(""); setAddOpen(false)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleRemove = async (memberId) => {
    if (!window.confirm("إزالة العضو؟")) return
    try {
      await removeMember(projectId, memberId)
      setMembers((m) => m.filter((x) => x.id !== memberId))
    } catch (e) { alert(e.message) }
  }

  const ROLE_CFG = {
    Owner:   { label: "مالك",  color: "#C9A96E" },
    Manager: { label: "مدير",  color: "#6ea8fe" },
    Member:  { label: "عضو",   color: "#34d399" },
    Viewer:  { label: "مشاهد", color: "#94a3b8" },
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#C9A96E" }}>
      <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#e8edf5" }}>الأعضاء ({members.length})</div>
        {(currentUserRole === "Owner" || currentUserRole === "Manager") && (
          <button onClick={() => setAddOpen((v) => !v)} style={S.btnGold}>
            <UserPlus size={14} /> إضافة عضو
          </button>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 16 }}
          >
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={S.lbl}>البريد الإلكتروني</label>
                  <input
                    style={S.input}
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.4)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <div>
                  <label style={S.lbl}>الصلاحية</label>
                  <select style={S.select} value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="Viewer">مشاهد</option>
                    <option value="Member">عضو</option>
                    <option value="Manager">مدير</option>
                  </select>
                </div>
              </div>
              {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleAdd} disabled={saving} style={S.btnGold}>
                  {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
                  إضافة
                </button>
                <button onClick={() => setAddOpen(false)} style={S.btnGhost}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {members.map((m, i) => {
          const rc = ROLE_CFG[m.role] || { label: m.role, color: "#94a3b8" }
          return (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                ...S.card, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: `${rc.color}18`, border: `1px solid ${rc.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: rc.color, fontWeight: 900, fontSize: 15,
              }}>
                {(m.fullName || m.name || "?")[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5" }}>
                  {m.fullName || m.name || `مستخدم #${m.userId}`}
                </div>
                <div style={{ fontSize: 11, color: "#6b7891", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.email || `ID: ${m.userId}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 11, background: `${rc.color}14`, color: rc.color,
                  padding: "3px 10px", borderRadius: 6, fontWeight: 700,
                }}>
                  {rc.label}
                </span>
                {currentUserRole === "Owner" && m.role !== "Owner" && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    style={{ ...S.btnGhost, height: 30, padding: "0 8px", color: "#f8717170" }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sprints Tab
// ─────────────────────────────────────────────
function SprintsTab({ projectId }) {
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSprints(projectId).then((d) => {
      setSprints(Array.isArray(d) ? d : d?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await createSprint(projectId, form)
      setSprints((s) => [...s, res?.data || res])
      setForm({ name: "", startDate: "", endDate: "" }); setAddOpen(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleStart = async (id) => {
    try {
      await startSprint(id)
      setSprints((s) => s.map((x) => ({
        ...x,
        status: x.id === id ? "Active" : (x.status === "Active" ? "Planned" : x.status),
      })))
    } catch (e) { alert(e.message) }
  }

  const handleComplete = async (id) => {
    try {
      await completeSprint(id)
      setSprints((s) => s.map((x) => x.id === id ? { ...x, status: "Completed" } : x))
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("حذف السبرينت؟")) return
    try {
      await deleteSprint(id)
      setSprints((s) => s.filter((x) => x.id !== id))
    } catch (e) { alert(e.message) }
  }

  const SPRINT_CFG = {
    Planned:   { label: "مخطط",  color: "#6ea8fe", bg: "rgba(110,168,254,.12)" },
    Planning:  { label: "مخطط",  color: "#6ea8fe", bg: "rgba(110,168,254,.12)" },
    Active:    { label: "نشط",   color: "#34d399", bg: "rgba(52,211,153,.12)"  },
    Completed: { label: "مكتمل", color: "#C9A96E", bg: "rgba(201,169,110,.12)" },
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#C9A96E" }}>
      <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#e8edf5" }}>السبرينتات ({sprints.length})</div>
        <button onClick={() => setAddOpen((v) => !v)} style={S.btnGold}>
          <Plus size={14} /> سبرينت جديد
        </button>
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 16 }}
          >
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={S.lbl}>اسم السبرينت</label>
                  <input
                    style={S.input}
                    placeholder="Sprint 1"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.4)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={S.lbl}>تاريخ البداية</label>
                    <input type="date" style={S.input} value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.lbl}>تاريخ النهاية</label>
                    <input type="date" style={S.input} value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreate} disabled={saving} style={S.btnGold}>
                  {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
                  إنشاء
                </button>
                <button onClick={() => setAddOpen(false)} style={S.btnGhost}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sprints.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7891" }}>لا توجد سبرينتات بعد</div>
        ) : sprints.map((sp, i) => {
          const sc = SPRINT_CFG[sp.status] || SPRINT_CFG.Planned
          const done  = sp.completedTasksCount ?? 0
          const total = sp.tasksCount ?? 0
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <motion.div
              key={sp.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ ...S.card, padding: "16px 18px", borderRight: `3px solid ${sc.color}` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#e8edf5", marginBottom: 4 }}>{sp.name}</div>
                  <span style={{
                    fontSize: 11, background: sc.bg, color: sc.color,
                    padding: "2px 10px", borderRadius: 6, fontWeight: 700,
                  }}>
                    {sc.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(sp.status === "Planned" || sp.status === "Planning") && (
                    <button onClick={() => handleStart(sp.id)} style={{ ...S.btnGold, height: 32, fontSize: 11 }}>
                      <Play size={12} /> بدء
                    </button>
                  )}
                  {sp.status === "Active" && (
                    <button onClick={() => handleComplete(sp.id)} style={{ ...S.btnGold, height: 32, fontSize: 11, background: "rgba(52,211,153,.2)", color: "#34d399" }}>
                      <CheckCircle2 size={12} /> إكمال
                    </button>
                  )}
                  {sp.status !== "Active" && (
                    <button onClick={() => handleDelete(sp.id)} style={{ ...S.btnGhost, height: 32, color: "#f8717170" }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {(sp.startDate || sp.endDate) && (
                <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                  {sp.startDate && (
                    <span style={{ fontSize: 11, color: "#6b7891", display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} color="#C9A96E" />
                      {new Date(sp.startDate).toLocaleDateString("ar-EG")}
                    </span>
                  )}
                  {sp.endDate && (
                    <span style={{ fontSize: 11, color: "#6b7891", display: "flex", alignItems: "center", gap: 4 }}>
                      <Flag size={11} color="#f87171" />
                      {new Date(sp.endDate).toLocaleDateString("ar-EG")}
                    </span>
                  )}
                </div>
              )}

              {total > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#6b7891" }}>{done} / {total} تاسك</span>
                    <span style={{ fontSize: 11, color: sc.color, fontWeight: 800 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-base)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7 }}
                      style={{ height: "100%", background: sc.color, borderRadius: 2 }}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Stats Tab
// ─────────────────────────────────────────────
function StatsTab({ projectId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjectStats(projectId).then((d) => {
      setStats(d?.data || d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#C9A96E" }}>
      <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  )
  if (!stats) return <div style={{ textAlign: "center", padding: 60, color: "#6b7891" }}>لا توجد بيانات</div>

  // Safety Fallback: Smart Mapping لضمان قراءة البيانات أياً كان شكل الـ Case من الـ API
  const total_tasks = stats.totalTasks || stats.TotalTasks || 0;
  const completed_tasks = stats.completedTasks || stats.CompletedTasks || stats.doneTasks || 0;
  const in_progress_tasks = stats.inProgressTasks || stats.InProgressTasks || stats.inProgress || 0;
  const overdue_tasks = stats.overdueTasks || stats.OverdueTasks || 0;
  const completion_percentage = stats.completionPercentage || stats.CompletionPercentage || stats.progressPercent || 0;
  const total_logged_hours = stats.totalLoggedHours || stats.TotalLoggedHours || stats.totalTimeLogged || 0;
  const top_members = stats.topMembers || stats.TopMembers || [];

  const cards = [
    { label: "إجمالي المهام",  value: total_tasks,      color: "#C9A96E" },
    { label: "مكتملة",         value: completed_tasks,  color: "#34d399" },
    { label: "متأخرة",         value: overdue_tasks,    color: "#f87171" },
    { label: "قيد التنفيذ",    value: in_progress_tasks, color: "#6ea8fe" },
    { label: "نسبة الإنجاز",   value: `${completion_percentage}%`, color: "#a78bfa" },
    { label: "ساعات مسجلة",    value: total_logged_hours ? `${Math.round(total_logged_hours / 60)}س` : "0س", color: "#fbbf24" },
  ]

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ ...S.card, padding: "16px", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: c.color, opacity: 0.35 }} />
            <div style={{ fontSize: 24, fontWeight: 900, color: "#e8edf5", marginBottom: 6 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#6b7891", fontWeight: 700 }}>{c.label}</div>
          </motion.div>
        ))}
      </div>

      <ProjectStats projectId={projectId} />

      {top_members.length > 0 && (
        <div style={{ ...S.card, padding: "18px 20px", marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#C9A96E", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <Activity size={14} /> أكثر الأعضاء نشاطاً
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top_members.map((m, i) => {
              const memberName = m.name || m.Name || "?";
              const memberCompleted = m.tasksCompleted || m.TasksCompleted || m.CompletedTasks || m.completedTasks || 0;
              
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "#6b7891", width: 18 }}>#{i + 1}</span>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(201,169,110,0.12)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#C9A96E", fontWeight: 800, fontSize: 13,
                  }}>
                    {memberName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {memberName}
                    </div>
                    <div style={{ height: 3, background: "var(--bg-base)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        background: "linear-gradient(90deg,#f0c98a,#C9A96E)",
                        width: `${Math.min((memberCompleted / (completed_tasks || 1)) * 100, 100)}%`,
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#C9A96E", fontWeight: 700, flexShrink: 0 }}>{memberCompleted}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [project, setProject]       = useState(null)
  const [boards, setBoards]         = useState([])
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState("kanban")
  const [addColOpen, setAddColOpen] = useState(false)
  const [newColName, setNewColName] = useState("")
  const [newColColor, setNewColColor] = useState("#C9A96E")
  const [statusMenu, setStatusMenu] = useState(false)
  const [openTaskId, setOpenTaskId] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [proj, bds, tks] = await Promise.all([
          getProject(id),
          getBoards(id),
          getTasks(id),
        ])
        setProject(proj?.data || proj)
        setBoards(Array.isArray(bds) ? bds : bds?.data || [])
        setTasks(Array.isArray(tks) ? tks : tks?.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleAddBoard = async () => {
    if (!newColName.trim()) return
    try {
      const res = await createBoard(id, { name: newColName, color: newColColor })
      setBoards((b) => [...b, res?.data || res])
      setNewColName(""); setAddColOpen(false)
    } catch (e) { alert(e.message) }
  }

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm("حذف الكولومن؟ يجب أن يكون فارغاً.")) return
    try {
      await deleteBoard(id, boardId)
      setBoards((b) => b.filter((x) => x.id !== boardId))
    } catch (e) { alert(e.message) }
  }

  const handleAddTask = async (body) => {
    const res = await createTask(id, body)
    const newTask = res?.data || res
    setTasks((t) => [...t, newTask])
  }

  const handleMoveTask = async (taskId, boardId) => {
    try {
      await moveTask(id, taskId, boardId)
      const numericBoardId = typeof boards[0]?.id === 'number' ? Number(boardId) : boardId
      setTasks((t) => t.map((x) => x.id === taskId
        ? { ...x, boardColumnId: numericBoardId, boardId: numericBoardId }
        : x
      ))
    } catch (e) { alert(e.message) }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("حذف التاسك؟")) return
    try {
      await deleteTask(id, taskId)
      setTasks((t) => t.filter((x) => x.id !== taskId))
    } catch (e) { alert(e.message) }
  }

  const handleStatusChange = async (status) => {
    try {
      await updateProjectStatus(id, status)
      setProject((p) => ({ ...p, status }))
      setStatusMenu(false)
    } catch (e) { alert(e.message) }
  }

  if (loading) return (
    <DashboardLayout title="تفاصيل البروجكت" breadcrumb="البروجكتات">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 0" }}>
        <Loader2 size={36} color="var(--gold)" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  )

  if (!project) return (
    <DashboardLayout title="البروجكتات" breadcrumb="البروجكتات">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 0", color: "var(--red)", fontFamily: "'Cairo',sans-serif" }}>
        البروجكت مش موجود
      </div>
    </DashboardLayout>
  )

  const st = STATUS_CFG[project.status] || STATUS_CFG.Planning
  const tasksTotal = tasks.length
  const tasksDone  = tasks.filter((t) => t.status === "Done").length
  const progress   = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
  const activeTabCfg = TABS.find((t) => t.key === activeTab)

  return (
    <DashboardLayout title={project.name || project.title} breadcrumb="البروجكتات">
    <div style={{
      background: "var(--bg-base)", minHeight: "100vh",
      direction: "rtl", color: "var(--text)",
      fontFamily: "'Cairo',sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        /* kanban styles moved to dashboard.css */
        ::-webkit-calendar-picker-indicator { filter: invert(0.8); }
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: #0a1018; border-top: 1px solid rgba(255,255,255,0.07);
          display: flex; height: 60px; padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: isMobile ? "16px 16px 0" : "24px 28px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 12 : 18 }}>
          <button
            onClick={() => navigate("/dashboard/projects")}
            style={{ ...S.btnGhost, height: 30, fontSize: 11, padding: "0 10px" }}
          >
            <ArrowRight size={13} style={{ transform: "rotate(180deg)" }} />
            {!isMobile && "البروجكتات"}
          </button>
          <span style={{ color: "#6b7891", fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: "#C9A96E", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 160 : 300 }}>
            {project.name || project.title}
          </span>
        </div>

        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900, color: "#e8edf5", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {project.name || project.title}
            </h1>
            {project.description && !isMobile && (
              <p style={{ fontSize: 12, color: "#6b7891", margin: 0, maxWidth: 500 }}>{project.description}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Progress mini */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 9, padding: "6px 12px",
            }}>
              <div style={{ width: isMobile ? 44 : 60, height: 4, background: "var(--bg-base)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#f0c98a,#C9A96E)", borderRadius: 2, transition: "width .5s" }} />
              </div>
              <span style={{ fontSize: 12, color: "#C9A96E", fontWeight: 800 }}>{progress}%</span>
              {!isMobile && <span style={{ fontSize: 11, color: "#6b7891" }}>{tasksTotal} تاسك</span>}
            </div>

            {/* Status dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setStatusMenu((v) => !v)}
                style={{
                  ...S.btnGhost, height: 34,
                  background: st.bg, color: st.color, borderColor: `${st.color}30`,
                  fontSize: isMobile ? 11 : 12,
                  padding: isMobile ? "0 10px" : "0 12px",
                }}
              >
                <st.Icon size={13} /> {st.label} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {statusMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    style={{
                      position: "absolute", top: 38, left: 0, zIndex: 50,
                      background: "#131b2a", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: 6, minWidth: 150,
                      boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                    }}
                    onMouseLeave={() => setStatusMenu(false)}
                  >
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <button key={k} onClick={() => handleStatusChange(k)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "8px 10px", borderRadius: 7,
                        background: project.status === k ? `${v.color}15` : "transparent",
                        border: "none", color: project.status === k ? v.color : "#94a3b8",
                        fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif", textAlign: "right",
                      }}>
                        <v.Icon size={13} color={v.color} /> {v.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs: Desktop */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "10px 16px", borderRadius: "9px 9px 0 0",
                  border: "none", cursor: "pointer",
                  background: activeTab === tab.key ? "var(--bg-card)" : "transparent",
                  color: activeTab === tab.key ? "#C9A96E" : "#6b7891",
                  fontSize: 13, fontWeight: 700,
                  fontFamily: "'Cairo',sans-serif",
                  borderBottom: activeTab === tab.key ? "2px solid #C9A96E" : "2px solid transparent",
                  transition: "all .2s",
                }}
              >
                <tab.Icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: current tab label */}
        {isMobile && (
          <div style={{ paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {activeTabCfg && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#C9A96E", fontSize: 13, fontWeight: 800 }}>
                <activeTabCfg.Icon size={14} />
                {activeTabCfg.label}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ paddingBottom: isMobile ? 72 : 0 }}
        >
          {/* KANBAN */}
          {activeTab === "kanban" && (
            <div>
              <div className="kanban-scroll">
                {boards.map((b) => (
                  <KanbanColumn
                    key={b.id}
                    board={b}
                    tasks={tasks}
                    boards={boards}
                    projectId={id}
                    onMoveTask={handleMoveTask}
                    onDeleteTask={handleDeleteTask}
                    onAddTask={handleAddTask}
                    onDeleteBoard={handleDeleteBoard}
                    onTaskClick={setOpenTaskId}
                    isMobile={isMobile}
                  />
                ))}

                {/* Add column */}
                <div style={{ minWidth: isMobile ? 220 : 260, flexShrink: 0 }}>
                  {!addColOpen ? (
                    <button
                      onClick={() => setAddColOpen(true)}
                      style={{
                        width: "100%", height: 48,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.12)",
                        borderRadius: 12, color: "#6b7891", fontSize: 13,
                        cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "border-color .2s, color .2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.4)"; e.currentTarget.style.color = "#C9A96E" }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#6b7891" }}
                    >
                      <Plus size={16} /> إضافة كولومن
                    </button>
                  ) : (
                    <div style={{ ...S.card, padding: 16 }}>
                      <input
                        style={{ ...S.input, marginBottom: 10 }}
                        placeholder="اسم الكولومن..."
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddBoard()}
                        autoFocus
                        onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <label style={{ ...S.lbl, margin: 0 }}>اللون:</label>
                        <input
                          type="color" value={newColColor}
                          onChange={(e) => setNewColColor(e.target.value)}
                          style={{ width: 36, height: 28, borderRadius: 6, border: "none", background: "none", cursor: "pointer" }}
                        />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: newColColor }} />
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleAddBoard} style={{ ...S.btnGold, height: 32, flex: 1, fontSize: 11 }}>
                          <Plus size={12} /> إضافة
                        </button>
                        <button onClick={() => setAddColOpen(false)} style={{ ...S.btnGhost, height: 32 }}>إلغاء</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div style={{ padding: isMobile ? "16px" : "24px 28px" }}>
              <MembersTab projectId={id} currentUserRole={project.myRole || "Member"} />
            </div>
          )}

          {activeTab === "sprints" && (
            <div style={{ padding: isMobile ? "16px" : "24px 28px" }}>
              <SprintsTab projectId={id} />
            </div>
          )}

          {activeTab === "stats" && (
            <div style={{ padding: isMobile ? "16px" : "24px 28px" }}>
              <StatsTab projectId={id} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="bottom-nav">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 4,
                  background: "none", border: "none", cursor: "pointer",
                  color: isActive ? "#C9A96E" : "#4a5568",
                  fontFamily: "'Cairo',sans-serif",
                  transition: "color .2s", position: "relative",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position: "absolute", top: 0, left: "20%", right: "20%",
                      height: 2, background: "#C9A96E", borderRadius: "0 0 4px 4px",
                    }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  />
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
            taskId={openTaskId}
            projectId={id}
            onClose={() => setOpenTaskId(null)}
            onUpdated={(updated) => setTasks((t) => t.map((x) => x.id === updated.id ? { ...x, ...updated } : x))}
          />
        )}
      </AnimatePresence>
    </div>
    </DashboardLayout>
  )
}