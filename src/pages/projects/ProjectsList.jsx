import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, FolderKanban, Users, LayoutGrid,
  CheckCircle2, Circle, PauseCircle, XCircle,
  ChevronRight, Search, Loader2,
  TrendingUp, MoreHorizontal, Trash2,
} from "lucide-react"
import {
  getProjects,
  createProject,
  updateProjectStatus,
  deleteProject,
} from "../../services/projectService"
import DashboardLayout from "../dashboard/DashboardLayout"
import "../../styles/dashboard.css"

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  Planning:  { label: "تخطيط",    color: "#6ea8fe", bg: "rgba(110,168,254,.12)", Icon: Circle       },
  Active:    { label: "نشط",      color: "#34d399", bg: "rgba(52,211,153,.12)",  Icon: TrendingUp   },
  OnHold:    { label: "متوقف",    color: "#fbbf24", bg: "rgba(251,191,36,.12)",  Icon: PauseCircle  },
  Done:      { label: "مكتمل",    color: "#C9A96E", bg: "rgba(201,169,110,.12)", Icon: CheckCircle2 },
  Cancelled: { label: "ملغي",     color: "#f87171", bg: "rgba(248,113,113,.12)", Icon: XCircle      },
}

const PRIORITY_CONFIG = {
  Low:      { label: "منخفضة", color: "#34d399" },
  Medium:   { label: "متوسطة", color: "#fbbf24" },
  High:     { label: "عالية",  color: "#f87171" },
  Critical: { label: "حرجة",   color: "#e879f9" },
}

const PRIORITY_INT_MAP       = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" }
const PROJECT_STATUS_INT_MAP = { 1: "Planning", 2: "Active", 3: "OnHold", 4: "Done", 5: "Cancelled" }

const normPriority      = (v) => typeof v === "number" ? PRIORITY_INT_MAP[v]       : v
const normProjectStatus = (v) => typeof v === "number" ? PROJECT_STATUS_INT_MAP[v] : v

// ─────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────
const S = {
  wrap: {
    background: "var(--bg-base)",
    minHeight: "100vh",
    padding: "32px 28px",
    direction: "rtl",
    color: "var(--text)",
    fontFamily: "'Cairo', sans-serif",
    boxSizing: "border-box",
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
  },
  input: {
    width: "100%", boxSizing: "border-box", height: 42,
    background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "var(--text)", fontSize: 13,
    padding: "0 14px", fontFamily: "'Cairo', sans-serif",
    outline: "none", transition: "border-color .2s",
  },
  textarea: {
    width: "100%", boxSizing: "border-box",
    background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "var(--text)", fontSize: 13,
    padding: "10px 14px", fontFamily: "'Cairo', sans-serif",
    outline: "none", resize: "vertical", minHeight: 80,
    transition: "border-color .2s",
  },
  select: {
    width: "100%", boxSizing: "border-box", height: 42,
    background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "var(--text)", fontSize: 13,
    padding: "0 14px", fontFamily: "'Cairo', sans-serif",
    outline: "none", cursor: "pointer", appearance: "none",
  },
  lbl: {
    fontSize: 11, color: "var(--text-muted)", fontWeight: 700,
    display: "block", marginBottom: 6, letterSpacing: "0.5px",
  },
  btnGold: {
    height: 42, padding: "0 22px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #d4a855, #C9A96E)",
    color: "var(--bg-base)", fontSize: 13, fontWeight: 800, cursor: "pointer",
    fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center",
    gap: 8, whiteSpace: "nowrap", transition: "opacity .2s, transform .1s",
  },
  btnGhost: {
    height: 38, padding: "0 16px", borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
    color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
    fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center",
    gap: 6, transition: "border-color .2s, color .2s",
  },
}

// ─────────────────────────────────────────────
// Dropdown Portal — يتعرض برا الـ card frame
// ─────────────────────────────────────────────
function DropdownPortal({ anchorRef, open, onClose, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({
      top:  rect.bottom + window.scrollY + 6,
      left: rect.left   + window.scrollX,
    })
  }, [open, anchorRef])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!anchorRef.current?.contains(e.target)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "absolute",
          top: pos.top, left: pos.left,
          zIndex: 9999,
          background: "#131b2a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "6px", minWidth: 170,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          direction: "rtl", fontFamily: "'Cairo', sans-serif",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ─────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────
function ProjectCard({ project, onOpen, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const btnRef = useRef(null)

  const statusKey   = normProjectStatus(project.status)
  const priorityKey = normPriority(project.priority)

  const st = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Planning
  const StatusIcon = st.Icon

  const tasksTotal   = project.tasksCount    ?? project.tasks?.length  ?? 0
  const tasksDone    = project.doneTasksCount ?? 0
  const progress     = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
  const membersCount = project.membersCount  ?? project.members?.length ?? 0

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        style={{ ...S.card, padding: "20px", cursor: "pointer", position: "relative", overflow: "hidden" }}
        onClick={() => onOpen(project.id)}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.25)" }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)" }}
      >
        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, right: 0, left: 0, height: 3,
          background: `linear-gradient(90deg, ${st.color}80, transparent)`,
          borderRadius: "14px 14px 0 0",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `${st.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FolderKanban size={18} color={st.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 800, color: "var(--text)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {project.name || project.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>#{project.id}</div>
            </div>
          </div>

          {/* زرار الـ menu — بدون overflow hidden عليه */}
          <div onClick={(e) => e.stopPropagation()}>
            <button
              ref={btnRef}
              onClick={() => setMenuOpen((v) => !v)}
              style={{ ...S.btnGhost, height: 32, padding: "0 8px", borderRadius: 7 }}
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p style={{
            fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {project.description}
          </p>
        )}

        {/* Badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{
            background: st.bg, color: st.color,
            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <StatusIcon size={11} /> {st.label}
          </span>
          {priorityKey && PRIORITY_CONFIG[priorityKey] && (
            <span style={{
              background: `${PRIORITY_CONFIG[priorityKey].color}14`,
              color: PRIORITY_CONFIG[priorityKey].color,
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            }}>
              {PRIORITY_CONFIG[priorityKey].label}
            </span>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>التقدم</span>
            <span style={{ fontSize: 11, color: "#C9A96E", fontWeight: 800 }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: "var(--bg-base)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                height: "100%",
                background: progress === 100
                  ? "linear-gradient(90deg,#34d399,#10b981)"
                  : "linear-gradient(90deg,#f0c98a,#C9A96E)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
              <LayoutGrid size={13} color="#C9A96E" />
              <span style={{ color: "var(--text)", fontWeight: 700 }}>{tasksTotal}</span> تاسك
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
              <Users size={13} color="#6ea8fe" />
              <span style={{ color: "var(--text)", fontWeight: 700 }}>{membersCount}</span> عضو
            </span>
          </div>
          <ChevronRight size={16} color="#C9A96E" style={{ transform: "rotate(180deg)" }} />
        </div>
      </motion.div>

      {/* ✅ الـ Dropdown برا الـ card تماماً عن طريق Portal */}
      <DropdownPortal anchorRef={btnRef} open={menuOpen} onClose={() => setMenuOpen(false)}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { onStatusChange(project.id, key); setMenuOpen(false) }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "8px 10px", borderRadius: 7,
              background: statusKey === key ? "rgba(201,169,110,0.1)" : "transparent",
              border: "none", color: statusKey === key ? "#C9A96E" : "#94a3b8",
              fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif",
              textAlign: "right",
            }}
          >
            <cfg.Icon size={13} color={cfg.color} /> {cfg.label}
          </button>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
        <button
          onClick={() => { onDelete(project.id); setMenuOpen(false) }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "8px 10px", borderRadius: 7,
            background: "transparent", border: "none",
            color: "#f87171", fontSize: 12, cursor: "pointer",
            fontFamily: "'Cairo',sans-serif", textAlign: "right",
          }}
        >
          <Trash2 size={13} /> حذف البروجكت
        </button>
      </DropdownPortal>
    </>
  )
}

// ─────────────────────────────────────────────
// Create Project Modal
// ─────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "", priority: "Medium" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { setError("اسم البروجكت مطلوب"); return }
    setLoading(true); setError("")
    try {
      const priorityMap = { Low: 0, Medium: 1, High: 2, Critical: 3 }
      const res = await createProject({
        title:       form.name,
        description: form.description,
        priority:    priorityMap[form.priority] ?? 1,
      })
      onCreate(res?.data || res)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, direction: "rtl",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 20 }}
        style={{ ...S.card, padding: 28, width: "100%", maxWidth: 480, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          position: "absolute", top: 0, right: 0, left: 0, height: 3,
          background: "linear-gradient(90deg,#C9A96E,#d4a855,transparent)",
          borderRadius: "14px 14px 0 0",
        }} />

        <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
          إنشاء بروجكت جديد
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
          سيتم إنشاء 4 كولومنات افتراضية تلقائياً
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.lbl}>اسم البروجكت *</label>
            <input
              style={S.input}
              placeholder="مثال: تطوير منصة زيا..."
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-md)")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
          </div>
          <div>
            <label style={S.lbl}>الوصف</label>
            <textarea
              style={S.textarea}
              placeholder="اكتب وصفاً مختصراً للبروجكت..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-md)")}
            />
          </div>
          <div>
            <label style={S.lbl}>الأولوية</label>
            <select style={S.select} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 8,
            background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)",
            color: "#f87171", fontSize: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            onClick={submit}
            disabled={loading}
            style={{ ...S.btnGold, flex: 1, opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              : <Plus size={15} />
            }
            {loading ? "جاري الإنشاء..." : "إنشاء البروجكت"}
          </button>
          <button onClick={onClose} style={{ ...S.btnGhost, height: 42 }}>إلغاء</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ProjectsList() {
  const navigate = useNavigate()
  const [projects, setProjects]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState("")
  const [search, setSearch]             = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showCreate, setShowCreate]     = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const data = await getProjects()
        setProjects(Array.isArray(data) ? data : data?.data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا البروجكت؟")) return
    try {
      await deleteProject(id)
      setProjects((p) => p.filter((x) => x.id !== id))
    } catch (e) { alert(e.message) }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateProjectStatus(id, status)
      setProjects((p) => p.map((x) => x.id === id ? { ...x, status } : x))
    } catch (e) { alert(e.message) }
  }

  const filtered = projects.filter((p) => {
    const projectName = p.name || p.title || ""
    const matchSearch = !search || projectName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || normProjectStatus(p.status) === filterStatus
    return matchSearch && matchStatus
  })

  const total  = projects.length
  const active = projects.filter((p) => normProjectStatus(p.status) === "Active").length
  const done   = projects.filter((p) => normProjectStatus(p.status) === "Done").length
  const onHold = projects.filter((p) => normProjectStatus(p.status) === "OnHold").length

  return (
    <DashboardLayout title="إدارة المشاريع" breadcrumb="المشاريع">
    <div style={{ ...S.wrap, padding: '24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px) { .stat-grid { grid-template-columns: repeat(2,1fr); } .pm-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={() => setShowCreate(true)}
          style={S.btnGold}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={16} /> إنشاء بروجكت
        </button>
      </div>

      {/* Stats */}
      <motion.div className="stat-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {[
          { label: "إجمالي المشاريع", value: total,  color: "#C9A96E", icon: <FolderKanban size={18} color="#C9A96E" /> },
          { label: "نشطة الآن",          value: active, color: "#34d399", icon: <TrendingUp   size={18} color="#34d399" /> },
          { label: "مكتملة",             value: done,   color: "#6ea8fe", icon: <CheckCircle2 size={18} color="#6ea8fe" /> },
          { label: "متوقفة",             value: onHold, color: "#fbbf24", icon: <PauseCircle  size={18} color="#fbbf24" /> },
        ].map((s) => (
          <div key={s.label} style={{ ...S.card, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.35 }} />
            <div style={{
              width: 34, height: 34, borderRadius: 9, marginBottom: 10,
              background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        style={{
          ...S.card, padding: "14px 18px", marginBottom: 20,
          display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 220px", position: "relative" }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            style={{ ...S.input, paddingRight: 34 }}
            placeholder="ابحث باسم البروجكت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "rgba(201,169,110,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-md)")}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterStatus("")}
            style={{
              ...S.btnGhost, height: 38,
              background: !filterStatus ? "rgba(201,169,110,.12)" : "transparent",
              color: !filterStatus ? "#C9A96E" : "var(--text-muted)",
              borderColor: !filterStatus ? "rgba(201,169,110,.3)" : "var(--border-md)",
            }}
          >
            الكل ({total})
          </button>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => {
            const count = projects.filter((p) => normProjectStatus(p.status) === k).length
            if (count === 0) return null
            return (
              <button
                key={k}
                onClick={() => setFilterStatus(k === filterStatus ? "" : k)}
                style={{
                  ...S.btnGhost, height: 38,
                  background: filterStatus === k ? `${v.color}15` : "transparent",
                  color: filterStatus === k ? v.color : "var(--text-muted)",
                  borderColor: filterStatus === k ? `${v.color}40` : "var(--border-md)",
                }}
              >
                {v.label} ({count})
              </button>
            )
          })}
        </div>
      </motion.div>

      {error && (
        <div style={{
          padding: "14px 18px", borderRadius: 10, marginBottom: 20,
          background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)",
          color: "#f87171", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 80, color: "#C9A96E" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 14px", display: "block" }} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>جاري تحميل المشاريع...</div>
        </div>
      )}

      {!loading && (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: "var(--bg-card)", border: "1px solid rgba(201,169,110,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <FolderKanban size={26} color="#C9A96E" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>
                {search || filterStatus ? "لا توجد نتائج مطابقة" : "لا توجد بروجكتات بعد"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                {search || filterStatus ? "جرّب تغيير معايير البحث" : "ابدأ بإنشاء أول بروجكت لك الآن"}
              </div>
              {!search && !filterStatus && (
                <button onClick={() => setShowCreate(true)} style={{ ...S.btnGold, margin: "0 auto" }}>
                  <Plus size={15} /> إنشاء بروجكت
                </button>
              )}
            </motion.div>
          ) : (
            <div className="pm-grid">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={(id) => navigate(`/dashboard/projects/${id}`)}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreate={(newProject) => {
              if (newProject) setProjects((p) => [newProject, ...p])
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </DashboardLayout>
  )
}