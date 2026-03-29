import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API_BASE_URL from "../../config"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("ar-EG") : "—"

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—"

const toLocalISO = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ─────────────────────────────────────────────
// Action styles
// ─────────────────────────────────────────────
const ACTION_COLORS = {
  Create: { bg: "rgba(52,211,153,.15)",  color: "#34d399", label: "إضافة" },
  Edit:   { bg: "rgba(56,189,248,.15)",  color: "#38bdf8", label: "تعديل" },
  Delete: { bg: "rgba(248,113,113,.15)", color: "#f87171", label: "حذف"   },
  View:   { bg: "rgba(148,163,184,.12)", color: "#94a3b8", label: "عرض"   },
  Login:  { bg: "rgba(201,169,110,.15)", color: "#C9A96E", label: "دخول"  },
}

const getActionStyle = (action) => {
  const key = Object.keys(ACTION_COLORS).find((k) => action?.includes(k))
  return ACTION_COLORS[key] || { bg: "rgba(167,139,250,.12)", color: "#a78bfa", label: action }
}

// ─────────────────────────────────────────────
// Entity Arabic names
// ─────────────────────────────────────────────
const ENTITY_AR = {
  Lead: "ليد", Leads: "ليدز", Customer: "عميل", Customers: "عملاء",
  User: "مستخدم", Users: "مستخدمون", Enrollment: "تسجيل", Enrollments: "تسجيلات",
  Payment: "دفعة", Payments: "مدفوعات", Course: "كورس", Courses: "كورسات",
  Student: "طالب", Students: "طلاب", Note: "ملاحظة", Notes: "ملاحظات",
}
const entityAr = (e) => ENTITY_AR[e] || e

// ─────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────
const S = {
  wrap: {
    background: "#080d16", minHeight: "100vh", padding: "28px 24px",
    direction: "rtl", color: "#e8edf5",
    fontFamily: "'Cairo',sans-serif", boxSizing: "border-box",
  },
  card: {
    background: "#0d1420", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12,
  },
  lbl: { fontSize: 10, color: "#6b7891", fontWeight: 700, display: "block", marginBottom: 5, letterSpacing: "0.5px" },
  sel: {
    width: "100%", boxSizing: "border-box", height: 38,
    background: "#080d16", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 9, color: "#e8edf5", fontSize: 12,
    padding: "0 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none", cursor: "pointer", appearance: "none",
  },
  btnGold: {
    height: 38, padding: "0 22px", borderRadius: 9, border: "none",
    background: "#C9A96E", color: "#080d16", fontSize: 12,
    fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif",
    display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
  },
  btnGhost: {
    height: 34, padding: "0 14px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
    color: "#6b7891", fontSize: 12, cursor: "pointer",
    fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6,
  },
}

// ─────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#C9A96E", icon }) {
  return (
    <div style={{ ...S.card, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: color, opacity: 0.35 }} />
      <div style={{
        width: 32, height: 32, borderRadius: 8, marginBottom: 10,
        background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#e8edf5", lineHeight: 1, marginBottom: 4, fontFamily: "'Cairo',sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#6b7891", fontWeight: 700, letterSpacing: "0.5px" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// DateRangePicker
// ─────────────────────────────────────────────
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
const DAYS_AR   = ["أح","إث","ثل","أر","خم","جم","سب"]
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0)

function DateRangePicker({ value, onChange }) {
  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [startDate, setStartDate] = useState(value?.start || null)
  const [endDate, setEndDate]     = useState(value?.end   || null)
  const [picking, setPicking]     = useState(false)
  const [hovDate, setHovDate]     = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    setStartDate(value?.start || null)
    setEndDate(value?.end     || null)
  }, [value])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        if (picking) { setStartDate(null); setPicking(false) }
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [picking])

  const fmt     = (d) => d?.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })
  const fmtFull = (d) => d?.toLocaleDateString("ar-EG", { day: "numeric", month: "long" })

  const navMonth = (dir) => {
    let m = viewMonth + dir, y = viewYear
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setViewMonth(m); setViewYear(y)
  }

  const pickDate = (date) => {
    if (!startDate || (!picking && endDate)) {
      setStartDate(date); setEndDate(null); setPicking(true)
    } else if (picking) {
      const [lo, hi] = date < startDate ? [date, startDate] : [startDate, date]
      setStartDate(lo); setEndDate(hi); setPicking(false)
      onChange?.({ start: lo, end: hi })
    }
  }

  const applyRange = () => {
    if (startDate && endDate) { onChange?.({ start: startDate, end: endDate }); setOpen(false) }
  }

  const clearRange = () => {
    setStartDate(null); setEndDate(null); setPicking(false); setHovDate(null)
    onChange?.(null)
  }

  const setShortcut = (days) => {
    const end = new Date(); end.setHours(0, 0, 0, 0)
    const start = new Date(end); start.setDate(end.getDate() - days)
    const lo = days === 0 ? new Date(end) : start
    setStartDate(lo); setEndDate(end); setPicking(false)
    setViewYear(lo.getFullYear()); setViewMonth(lo.getMonth())
    onChange?.({ start: lo, end })
  }

  const setThisMonth = () => {
    const now = new Date()
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(s); setEndDate(e); setPicking(false)
    setViewYear(now.getFullYear()); setViewMonth(now.getMonth())
    onChange?.({ start: s, end: e })
  }

  const setLastMonth = () => {
    const now = new Date()
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const e = new Date(now.getFullYear(), now.getMonth(), 0)
    setStartDate(s); setEndDate(e); setPicking(false)
    setViewYear(s.getFullYear()); setViewMonth(s.getMonth())
    onChange?.({ start: s, end: e })
  }

  const getRangeClass = (date) => {
    if (!startDate) return ""
    const effEnd = picking && hovDate ? hovDate : endDate
    const lo = startDate <= (effEnd || startDate) ? startDate : (effEnd || startDate)
    const hi = startDate <= (effEnd || startDate) ? (effEnd || startDate) : startDate
    const t  = date.getTime()
    if (t === lo.getTime() && t === (hi?.getTime() ?? t)) return "range-start range-end"
    if (t === lo.getTime())                               return "range-start"
    if (hi && t === hi.getTime())                         return "range-end"
    if (hi && t > lo.getTime() && t < hi.getTime())      return "in-range"
    return ""
  }

  const renderMonth = (yr, mo) => {
    const first = new Date(yr, mo, 1).getDay()
    const days  = new Date(yr, mo + 1, 0).getDate()
    const cells = []

    DAYS_AR.forEach((d, i) =>
      cells.push(<div key={`dow-${i}`} style={DS.dow}>{d}</div>)
    )
    for (let i = 0; i < first; i++) cells.push(<div key={`e-${i}`} />)

    for (let d = 1; d <= days; d++) {
      const date    = new Date(yr, mo, d)
      const rc      = getRangeClass(date)
      const isToday = date.getTime() === TODAY.getTime()
      const dayStyle = {
        ...DS.day,
        ...(isToday ? DS.today : {}),
        ...(rc === "in-range"                                          ? DS.inRange     : {}),
        ...(rc.includes("range-start") && rc.includes("range-end")    ? DS.rangeSingle : {}),
        ...(rc.includes("range-start") && !rc.includes("range-end")   ? DS.rangeStart  : {}),
        ...(rc.includes("range-end")   && !rc.includes("range-start") ? DS.rangeEnd    : {}),
      }
      cells.push(
        <div
          key={d}
          style={dayStyle}
          onClick={() => pickDate(date)}
          onMouseEnter={() => setHovDate(date)}
          onMouseLeave={() => setHovDate(null)}
        >
          {d}
        </div>
      )
    }
    return cells
  }

  const rMo2 = viewMonth + 1 > 11 ? 0            : viewMonth + 1
  const rYr2 = viewMonth + 1 > 11 ? viewYear + 1 : viewYear
  const lo      = startDate && endDate ? (startDate < endDate ? startDate : endDate) : startDate
  const hi      = startDate && endDate ? (startDate < endDate ? endDate   : startDate) : null
  const selDays = lo && hi ? Math.round((hi - lo) / 86400000) + 1 : null
  const rangeLabel = lo && hi
    ? `${fmt(lo)}  —  ${fmt(hi)}`
    : lo ? `${fmt(lo)}  —  ...` : null

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        style={{ ...DS.box, ...(open ? DS.boxActive : {}) }}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="3" width="12" height="10" rx="1.5"/>
          <path d="M5 3V2M11 3V2M2 7h12"/>
        </svg>
        <span style={{ ...DS.rangeText, ...(!rangeLabel ? { color: "#3d4a60" } : {}) }}>
          {rangeLabel || "من — إلى"}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={DS.dropdown}>
          {/* Shortcuts */}
          <div style={DS.shortcuts}>
            {[["اليوم",0],["آخر 7 أيام",7],["آخر 14 يوم",14],["آخر 30 يوم",30],["آخر 3 أشهر",90]].map(([lbl, d]) => (
              <div key={lbl} style={DS.shortcut} onClick={() => setShortcut(d)}>{lbl}</div>
            ))}
            <div style={DS.shortcut} onClick={setThisMonth}>هذا الشهر</div>
            <div style={DS.shortcut} onClick={setLastMonth}>الشهر الماضي</div>
          </div>

          {/* Two calendars */}
          <div style={DS.calMonths}>
            {[{ yr: viewYear, mo: viewMonth, side: "left" }, { yr: rYr2, mo: rMo2, side: "right" }].map(({ yr, mo, side }) => (
              <div key={side}>
                <div style={DS.calHeader}>
                  {side === "left"
                    ? <div style={DS.navBtn} onClick={() => navMonth(-1)}>‹</div>
                    : <div style={{ width: 26 }} />}
                  <div style={DS.calTitle}>{MONTHS_AR[mo]} {yr}</div>
                  {side === "right"
                    ? <div style={DS.navBtn} onClick={() => navMonth(1)}>›</div>
                    : <div style={{ width: 26 }} />}
                </div>
                <div style={DS.calGrid}>{renderMonth(yr, mo)}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={DS.calFooter}>
            <div style={{ fontSize: 11, color: "#6b7891", fontFamily: "'Cairo',sans-serif" }}>
              {!lo
                ? "اختر تاريخ البداية"
                : !hi
                  ? <span>من <b style={{ color: "#C9A96E" }}>{fmtFull(lo)}</b> — اختر تاريخ النهاية</span>
                  : <span>من <b style={{ color: "#C9A96E" }}>{fmtFull(lo)}</b> إلى <b style={{ color: "#C9A96E" }}>{fmtFull(hi)}</b> — <b style={{ color: "#C9A96E" }}>{selDays} يوم</b></span>
              }
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={DS.btnClear} onClick={clearRange}>مسح</button>
              <button
                style={{ ...DS.btnApply, ...(!lo || !hi ? { opacity: 0.45, cursor: "not-allowed" } : {}) }}
                onClick={applyRange}
                disabled={!lo || !hi}
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// DateRangePicker styles (DS)
const DS = {
  box: {
    height: 38, background: "#080d16",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9,
    padding: "0 12px", display: "flex", alignItems: "center", gap: 8,
    cursor: "pointer", transition: "border-color .2s", minWidth: 240,
  },
  boxActive:   { borderColor: "rgba(201,169,110,0.25)" },
  rangeText:   { fontSize: 12, color: "#e8edf5", fontFamily: "'Cairo',sans-serif", flex: 1 },
  dropdown: {
    position: "absolute", top: "calc(100% + 6px)", right: 0,
    background: "#0d1420", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: 16, zIndex: 999,
    minWidth: 560, boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
  },
  shortcuts: {
    display: "flex", gap: 6, flexWrap: "wrap",
    marginBottom: 12, paddingBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  shortcut: {
    fontSize: 10, fontWeight: 700, padding: "4px 10px",
    borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)",
    background: "#080d16", color: "#6b7891",
    cursor: "pointer", fontFamily: "'Cairo',sans-serif",
  },
  calMonths: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  calHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calTitle:  { fontSize: 13, fontWeight: 700, color: "#e8edf5", fontFamily: "'Cairo',sans-serif" },
  navBtn: {
    width: 26, height: 26, borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.06)", background: "#080d16",
    color: "#6b7891", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
  },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  dow: { textAlign: "center", fontSize: 9, fontWeight: 700, color: "#3d4a60", padding: "4px 0", fontFamily: "'Cairo',sans-serif" },
  day: {
    textAlign: "center", fontSize: 11, padding: "5px 2px",
    borderRadius: 6, cursor: "pointer", color: "#6b7891",
    fontFamily: "'Cairo',sans-serif", transition: "background .12s, color .12s",
  },
  today:       { color: "#C9A96E", fontWeight: 700 },
  inRange:     { background: "rgba(201,169,110,0.1)", color: "#e8edf5", borderRadius: 0 },
  rangeStart:  { background: "#C9A96E", color: "#080d16", fontWeight: 700, borderRadius: "6px 0 0 6px" },
  rangeEnd:    { background: "#C9A96E", color: "#080d16", fontWeight: 700, borderRadius: "0 6px 6px 0" },
  rangeSingle: { background: "#C9A96E", color: "#080d16", fontWeight: 700, borderRadius: 6 },
  calFooter: {
    marginTop: 12, paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  },
  btnClear: {
    height: 30, padding: "0 12px", borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.06)", background: "transparent",
    color: "#6b7891", fontSize: 11, cursor: "pointer", fontFamily: "'Cairo',sans-serif",
  },
  btnApply: {
    height: 30, padding: "0 14px", borderRadius: 7,
    border: "none", background: "#C9A96E", color: "#080d16",
    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif",
  },
}

// ─────────────────────────────────────────────
// Icons (SVG)
// ─────────────────────────────────────────────
const Icon = {
  back:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 12l4-4-4-4"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="4"/><path d="M10 10l3 3"/></svg>,
  report:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M2 7h12"/></svg>,
  clock:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  flash:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 9h5l-2 5 7-7H9l2-5z"/></svg>,
  folder:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h4l2 2h6v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/></svg>,
  list:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5h12M2 8h8M2 11h5"/></svg>,
  bar:      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="9" width="3" height="5" rx="0.5"/><rect x="6.5" y="6" width="3" height="8" rx="0.5"/><rect x="11" y="3" width="3" height="11" rx="0.5"/></svg>,
  calendar: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M2 7h12"/></svg>,
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function UserActivityReport() {
  const navigate = useNavigate()

  const [users, setUsers]         = useState([])
  const [userId, setUserId]       = useState("")
  const [dateRange, setDateRange] = useState(null)           // { start: Date, end: Date }
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
    if (!userId)              { setError("اختر مستخدم أولاً"); return }
    if (!dateRange?.start)    { setError("اختر نطاق التاريخ"); return }

    setLoading(true); setError(""); setSearched(true)

    const startISO = toLocalISO(dateRange.start)
    const endISO   = toLocalISO(dateRange.end)

    try {
      const [ar, sr] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/reports/user-activity/actions?userId=${userId}&startDate=${startISO}&endDate=${endISO}`,
          { headers: authHeaders() }
        ),
        fetch(
          `${API_BASE_URL}/api/reports/user-activity/daily-summary?userId=${userId}&startDate=${startISO}&endDate=${endISO}`,
          { headers: authHeaders() }
        ),
      ])
      if (ar.ok) { const d = await ar.json(); setActions(d?.data || d || []) }
      if (sr.ok) { const d = await sr.json(); setSummary(d?.data || d) }
    } catch (e) {
      setError("فشل التحميل: " + e.message)
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
    if      (a.action?.includes("Create"))                          acc[key].create++
    else if (a.action?.includes("Edit") || a.action?.includes("Update")) acc[key].edit++
    else if (a.action?.includes("Delete"))                          acc[key].delete++
    else if (a.action?.includes("View") || a.action?.includes("Get"))    acc[key].view++
    else                                                            acc[key].other++
    return acc
  }, {})

  // ── Render ──
  return (
    <div style={S.wrap}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A96E" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#C9A96E", letterSpacing: 3 }}>ZEIIA CRM</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#e8edf5" }}>تقرير نشاط المستخدم</div>
          <div style={{ width: 32, height: 2, background: "#C9A96E", borderRadius: 2, margin: "7px 0 5px" }} />
          <div style={{ fontSize: 11, color: "#3d4a60" }}>تتبع إجراءات المستخدمين يومياً</div>
        </div>
        <button onClick={() => navigate("/dashboard/users")} style={S.btnGhost}>
          {Icon.back} العودة للمستخدمين
        </button>
      </div>

      {/* ── Filter Card ── */}
      <div style={{ ...S.card, padding: 20, marginBottom: 18, position: "relative", overflow: "hidden" }}>
        {/* gold accent bar */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 3, height: "100%", background: "#C9A96E", borderRadius: "0 12px 12px 0" }} />

        <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A96E", marginBottom: 14, display: "flex", alignItems: "center", gap: 7, letterSpacing: 1 }}>
          {Icon.search} بحث في التقرير
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 12, alignItems: "flex-end" }}>
          {/* User select */}
          <div>
            <label style={S.lbl}>المستخدم *</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={S.sel}>
              <option value="">-- اختر مستخدم --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
              ))}
            </select>
          </div>

          {/* Date Range Picker */}
          <div>
            <label style={S.lbl}>نطاق التاريخ *</label>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          {/* Search button */}
          <button onClick={search} disabled={loading} style={{ ...S.btnGold, opacity: loading ? 0.7 : 1 }}>
            {Icon.report}
            {loading ? "جاري التحميل..." : "عرض التقرير"}
          </button>
        </div>

        {error && (
          <div style={{ color: "#f87171", fontSize: 12, marginTop: 10, padding: "8px 12px", background: "rgba(248,113,113,.08)", borderRadius: 7 }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#C9A96E", fontSize: 14 }}>
          جاري تحميل التقرير...
        </div>
      )}

      {/* ── Results ── */}
      {searched && !loading && (
        <>
          {/* User bar */}
          {selectedUser && (
            <div style={{ ...S.card, padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(201,169,110,.12)", border: "1.5px solid rgba(201,169,110,.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#C9A96E", fontWeight: 900, fontSize: 18, flexShrink: 0,
              }}>
                {(selectedUser.fullName || "?")[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e8edf5" }}>{selectedUser.fullName}</div>
                <div style={{ fontSize: 11, color: "#3d4a60" }}>{selectedUser.email}</div>
              </div>
              {dateRange?.start && dateRange?.end && (
                <div style={{ fontSize: 11, color: "#6b7891", background: "#080d16", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6 }}>
                  {Icon.calendar}
                  {fmtDate(dateRange.start)} — {fmtDate(dateRange.end)}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
            <StatCard
              icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 9h5l-2 5 7-7H9l2-5z"/></svg>}
              label="إجمالي الإجراءات" value={actions.length} sub="إجراء في النطاق" color="#C9A96E"
            />
            <StatCard
              icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#2dd4a0" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>}
              label="ساعات النشاط" value={summary?.activeHours ?? 0} sub="ساعة نشطة" color="#2dd4a0"
            />
            <StatCard
              icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#5b9cf6" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l-2 2"/></svg>}
              label="أول إجراء" value={firstAction ? fmtTime(firstAction.time) : "—"} sub="بداية النطاق" color="#5b9cf6"
            />
            <StatCard
              icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg>}
              label="آخر إجراء" value={lastAction ? fmtTime(lastAction.time) : "—"} sub="نهاية النطاق" color="#a78bfa"
            />
            <StatCard
              icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h4l2 2h6v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/></svg>}
              label="أقسام مختلفة" value={Object.keys(grouped).length} sub="قسم تم التعامل معه" color="#fbbf24"
            />
          </div>

          {/* First / Last */}
          {(firstAction || lastAction) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              {firstAction && (
                <div style={{ ...S.card, padding: "14px 16px", borderTop: "2px solid #5b9cf6" }}>
                  <div style={{ fontSize: 10, color: "#5b9cf6", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>أول إجراء في النطاق</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#e8edf5", marginBottom: 8, fontFamily: "'Cairo',sans-serif" }}>{fmtTime(firstAction.time)}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: getActionStyle(firstAction.action).bg, color: getActionStyle(firstAction.action).color, padding: "2px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                      {getActionStyle(firstAction.action).label || firstAction.action}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7891" }}>{entityAr(firstAction.entity)}</span>
                  </div>
                </div>
              )}
              {lastAction && (
                <div style={{ ...S.card, padding: "14px 16px", borderTop: "2px solid #a78bfa" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>آخر إجراء في النطاق</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#e8edf5", marginBottom: 8, fontFamily: "'Cairo',sans-serif" }}>{fmtTime(lastAction.time)}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: getActionStyle(lastAction.action).bg, color: getActionStyle(lastAction.action).color, padding: "2px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                      {getActionStyle(lastAction.action).label || lastAction.action}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7891" }}>{entityAr(lastAction.entity)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>

            {/* Timeline */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7891", marginBottom: 10, display: "flex", alignItems: "center", gap: 7, letterSpacing: 1 }}>
                {Icon.list} سجل الإجراءات التفصيلي ({actions.length})
              </div>
              <div style={{ ...S.card, maxHeight: 540, overflowY: "auto" }}>
                {actions.length === 0 ? (
                  <div style={{ padding: 50, textAlign: "center", color: "#3d4a60", fontSize: 13 }}>
                    لا توجد إجراءات في هذا النطاق
                  </div>
                ) : (
                  actions.map((a, i) => {
                    const st = getActionStyle(a.action)
                    return (
                      <div
                        key={i}
                        style={{ padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10, transition: "background .15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <span style={{ fontSize: 10, color: "#3d4a60", minWidth: 52, flexShrink: 0, fontFamily: "monospace" }}>
                          {fmtTime(a.time)}
                        </span>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
                        <span style={{ background: st.bg, color: st.color, padding: "2px 9px", borderRadius: 6, fontSize: 9, fontWeight: 700, flexShrink: 0, minWidth: 42, textAlign: "center" }}>
                          {st.label || a.action}
                        </span>
                        <span style={{ fontSize: 12, color: "#e8edf5", fontWeight: 600, flexShrink: 0 }}>{entityAr(a.entity)}</span>
                        <span style={{ fontSize: 10, color: "#3d4a60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.action}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Summary */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7891", marginBottom: 10, display: "flex", alignItems: "center", gap: 7, letterSpacing: 1 }}>
                {Icon.bar} ملخص النشاط حسب القسم
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.keys(grouped).length === 0 ? (
                  <div style={{ ...S.card, padding: 40, textAlign: "center", color: "#3d4a60", fontSize: 13 }}>لا توجد بيانات</div>
                ) : (
                  Object.entries(grouped)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([entity, stats]) => {
                      const pct = Math.round((stats.total / actions.length) * 100)
                      return (
                        <div key={entity} style={{ ...S.card, padding: "13px 15px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5" }}>{entityAr(entity)}</span>
                            <span style={{ fontSize: 14, color: "#C9A96E", fontWeight: 900, fontFamily: "'Cairo',sans-serif" }}>{stats.total}</span>
                          </div>
                          <div style={{ height: 3, background: "#080d16", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #C9A96E, #f0c98a)", borderRadius: 2 }} />
                          </div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {stats.create > 0 && <span style={{ fontSize: 9, background: "rgba(52,211,153,.1)", color: "#34d399", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>+{stats.create} إضافة</span>}
                            {stats.edit   > 0 && <span style={{ fontSize: 9, background: "rgba(56,189,248,.1)", color: "#38bdf8", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{stats.edit} تعديل</span>}
                            {stats.delete > 0 && <span style={{ fontSize: 9, background: "rgba(248,113,113,.1)", color: "#f87171", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{stats.delete} حذف</span>}
                            {stats.view   > 0 && <span style={{ fontSize: 9, background: "rgba(148,163,184,.1)", color: "#94a3b8", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{stats.view} عرض</span>}
                          </div>
                          <div style={{ fontSize: 9, color: "#3d4a60", marginTop: 5 }}>{pct}% من إجمالي النشاط</div>
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
        <div style={{ textAlign: "center", padding: 80 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "#0d1420", border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d4a60" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M8 4V2M16 4V2M3 10h18M8 14h2M12 14h4"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6b7891", marginBottom: 6 }}>اختر مستخدم ونطاق التاريخ</div>
          <div style={{ fontSize: 12, color: "#3d4a60" }}>لعرض تقرير النشاط التفصيلي</div>
        </div>
      )}
    </div>
  )
}