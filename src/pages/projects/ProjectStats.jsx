import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  Calendar, Users, BarChart2, Loader2, Timer,
  Target, Zap, Flag,
} from "lucide-react"
import { getProjectStats } from "../../services/projectService"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmtHours = (h) => {
  if (!h) return "0 س"
  if (h < 1) return `${Math.round(h * 60)} د`
  return `${h} س`
}

const STATUS_AR = {
  Todo:       { label: "للتنفيذ",     color: "#94a3b8" },
  InProgress: { label: "قيد التنفيذ", color: "#6ea8fe" },
  InReview:   { label: "مراجعة",      color: "#fbbf24" },
  Done:       { label: "مكتمل",       color: "#34d399" },
}

const PRIORITY_AR = {
  Low:      { label: "منخفضة", color: "#34d399" },
  Medium:   { label: "متوسطة", color: "#fbbf24" },
  High:     { label: "عالية",  color: "#f87171" },
  Critical: { label: "حرجة",   color: "#e879f9" },
}

const ROLE_AR = {
  Owner:   { label: "مالك",   color: "#C9A96E" },
  Manager: { label: "مدير",   color: "#6ea8fe" },
  Member:  { label: "عضو",    color: "#34d399" },
  Viewer:  { label: "مشاهد",  color: "#94a3b8" },
}

// ─────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────
const S = {
  card: {
    background: "#0d1420",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
  },
  lbl: {
    fontSize: 11, color: "#6b7891", fontWeight: 700,
    letterSpacing: "0.5px", marginBottom: 4, display: "block",
  },
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ ...S.card, padding: "18px 20px", position: "relative", overflow: "hidden" }}
    >
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 2, background: color, opacity: 0.4,
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 10, marginBottom: 12,
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#e8edf5", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b7891", fontWeight: 700, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: color, marginTop: 4, fontWeight: 700 }}>{sub}</div>}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Progress Ring
// ─────────────────────────────────────────────
function ProgressRing({ pct, size = 100, stroke = 8, color = "#C9A96E" }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.3 }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────
// Bar Chart Row
// ─────────────────────────────────────────────
function BarRow({ label, count, total, color, delay = 0 }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      style={{ marginBottom: 12 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 800 }}>{count}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: delay + 0.1 }}
          style={{ height: "100%", background: color, borderRadius: 4 }}
        />
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ProjectStats({ projectId }) {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState("")

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getProjectStats(projectId)
      .then((d) => { setStats(d?.data || d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [projectId])

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80, color: "#C9A96E" }}>
      <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 14px", display: "block" }} />
      <div style={{ fontSize: 14, fontWeight: 700 }}>جاري تحميل الإحصائيات...</div>
    </div>
  )

  if (error) return (
    <div style={{
      padding: "14px 18px", borderRadius: 10,
      background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)",
      color: "#f87171", fontSize: 13,
    }}>
      {error}
    </div>
  )

  if (!stats) return null

  // Safety Fallback: Smart Mapping 
  const total_tasks = stats.TotalTasks || stats.totalTasks || 0;
  const completed_tasks = stats.CompletedTasks || stats.completedTasks || stats.doneTasks || 0;
  const in_progress_tasks = stats.InProgressTasks || stats.inProgressTasks || stats.inProgress || 0;
  const overdue_tasks = stats.OverdueTasks || stats.overdueTasks || 0;
  const due_soon_tasks = stats.DueSoonTasks || stats.dueSoonTasks || 0;
  const completion_percentage = stats.CompletionPercentage || stats.completionPercentage || stats.progressPercent || 0;
  const total_logged_hours = stats.TotalLoggedHours || stats.totalLoggedHours || stats.totalTimeLogged || 0;
  const total_estimated_hours = stats.TotalEstimatedHours || stats.totalEstimatedHours || 0;
  const status_breakdown = stats.StatusBreakdown || stats.statusBreakdown || [];
  const priority_breakdown = stats.PriorityBreakdown || stats.priorityBreakdown || [];
  const top_members = stats.TopMembers || stats.topMembers || [];
  const active_sprint_stats = stats.ActiveSprintStats || stats.activeSprintStats || null;

  return (
    <div style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── الأرقام الرئيسية ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12, marginBottom: 24,
      }}>
        <StatCard label="إجمالي التاسكات"  value={total_tasks}         color="#C9A96E" delay={0}    icon={<BarChart2   size={18} color="#C9A96E" />} />
        <StatCard label="مكتملة"           value={completed_tasks}     color="#34d399" delay={0.05} icon={<CheckCircle2 size={18} color="#34d399" />} />
        <StatCard label="قيد التنفيذ"      value={in_progress_tasks}   color="#6ea8fe" delay={0.1}  icon={<TrendingUp   size={18} color="#6ea8fe" />} />
        <StatCard label="متأخرة"           value={overdue_tasks}       color="#f87171" delay={0.15} icon={<AlertTriangle size={18} color="#f87171" />} sub={overdue_tasks > 0 ? "تحتاج انتباه" : undefined} />
        <StatCard label="تنتهي قريباً"     value={due_soon_tasks}      color="#fbbf24" delay={0.2}  icon={<Calendar     size={18} color="#fbbf24" />} />
        <StatCard label="ساعات مسجلة"      value={fmtHours(total_logged_hours)} color="#e879f9" delay={0.25} icon={<Timer size={18} color="#e879f9" />} sub={total_estimated_hours ? `من ${fmtHours(total_estimated_hours)} مقدر` : undefined} />
      </div>

      {/* ── نسبة الإنجاز + Sprint ── */}
      <div style={{ display: "grid", gridTemplateColumns: active_sprint_stats ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 24 }}>

        {/* نسبة الإنجاز */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ ...S.card, padding: "24px", display: "flex", alignItems: "center", gap: 24 }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ProgressRing pct={completion_percentage} size={100} color={completion_percentage === 100 ? "#34d399" : "#C9A96E"} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "#e8edf5",
            }}>
              {completion_percentage}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#e8edf5", marginBottom: 6 }}>نسبة الإنجاز</div>
            <div style={{ fontSize: 12, color: "#6b7891", lineHeight: 1.8 }}>
              <span style={{ color: "#34d399", fontWeight: 800 }}>{completed_tasks}</span> مكتملة
              {" · "}
              <span style={{ color: "#6ea8fe", fontWeight: 800 }}>{total_tasks - completed_tasks}</span> متبقية
            </div>
            {completion_percentage === 100 && (
              <div style={{ marginTop: 8, fontSize: 11, color: "#34d399", fontWeight: 700 }}>
                🎉 المشروع مكتمل!
              </div>
            )}
          </div>
        </motion.div>

        {/* Sprint النشط */}
        {active_sprint_stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ ...S.card, padding: "24px", position: "relative", overflow: "hidden" }}
          >
            <div style={{
              position: "absolute", top: 0, right: 0, left: 0, height: 3,
              background: "linear-gradient(90deg,#34d399,transparent)",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Zap size={15} color="#34d399" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>السبرينت النشط</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#e8edf5", marginBottom: 12 }}>
              {active_sprint_stats.Name || active_sprint_stats.name}
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${active_sprint_stats.CompletionPercentage || active_sprint_stats.completionPercentage || 0}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{ height: "100%", background: "#34d399", borderRadius: 4 }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7891" }}>
              <span><span style={{ color: "#34d399", fontWeight: 800 }}>{active_sprint_stats.CompletedTasks || active_sprint_stats.completedTasks || 0}</span> / {active_sprint_stats.TotalTasks || active_sprint_stats.totalTasks || 0} تاسك</span>
              <span style={{ color: "#34d399", fontWeight: 800 }}>{active_sprint_stats.CompletionPercentage || active_sprint_stats.completionPercentage || 0}%</span>
            </div>
            {(active_sprint_stats.StartDate || active_sprint_stats.startDate || active_sprint_stats.EndDate || active_sprint_stats.endDate) && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#6b7891", display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={11} color="#6b7891" />
                {(active_sprint_stats.EndDate || active_sprint_stats.endDate)
                  ? `ينتهي ${new Date(active_sprint_stats.EndDate || active_sprint_stats.endDate).toLocaleDateString("ar-EG")}`
                  : `بدأ ${new Date(active_sprint_stats.StartDate || active_sprint_stats.startDate).toLocaleDateString("ar-EG")}`
                }
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── توزيع الحالات والأولويات ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* الحالات */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ ...S.card, padding: "20px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Target size={15} color="#C9A96E" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#e8edf5" }}>توزيع الحالات</span>
          </div>
          {status_breakdown.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7891", textAlign: "center", padding: "20px 0" }}>لا توجد بيانات</div>
          ) : status_breakdown.map((s, i) => {
            const statusName = s.status || s.Status || "Todo";
            const statusCount = s.count || s.Count || 0;
            const cfg = STATUS_AR[statusName] || { label: statusName, color: "#94a3b8" }
            return (
              <BarRow
                key={statusName}
                label={cfg.label}
                count={statusCount}
                total={total_tasks}
                color={cfg.color}
                delay={0.4 + i * 0.06}
              />
            )
          })}
        </motion.div>

        {/* الأولويات */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ ...S.card, padding: "20px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Flag size={15} color="#f87171" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#e8edf5" }}>توزيع الأولويات</span>
          </div>
          {priority_breakdown.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7891", textAlign: "center", padding: "20px 0" }}>لا توجد بيانات</div>
          ) : priority_breakdown.map((p, i) => {
            const priorityName = p.priority || p.Priority || "Medium";
            const priorityCount = p.count || p.Count || 0;
            const cfg = PRIORITY_AR[priorityName] || { label: priorityName, color: "#94a3b8" }
            return (
              <BarRow
                key={priorityName}
                label={cfg.label}
                count={priorityCount}
                total={total_tasks}
                color={cfg.color}
                delay={0.45 + i * 0.06}
              />
            )
          })}
        </motion.div>
      </div>

      {/* ── أكتر الأعضاء نشاطاً ── */}
      {top_members.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          style={{ ...S.card, padding: "20px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Users size={15} color="#6ea8fe" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#e8edf5" }}>أكتر الأعضاء نشاطاً</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top_members.map((m, i) => {
              const memberId = m.UserId || m.userId;
              const roleCfg = ROLE_AR[m.role || m.Role] || ROLE_AR.Member
              const mAssigned = m.AssignedTasks || m.assignedTasks || 0;
              const mCompleted = m.CompletedTasks || m.completedTasks || m.tasksCompleted || 0;
              const pct = mAssigned > 0 ? Math.round((mCompleted / mAssigned) * 100) : 0
              
              return (
                <motion.div
                  key={memberId || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.06 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: `${roleCfg.color}18`,
                    border: `1px solid ${roleCfg.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: roleCfg.color,
                  }}>
                    {memberId || "?"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#e8edf5" }}>
                        مستخدم #{memberId}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: roleCfg.color,
                        background: `${roleCfg.color}14`,
                        padding: "1px 7px", borderRadius: 5,
                      }}>
                        {roleCfg.label}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
                        style={{ height: "100%", background: "#34d399", borderRadius: 3 }}
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#e8edf5" }}>
                      {mCompleted}/{mAssigned}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7891" }}>مكتمل</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}