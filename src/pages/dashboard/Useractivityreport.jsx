import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API_BASE_URL from "../../config"
import DashboardLayout from './DashboardLayout'
import '../../styles/dashboard.css'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]

// تنسيق تاريخ احترافي (مضبوط على توقيت مصر - UTC to EET)
const fmtDate = (d) => {
  if (!d) return "—";
  // إجبار النص على أنه UTC لو الباك إند مبعتش Z
  const dateStr = typeof d === 'string' && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;
  const date = new Date(dateStr);
  
  const day = date.toLocaleDateString("en-US", { timeZone: "Africa/Cairo", day: "numeric" });
  const monthIdx = parseInt(date.toLocaleDateString("en-US", { timeZone: "Africa/Cairo", month: "numeric" })) - 1;
  const year = date.toLocaleDateString("en-US", { timeZone: "Africa/Cairo", year: "numeric" });

  return `${day} ${MONTHS_AR[monthIdx]} ${year}`;
}

// تنسيق وقت مريح للعين (مضبوط على توقيت مصر - UTC to EET)
const fmtTime = (d) => {
  if (!d) return "—";
  // إجبار النص على أنه UTC
  const dateStr = typeof d === 'string' && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;
  const t = new Date(dateStr).toLocaleTimeString("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return t.replace("AM", "ص").replace("PM", "م");
}

const toLocalISO = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const y = date.toLocaleDateString("en-US", { timeZone: "Africa/Cairo", year: "numeric" });
  const m = date.toLocaleDateString("en-US", { timeZone: "Africa/Cairo", month: "2-digit" });
  const d = date.toLocaleDateString("en-US", { timeZone: "Africa/Cairo", day: "2-digit" });
  return `${y}-${m}-${d}`;
};

// ─────────────────────────────────────────────
// Action styles
// ─────────────────────────────────────────────
const ACTION_COLORS = {
  Create: { bg: "rgba(52,211,153,.15)",  color: "#34d399", label: "إضافة سجل" },
  Edit:   { bg: "rgba(56,189,248,.15)",  color: "#38bdf8", label: "تعديل بيانات" },
  Update: { bg: "rgba(56,189,248,.15)",  color: "#38bdf8", label: "تحديث بيانات" },
  Delete: { bg: "rgba(248,113,113,.15)", color: "#f87171", label: "حذف سجل"   },
  View:   { bg: "rgba(148,163,184,.12)", color: "#94a3b8", label: "عرض تفاصيل" },
  Get:    { bg: "rgba(148,163,184,.12)", color: "#94a3b8", label: "استعلام"    },
  Login:  { bg: "rgba(201,169,110,.15)", color: "#C9A96E", label: "تسجيل دخول" },
}

const getActionStyle = (action) => {
  const key = Object.keys(ACTION_COLORS).find((k) => action?.includes(k))
  return ACTION_COLORS[key] || { bg: "rgba(167,139,250,.12)", color: "#a78bfa", label: "إجراء عام" }
}

// ─────────────────────────────────────────────
// Entity Arabic names
// ─────────────────────────────────────────────
const ENTITY_AR = {
  Lead: "عميل محتمل (ليد)", Leads: "العملاء المحتملين", 
  Customer: "عميل", Customers: "العملاء",
  User: "مستخدم", Users: "المستخدمين", 
  Enrollment: "تسجيل", Enrollments: "التسجيلات",
  Payment: "دفعة", Payments: "المدفوعات", 
  Course: "كورس", Courses: "الكورسات",
  Student: "طالب", Students: "الطلاب", 
  Note: "ملاحظة", Notes: "الملاحظات",
}
const entityAr = (e) => ENTITY_AR[e] || e

// ─────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────
const S = {
  wrap: {
    background: "var(--bg-base)", minHeight: "100vh", padding: "28px 24px",
    direction: "rtl", color: "var(--text)",
    fontFamily: "'Cairo',sans-serif", boxSizing: "border-box",
  },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
  },
  lbl: { fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: "0.5px" },
  sel: {
    width: "100%", boxSizing: "border-box", height: 40,
    background: "var(--bg-base)", border: "1px solid var(--border-md)",
    borderRadius: 9, color: "var(--text)", fontSize: 13,
    padding: "0 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none", cursor: "pointer", appearance: "none",
  },
  input: {
    width: "100%", boxSizing: "border-box", height: 40,
    background: "var(--bg-base)", border: "1px solid var(--border-md)",
    borderRadius: 9, color: "var(--text)", fontSize: 13,
    padding: "0 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none",
  },
  btnGold: {
    height: 40, padding: "0 22px", borderRadius: 9, border: "none",
    background: "linear-gradient(135deg,#d4a855,var(--gold))", color: "#080d16", fontSize: 13, width: "100%",
    fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
  },
  btnGhost: {
    height: 36, padding: "0 16px", borderRadius: 8,
    border: "1px solid var(--border-md)", background: "transparent",
    color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
    fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6,
  },
}

// ─────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#C9A96E", icon }) {
  return (
    <div style={{ ...S.card, padding: "18px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.4 }} />
      <div style={{
        width: 36, height: 36, borderRadius: 10, marginBottom: 12,
        background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#e8edf5", lineHeight: 1, marginBottom: 6, fontFamily: "'Cairo',sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#6b7891", fontWeight: 700, letterSpacing: "0.5px" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Icons (SVG)
// ─────────────────────────────────────────────
const Icon = {
  back:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 12l4-4-4-4"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="4"/><path d="M10 10l3 3"/></svg>,
  report:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M2 7h12"/></svg>,
  list:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5h12M2 8h8M2 11h5"/></svg>,
  bar:      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="9" width="3" height="5" rx="0.5"/><rect x="6.5" y="6" width="3" height="8" rx="0.5"/><rect x="11" y="3" width="3" height="11" rx="0.5"/></svg>,
  calendar: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M2 7h12"/></svg>,
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function UserActivityReport() {
  const navigate = useNavigate()

  const [users, setUsers]         = useState([])
  const [userId, setUserId]       = useState("")
  const [selectedDate, setSelectedDate] = useState(toLocalISO(new Date()))
  const [actions, setActions]     = useState([])
  const [summary, setSummary]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [searched, setSearched]   = useState(false)

  // load users
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() })
        if (r.ok) {
          const d = await r.json()
          setUsers(Array.isArray(d) ? d : d?.data || [])
        }
      } catch {}
    })()
  }, [])

  const search = async () => {
    if (!userId)        { setError("يرجى اختيار مستخدم أولاً"); return }
    if (!selectedDate)  { setError("يرجى تحديد تاريخ التقرير"); return }

    setLoading(true); setError(""); setSearched(true)

    try {
      const [ar, sr] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/reports/user-activity/actions?userId=${userId}&date=${selectedDate}`,
          { headers: authHeaders() }
        ),
        fetch(
          `${API_BASE_URL}/api/reports/user-activity/daily-summary?userId=${userId}&date=${selectedDate}`,
          { headers: authHeaders() }
        ),
      ])
      if (ar.ok) { const d = await ar.json(); setActions(d?.data || d || []) }
      if (sr.ok) { const d = await sr.json(); setSummary(d?.data || d) }
    } catch (e) {
      setError("حدث خطأ أثناء تحميل التقرير: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = users.find((u) => u.id === parseInt(userId))
  const firstAction  = actions.length > 0 ? actions[0]                    : null
  const lastAction   = actions.length > 0 ? actions[actions.length - 1]   : null

  const grouped = actions.reduce((acc, a) => {
    const key = a.entity || "أخرى"
    if (!acc[key]) acc[key] = { total: 0, create: 0, edit: 0, delete: 0, view: 0, other: 0 }
    acc[key].total++
    if      (a.action?.includes("Create"))                               acc[key].create++
    else if (a.action?.includes("Edit") || a.action?.includes("Update")) acc[key].edit++
    else if (a.action?.includes("Delete"))                               acc[key].delete++
    else if (a.action?.includes("View") || a.action?.includes("Get"))    acc[key].view++
    else                                                                 acc[key].other++
    return acc
  }, {})

  // ── Render ──
  return (
    <DashboardLayout title="تقرير نشاط المستخدم" breadcrumb="التقارير">
      <div className="wrap-container" style={{ ...S.wrap, padding: "0 24px 24px" }}>
        {/* ── Responsive & Custom Scrollbar Styles ── */}
        <style>{`
          .responsive-grid-filter { display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px; align-items: flex-end; }
          .responsive-grid-main { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }
          .responsive-grid-halves { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          
          /* 🔥 تصميم السكرول بار المخصص للمظهر المظلم 🔥 */
          .custom-scroll {
            overflow-y: auto;
            overflow-x: hidden;
            max-height: calc(100vh - 350px);
            min-height: 350px;
            padding-right: 6px;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(201, 169, 110, 0.25);
            border-radius: 10px;
            transition: background 0.3s ease;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(201, 169, 110, 0.6);
          }

          /* إصلاح أيقونة التاريخ في متصفحات الويب كيت */
          ::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }

          @media (max-width: 900px) {
            .responsive-grid-filter { grid-template-columns: 1fr 1fr; }
            .responsive-grid-filter > button { grid-column: span 2; }
            .responsive-grid-main { grid-template-columns: 1fr; }
            .custom-scroll { max-height: 500px; } /* تحديد طول ثابت في الموبايل */
          }

          @media (max-width: 600px) {
            .wrap-container { padding: 16px 14px !important; }
            .responsive-grid-filter { grid-template-columns: 1fr; gap: 12px; }
            .responsive-grid-filter > button { grid-column: span 1; }
            .responsive-grid-halves { grid-template-columns: 1fr; }
          }
        `}</style>



        {/* ── Filter Card ── */}
        <div style={{ ...S.card, padding: 22, marginBottom: 20, position: "relative", overflow: "hidden" }}>
          {/* شريط جانبي دهبي للزينة */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: "#C9A96E", borderRadius: "0 12px 12px 0" }} />

          <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A96E", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            {Icon.search} محددات البحث
          </div>

          <div className="responsive-grid-filter">
            {/* User select */}
            <div style={{ width: "100%" }}>
              <label style={S.lbl}>اسم المستخدم *</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} style={S.sel}>
                <option value="">-- اختر مستخدم من القائمة --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
                ))}
              </select>
            </div>

            {/* Single Date Picker */}
            <div style={{ width: "100%" }}>
              <label style={S.lbl}>تاريخ التقرير *</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                style={S.input} 
              />
            </div>

            {/* Search button */}
            <button onClick={search} disabled={loading} style={{ ...S.btnGold, opacity: loading ? 0.7 : 1 }}>
              {Icon.report}
              {loading ? "جاري استخراج التقرير..." : "عرض التقرير الآن"}
            </button>
          </div>

          {error && (
            <div style={{ color: "#f87171", fontSize: 13, marginTop: 14, padding: "10px 14px", background: "rgba(248,113,113,.08)", borderRadius: 8, border: "1px solid rgba(248,113,113,.15)" }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: 80, color: "#C9A96E", fontSize: 16, fontWeight: 700 }}>
            <div style={{ marginBottom: 10 }}>⏳</div>
            جاري تجميع بيانات المستخدم...
          </div>
        )}

        {/* ── Results ── */}
        {searched && !loading && (
          <>
            {/* User bar */}
            {selectedUser && (
              <div style={{ ...S.card, padding: "16px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "rgba(201,169,110,.15)", border: "2px solid rgba(201,169,110,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#C9A96E", fontWeight: 900, fontSize: 22, flexShrink: 0,
                }}>
                  {(selectedUser.fullName || "?")[0]}
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#e8edf5", marginBottom: 4 }}>{selectedUser.fullName}</div>
                  <div style={{ fontSize: 12, color: "#6b7891", wordBreak: "break-all" }}>البريد الإلكتروني: <span style={{ color: "#94a3b8" }}>{selectedUser.email}</span></div>
                </div>
                {selectedDate && (
                  <div style={{ fontSize: 13, color: "#e8edf5", background: "#080d16", padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                    {Icon.calendar}
                    تقرير يوم: <span style={{ color: "#C9A96E" }}>{fmtDate(selectedDate)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard
                icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 9h5l-2 5 7-7H9l2-5z"/></svg>}
                label="إجمالي الإجراءات" value={actions.length} sub="عملية تمت بنجاح" color="#C9A96E"
              />
              <StatCard
                icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#2dd4a0" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>}
                label="ساعات النشاط" value={(() => {
                const h = summary?.activeHours ?? 0
                const hours = Math.floor(h)
                const mins = Math.round((h - hours) * 60)
                if (hours === 0) return `${mins} د`
                if (mins === 0) return `${hours} س`
                return `${hours}س ${mins}د`
                  })()} sub="ساعة عمل فعلية" color="#2dd4a0"
              />
              <StatCard
                icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#5b9cf6" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l-2 2"/></svg>}
                label="وقت البدء" value={firstAction ? fmtTime(firstAction.time) : "—"} sub="أول تفاعل اليوم" color="#5b9cf6"
              />
              <StatCard
                icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg>}
                label="وقت الانتهاء" value={lastAction ? fmtTime(lastAction.time) : "—"} sub="آخر تفاعل مسجل" color="#a78bfa"
              />
              <StatCard
                icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h4l2 2h6v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/></svg>}
                label="الأقسام المستخدمة" value={Object.keys(grouped).length} sub="قسم مختلف" color="#fbbf24"
              />
            </div>

            {/* First / Last Action Highlights */}
            {(firstAction || lastAction) && (
              <div className="responsive-grid-halves" style={{ marginBottom: 20 }}>
                {firstAction && (
                  <div style={{ ...S.card, padding: "16px 20px", borderTop: "3px solid #5b9cf6" }}>
                    <div style={{ fontSize: 11, color: "#5b9cf6", fontWeight: 700, marginBottom: 10 }}>أول إجراء تم في هذا اليوم</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#e8edf5", marginBottom: 10, fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "baseline", gap: 6 }}>
                      {fmtTime(firstAction.time)}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ background: getActionStyle(firstAction.action).bg, color: getActionStyle(firstAction.action).color, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {getActionStyle(firstAction.action).label}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>القسم: {entityAr(firstAction.entity)}</span>
                    </div>
                  </div>
                )}
                {lastAction && (
                  <div style={{ ...S.card, padding: "16px 20px", borderTop: "3px solid #a78bfa" }}>
                    <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 10 }}>آخر إجراء تم تسجيله</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#e8edf5", marginBottom: 10, fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "baseline", gap: 6 }}>
                      {fmtTime(lastAction.time)}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: getActionStyle(lastAction.action).bg, color: getActionStyle(lastAction.action).color, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {getActionStyle(lastAction.action).label}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>القسم: {entityAr(lastAction.entity)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main grid */}
            <div className="responsive-grid-main">

              {/* Timeline (Scrollable) */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A96E", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  {Icon.list} السجل الزمني التفصيلي ({actions.length})
                </div>
                <div style={S.card} className="custom-scroll">
                  {actions.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#6b7891", fontSize: 14 }}>
                      لا توجد أي إجراءات مسجلة للمستخدم في هذا اليوم.
                    </div>
                  ) : (
                    actions.map((a, i) => {
                      const st = getActionStyle(a.action)
                      return (
                        <div
                          key={i}
                          style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", transition: "background .2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 65, flexShrink: 0, fontWeight: 700 }}>
                            {fmtTime(a.time)}
                          </span>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color, flexShrink: 0, boxShadow: `0 0 8px ${st.color}40` }} />
                          <span style={{ background: st.bg, color: st.color, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0, minWidth: 70, textAlign: "center" }}>
                            {st.label}
                          </span>
                          <span style={{ fontSize: 13, color: "#e8edf5", fontWeight: 700, flexShrink: 0 }}>{entityAr(a.entity)}</span>
                          
                          {/* الإجراء الفعلي من الباك إند بلون خافت كمرجع إضافي */}
                          <span style={{ fontSize: 11, color: "#6b7891", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1 1 auto" }}>
                            ({a.action})
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Summary by Entity */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A96E", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  {Icon.bar} ملخص النشاط حسب أقسام النظام
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.keys(grouped).length === 0 ? (
                    <div style={{ ...S.card, padding: 50, textAlign: "center", color: "#6b7891", fontSize: 14 }}>لا توجد بيانات للعرض</div>
                  ) : (
                    Object.entries(grouped)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([entity, stats]) => {
                        const pct = Math.round((stats.total / actions.length) * 100)
                        return (
                          <div key={entity} style={{ ...S.card, padding: "16px 18px", borderRight: "3px solid rgba(201,169,110,0.4)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#e8edf5" }}>{entityAr(entity)}</span>
                              <span style={{ fontSize: 16, color: "#C9A96E", fontWeight: 900, fontFamily: "'Cairo',sans-serif" }}>{stats.total} عملية</span>
                            </div>
                            
                            {/* شريط التقدم */}
                            <div style={{ height: 4, background: "#080d16", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #f0c98a, #C9A96E)", borderRadius: 2 }} />
                            </div>
                            
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {stats.create > 0 && <span style={{ fontSize: 10, background: "rgba(52,211,153,.1)", color: "#34d399", padding: "3px 8px", borderRadius: 5, fontWeight: 700 }}>+{stats.create} إضافة</span>}
                              {stats.edit   > 0 && <span style={{ fontSize: 10, background: "rgba(56,189,248,.1)", color: "#38bdf8", padding: "3px 8px", borderRadius: 5, fontWeight: 700 }}>{stats.edit} تعديل</span>}
                              {stats.delete > 0 && <span style={{ fontSize: 10, background: "rgba(248,113,113,.1)", color: "#f87171", padding: "3px 8px", borderRadius: 5, fontWeight: 700 }}>{stats.delete} حذف</span>}
                              {stats.view   > 0 && <span style={{ fontSize: 10, background: "rgba(148,163,184,.1)", color: "#94a3b8", padding: "3px 8px", borderRadius: 5, fontWeight: 700 }}>{stats.view} استعلام</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7891", marginTop: 8, fontWeight: 600 }}>يمثل {pct}% من إجمالي نشاط اليوم</div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!searched && !loading && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "#0d1420", border: "1px solid rgba(201,169,110,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M8 4V2M16 4V2M3 10h18M8 14h2M12 14h4"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#e8edf5", marginBottom: 8 }}>في انتظار تحديد البيانات</div>
            <div style={{ fontSize: 13, color: "#6b7891" }}>اختر مستخدم من القائمة وحدد اليوم المطلوب لعرض التقرير التفصيلي.</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}