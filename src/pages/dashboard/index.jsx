import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  ShoppingCart, Banknote, TrendingUp, Droplet,
  Factory, BarChart3, Users, Package, Medal,
  AlertTriangle, CheckCircle
} from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import API_BASE_URL from '../../config'

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })

const toISO = (d) => d.toISOString().split('T')[0]
const defFrom = () => { const d = new Date(); d.setDate(d.getDate() - 7); return toISO(d) }
const defTo   = () => toISO(new Date())

/* ── Custom Tooltip ─────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const formatted = new Date(label).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-md)',
      borderRadius: 9, padding: '10px 14px',
      fontFamily: "'Cairo',sans-serif", direction: 'rtl', minWidth: 130,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{formatted}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>
        {fmt(payload[0].value)}{' '}
        <span style={{ fontSize: 10, fontWeight: 600 }}>ج.م</span>
      </div>
    </div>
  )
}

/* ── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, unit = 'ج.م', color, icon, sub }) {
  // ── detect negative ──────────────────────────────────
  const isNegative = Number(value ?? 0) < 0
  const activeColor = isNegative ? 'var(--red)' : color

  return (
    <div className="db-stat">
      <div className="db-stat__accent" style={{ background: activeColor }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div className="db-stat__value" style={{ color: activeColor }}>
            {fmt(value)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{unit}</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${activeColor}18`,
          color: activeColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* لو سالب: أيقونة تحذير بدل الأيقونة الأصلية */}
          {isNegative ? <AlertTriangle size={20} /> : icon}
        </div>
      </div>
      <div className="db-stat__label">{label}</div>
      {sub && (
        <div
          className="db-stat__sub"
          style={{
            color: activeColor,
            background: isNegative ? 'var(--red-bg)' : 'transparent',
            padding: isNegative ? '2px 6px' : 0,
            borderRadius: isNegative ? 6 : 0,
            display: 'inline-block',
            fontWeight: 800,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
/* ── Top Customer Row ───────────────────────────────────── */
function CustomerRow({ c, rank, max }) {
  const pct    = max > 0 ? (c.totalSales / max) * 100 : 0
  const medals = [
    <Medal key="1" size={18} color="#FFD700" />, 
    <Medal key="2" size={18} color="#C0C0C0" />, 
    <Medal key="3" size={18} color="#CD7F32" />
  ]
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)', transition: 'background .15s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 28, flexShrink: 0 }}>
        {medals[rank] ?? <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>#{rank + 1}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.name || '—'}
        </div>
        <div style={{ background: 'var(--bg-base)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', borderRadius: 4, transition: 'width .5s' }} />
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)', flexShrink: 0, minWidth: 80, textAlign: 'left' }}>
        {fmt(c.totalSales)}
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>ج.م</span>
      </div>
    </div>
  )
}

/* ── Low Stock Row ──────────────────────────────────────── */
function LowStockRow({ item }) {
  const pct   = Math.min(100, (item.remainingQuantity / 10) * 100)
  const color = pct <= 30 ? 'var(--red)' : pct <= 60 ? 'var(--yellow)' : 'var(--green)'
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)', transition: 'background .15s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--red-bg)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Package size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
        <div style={{ background: 'var(--bg-base)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s' }} />
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0, minWidth: 50, textAlign: 'left' }}>
        {fmt(item.remainingQuantity)}
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>كج</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
function DashboardContent() {
  const navigate = useNavigate()

  const [from,    setFrom]    = useState(defFrom)
  const [to,      setTo]      = useState(defTo)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(
        `${API_BASE_URL}/api/Dashboard?from=${from}&to=${to}`,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      )
      if (res.status === 401) { navigate('/dashboard/session-expired'); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.data?.data ?? json.data ?? json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const ov        = data?.overview     ?? {}
  const chart     = (data?.salesChart  ?? []).map(p => ({ date: p.date, sales: p.totalSales }))
  const customers = data?.topCustomers ?? []
  const lowStock  = data?.lowStock     ?? []
  const maxSale   = Math.max(...customers.map(c => c.totalSales), 1)

  return (
    <div className="db-page db-animate-in">

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>نظرة عامة</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>لوحة التحكم</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>من</label>
            <input type="date" className="db-input" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 140, height: 36, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>إلى</label>
            <input type="date" className="db-input" value={to} onChange={e => setTo(e.target.value)} style={{ width: 140, height: 36, fontSize: 12 }} />
          </div>
          <button className="db-btn db-btn--gold" onClick={load} disabled={loading} style={{ height: 36 }}>
            {loading ? '...' : 'تطبيق'}
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && (
        <div className="db-error-box" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="var(--red)" /> 
          تعذّر تحميل البيانات — {error}
          <button className="db-btn db-btn--ghost db-btn--sm" onClick={load} style={{ marginRight: 'auto' }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────── */}
      {loading && (
        <div className="db-loading">
          <svg className="db-spinner" width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15" stroke="var(--gold-20)" strokeWidth="3" />
            <path d="M18 3a15 15 0 0 1 15 15" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          جاري التحميل…
        </div>
      )}

      {/* ── Content ────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* Stats */}
          <div className="db-stats">
            <StatCard label="إجمالي المبيعات" value={ov.totalSales}         color="var(--gold)"   icon={<ShoppingCart size={20} />} />
            <StatCard label="إجمالي التكلفة"  value={ov.totalCost}          color="var(--red)"    icon={<Banknote size={20} />} />
            <StatCard
              label="صافي الأرباح"
              value={ov.totalProfit}
              color="var(--green)"
              icon={<TrendingUp size={20} />}
              sub={ov.totalSales > 0 ? `هامش ${((ov.totalProfit / ov.totalSales) * 100).toFixed(1)}%` : null}
            />
            <StatCard label="كمية الحليب الواردة" value={ov.totalMilkCollected} color="var(--teal)" icon={<Droplet size={20} />} unit="كجم" />
          </div>

          {/* Supplier Payments Strip */}
          <div className="db-card" style={{ padding: '14px 20px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', color: 'var(--purple)' }}><Factory size={28} /></span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>مدفوعات الموردين في الفترة</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--purple)' }}>
                  {fmt(ov.totalSupplierPayments)}{' '}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>ج.م</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['من', from], ['إلى', to]].map(([lbl, val]) => (
                <div key={lbl} style={{ textAlign: 'center', padding: '6px 16px', borderRadius: 8, background: 'var(--gold-08)', border: '1px solid var(--gold-20)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{lbl}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart + Side panels */}
<div style={{
  display: 'grid',
  gridTemplateColumns: 'clamp(0px, calc(100% - 346px), 1fr) 330px',
  gap: 16,
  alignItems: 'start'
}} className="dash-two-col">
            {/* Area Chart */}
            <div className="db-card" style={{ padding: '20px 20px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>منحنى المبيعات</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>إجمالي يومي للفترة المختارة</div>
                </div>
                <span style={{ opacity: .6, display: 'flex', color: 'var(--text-muted)' }}><BarChart3 size={20} /></span>
              </div>

              {chart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  لا توجد بيانات للفترة المحددة
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#C9A96E" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#C9A96E" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}` }}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'Cairo',sans-serif" }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'Cairo',sans-serif" }}
                      axisLine={false} tickLine={false} width={40}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone" dataKey="sales"
                      stroke="var(--gold)" strokeWidth={2}
                      fill="url(#gGold)" dot={false}
                      activeDot={{ r: 4, fill: 'var(--gold)', stroke: 'var(--bg-elevated)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Top Customers */}
              <div className="db-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>أفضل العملاء</div>
                  <span style={{ display: 'flex', color: 'var(--text-muted)' }}><Users size={18} /></span>
                </div>
                {customers.length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>لا يوجد بيانات</div>
                  : customers.map((c, i) => <CustomerRow key={c.customerId} c={c} rank={i} max={maxSale} />)
                }
              </div>

              {/* Low Stock */}
              <div className="db-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>مخزون منخفض</div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)' }}>
                    {lowStock.length} منتج
                  </span>
                </div>
                {lowStock.length === 0
                  ? <div style={{ padding: '24px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 12, fontWeight: 700 }}><CheckCircle size={16} /> المخزون في وضع جيد</div>
                  : lowStock.map(item => <LowStockRow key={item.productId} item={item} />)
                }
              </div>

            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              .dash-two-col { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardLayout title="لوحة التحكم" breadcrumb="الرئيسية">
      <DashboardContent />
    </DashboardLayout>
  )
}