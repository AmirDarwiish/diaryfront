import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import API_BASE_URL from "../../config"

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

const fmt = (d) => d ? new Date(d).toLocaleDateString("ar-EG") : "—"
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—"

const ACTION_COLORS = {
  Create: { bg: "rgba(52,211,153,.12)", color: "#34d399", label: "إضافة" },
  Edit:   { bg: "rgba(56,189,248,.12)", color: "#38bdf8", label: "تعديل" },
  Delete: { bg: "rgba(248,113,113,.12)", color: "#f87171", label: "حذف" },
  View:   { bg: "rgba(148,163,184,.12)", color: "#94a3b8", label: "عرض" },
  Login:  { bg: "rgba(201,169,110,.12)", color: "#C9A96E", label: "دخول" },
}

const getActionStyle = (action) => {
  const key = Object.keys(ACTION_COLORS).find(k => action?.includes(k))
  return ACTION_COLORS[key] || { bg: "rgba(167,139,250,.12)", color: "#a78bfa", label: action }
}

const S = {
  wrap: { background: "#0f172a", minHeight: "100vh", padding: "24px 20px", direction: "rtl", color: "#f1f5f9", fontFamily: "'Cairo',sans-serif", boxSizing: "border-box" },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: 12 },
  lbl:  { fontSize: 11, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 5 },
  inp:  { width: "100%", boxSizing: "border-box", height: 38, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, padding: "0 11px", fontFamily: "'Cairo',sans-serif", outline: "none" },
  sel:  { width: "100%", boxSizing: "border-box", height: 38, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, padding: "0 11px", fontFamily: "'Cairo',sans-serif", outline: "none", cursor: "pointer" },
  btnGold:  { height: 38, padding: "0 20px", borderRadius: 8, border: "none", background: "#C9A96E", color: "#0f172a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" },
  btnGhost: { height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" },
}

/* ── Stat Card ── */
function StatCard({ label, value, sub, color = "#C9A96E" }) {
  return (
    <div style={{ ...S.card, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 3, height: "100%", background: color }} />
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

/* ── Main Page ── */
export default function UserActivityReport() {
  const navigate = useNavigate()
  const [users, setUsers]     = useState([])
  const [userId, setUserId]   = useState("")
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0])
  const [actions, setActions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [searched, setSearched] = useState(false)

  /* load users */
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/users`, { headers: authHeaders() })
        if (r.ok) { const d = await r.json(); setUsers(Array.isArray(d) ? d : d?.data || []) }
      } catch {}
    })()
  }, [])

  const search = async () => {
    if (!userId) { setError("اختر مستخدم أولاً"); return }
    if (!date)   { setError("اختر التاريخ"); return }
    setLoading(true); setError(""); setSearched(true)
    try {
      const [ar, sr] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reports/user-activity/actions?userId=${userId}&date=${date}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/reports/user-activity/daily-summary?userId=${userId}&date=${date}`, { headers: authHeaders() }),
      ])
      if (ar.ok) { const d = await ar.json(); setActions(d?.data || d || []) }
      if (sr.ok) { const d = await sr.json(); setSummary(d?.data || d) }
    } catch (e) { setError("فشل التحميل: " + e.message) }
    finally { setLoading(false) }
  }

  const selectedUser = users.find(u => u.id === parseInt(userId))

  /* group actions by entity */
  const grouped = actions.reduce((acc, a) => {
    const key = a.entity || "أخرى"
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div style={S.wrap}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C9A96E" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A96E", letterSpacing: 2 }}>ZEIIA CRM</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>تقارير نشاط المستخدمين</div>
          <div style={{ width: 36, height: 2, background: "#C9A96E", borderRadius: 2, margin: "5px 0" }} />
        </div>
        <button onClick={() => navigate("/dashboard")} style={{ ...S.btnGhost, display: "flex", alignItems: "center", gap: 6 }}>
          ← العودة للداشبورد
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={S.lbl}>المستخدم *</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} style={S.sel}>
              <option value="">-- اختر مستخدم --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>التاريخ *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.inp, colorScheme: "dark" }} />
          </div>
          <button onClick={search} disabled={loading} style={{ ...S.btnGold, height: 38, minWidth: 100 }}>
            {loading ? "..." : "عرض التقرير"}
          </button>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 10, padding: "6px 10px", background: "rgba(248,113,113,.08)", borderRadius: 7 }}>{error}</div>}
      </div>

      {/* Results */}
      {searched && !loading && (
        <>
          {/* User Info */}
          {selectedUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "14px 18px", ...S.card }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,169,110,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A96E", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                {(selectedUser.fullName || "?")[0]}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{selectedUser.fullName}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{selectedUser.email} · {fmt(date)}</div>
              </div>
            </div>
          )}

          {/* Stats */}
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard label="إجمالي الإجراءات" value={summary.actionsCount ?? 0} sub="إجراء في اليوم" color="#C9A96E" />
              <StatCard label="ساعات النشاط" value={summary.activeHours ?? 0} sub="ساعة نشطة" color="#34d399" />
              <StatCard label="المجموعات" value={Object.keys(grouped).length} sub="قسم مختلف" color="#38bdf8" />
            </div>
          )}

          {/* Timeline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Actions List */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>سجل الإجراءات ({actions.length})</div>
              <div style={{ ...S.card, maxHeight: 520, overflowY: "auto" }}>
                {actions.length === 0
                  ? <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>لا توجد إجراءات في هذا اليوم</div>
                  : actions.map((a, i) => {
                    const style = getActionStyle(a.action)
                    return (
                      <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(51,65,85,.4)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "#475569", minWidth: 50, flexShrink: 0 }}>{fmtTime(a.time)}</span>
                        <span style={{ background: style.bg, color: style.color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{style.label || a.action}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.entity}</span>
                      </div>
                    )
                  })
                }
              </div>
            </div>

            {/* Grouped by Entity */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>توزيع النشاط حسب القسم</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.keys(grouped).length === 0
                  ? <div style={{ ...S.card, padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>لا توجد بيانات</div>
                  : Object.entries(grouped)
                    .sort((a, b) => b[1].length - a[1].length)
                    .map(([entity, acts]) => {
                      const pct = Math.round((acts.length / actions.length) * 100)
                      return (
                        <div key={entity} style={{ ...S.card, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{entity}</span>
                            <span style={{ fontSize: 12, color: "#C9A96E", fontWeight: 700 }}>{acts.length} إجراء</span>
                          </div>
                          <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #C9A96E, #f0c98a)", borderRadius: 3, transition: "width .6s ease" }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{pct}% من إجمالي النشاط</div>
                        </div>
                      )
                    })
                }
              </div>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#C9A96E", fontSize: 14 }}>جاري تحميل التقرير...</div>
      )}

      {!searched && (
        <div style={{ textAlign: "center", padding: 60, color: "#334155", fontSize: 14 }}>
          اختر مستخدم وتاريخ لعرض تقرير النشاط
        </div>
      )}
    </div>
  )
}