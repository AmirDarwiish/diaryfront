import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from './DashboardLayout'
import milkCollectionsService from '../../services/milkCollections.service'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/* ══════════════════════════════════════════════════════════
   SVG ICONS
══════════════════════════════════════════════════════════ */
const Ico = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const IcoPlus     = () => <Ico><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>
const IcoX        = () => <Ico><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>
const IcoMilk     = () => <Ico size={20}><path d="M7 2h10l1 10H6L7 2z"/><path d="M6 12v5a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-5"/></Ico>
const IcoDroplet  = () => <Ico size={16}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></Ico>
const IcoCoin     = () => <Ico size={16}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Ico>
const IcoTruck    = () => <Ico size={16}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ico>
const IcoCalendar = () => <Ico size={16}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>
const IcoRefresh  = () => <Ico size={16}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Ico>
const IcoChevronR = () => <Ico size={14}><polyline points="9 18 15 12 9 6"/></Ico>
const IcoChevronL = () => <Ico size={14}><polyline points="15 18 9 12 15 6"/></Ico>
const IcoCheck    = () => <Ico size={14}><polyline points="20 6 9 17 4 12"/></Ico>
const IcoPDF      = () => <Ico size={14}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Ico>

/* ══════════════════════════════════════════════════════════
   PDF TEMPLATE — مخفي في الـ DOM
══════════════════════════════════════════════════════════ */
function PdfTemplate({ row, innerRef }) {
  if (!row) return null

  const date = row.date
    ? new Date(row.date.split('.')[0]).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  const fields = [
    { label: 'المورد',      value: row.supplier || '—' },
    { label: 'المنتج',      value: row.product  || '—' },
    { label: 'تاريخ التوريد', value: date },
    { label: 'الكمية',      value: `${parseFloat(row.quantity || 0).toLocaleString('ar-EG')} لتر` },
    { label: 'سعر اللتر',   value: `${parseFloat(row.pricePerUnit || 0).toLocaleString('ar-EG')} ج.م` },
    { label: 'الإجمالي',    value: `${parseFloat(row.totalPrice || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م` },
    { label: 'نسبة الدهون', value: row.fatPercentage != null ? `${row.fatPercentage}%` : '—' },
    { label: 'ملاحظات',     value: row.notes || '—' },
  ]

  return (
    <div
      ref={innerRef}
      style={{
        position: 'fixed', top: '-9999px', left: '-9999px',
        width: 794, background: '#fff',
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        direction: 'rtl', padding: '48px 56px', color: '#1a1a2e',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, borderBottom: '3px solid #C9A96E', paddingBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>أمر استلام حليب خام</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>رقم: #{row.id}</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>التاريخ: {date}</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#C9A96E' }}>ZEIIA ERP</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>نظام إدارة المصنع</div>
        </div>
      </div>

      {/* Fields Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {fields.map((f, i) => (
            <tr key={f.label} style={{ background: i % 2 === 0 ? '#f9f9fb' : '#fff' }}>
              <td style={{ padding: '12px 16px', fontWeight: 700, color: '#374151', width: '35%', borderBottom: '1px solid #e5e7eb' }}>
                {f.label}
              </td>
              <td style={{ padding: '12px 16px', color: '#111827', borderBottom: '1px solid #e5e7eb' }}>
                {f.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Highlight */}
      <div style={{ marginTop: 24, background: '#fef9f0', border: '1.5px solid #C9A96E', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#374151' }}>إجمالي المستحق للمورد</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#C9A96E' }}>
          {parseFloat(row.totalPrice || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
        </span>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
        <span>طُبع من نظام ZEIIA ERP</span>
        <span>{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`db-toast db-toast--${type === 'ok' ? 'ok' : 'err'}`}>
      {msg}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MILK COLLECTION FORM (Modal)
══════════════════════════════════════════════════════════ */
function MilkCollectionForm({ onSuccess, onCancel, suppliers = [] }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    supplier_id: '', collection_date: today,
    quantity_liters: '', price_per_liter: '',
    fat_percentage: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const totalAmount = (
    parseFloat(form.quantity_liters || 0) * parseFloat(form.price_per_liter || 0)
  ).toFixed(2)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.supplier_id)     return setError('اختر المورد')
    if (!form.quantity_liters) return setError('أدخل الكمية')
    if (!form.price_per_liter) return setError('أدخل سعر اللتر')
    if (!form.collection_date) return setError('أدخل تاريخ التوريد')

    setError('')
    setLoading(true)
    try {
      await milkCollectionsService.create({
        supplierId: parseInt(form.supplier_id),
        productId:  1,
        quantity:   parseFloat(form.quantity_liters),
        price:      parseFloat(form.price_per_liter),
      })
      onSuccess()
    } catch (e) {
      setError(e?.message || 'حدث خطأ، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="db-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="db-modal" style={{ maxWidth: 520 }}>
        <div className="db-modal__accent" />

        <div className="db-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <IcoMilk />
            </div>
            <div>
              <div className="db-modal__title">توريد جديد</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>تسجيل عملية استلام حليب خام</div>
            </div>
          </div>
          <button className="db-modal__close" onClick={onCancel}><IcoX /></button>
        </div>

        {error && <div className="db-error-box" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="db-label">المورد *</label>
            <select className="db-select" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
              <option value="">— اختر المورد —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name || s.enName}</option>)}
            </select>
          </div>

          <div>
            <label className="db-label">تاريخ التوريد *</label>
            <input type="date" className="db-input" value={form.collection_date} onChange={e => set('collection_date', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="db-label">الكمية (لتر) *</label>
              <input type="number" className="db-input" placeholder="0.00" min="0" step="0.01" value={form.quantity_liters} onChange={e => set('quantity_liters', e.target.value)} />
            </div>
            <div>
              <label className="db-label">السعر / لتر (ج.م) *</label>
              <input type="number" className="db-input" placeholder="0.00" min="0" step="0.01" value={form.price_per_liter} onChange={e => set('price_per_liter', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="db-label">نسبة الدهون %</label>
              <input type="number" className="db-input" placeholder="اختياري" min="0" max="100" step="0.1" value={form.fat_percentage} onChange={e => set('fat_percentage', e.target.value)} />
            </div>
            <div>
              <label className="db-label">الإجمالي المحسوب</label>
              <div style={{ height: 40, padding: '0 12px', display: 'flex', alignItems: 'center', background: 'var(--gold-08)', border: '1px solid var(--gold-20)', borderRadius: 9, color: 'var(--gold)', fontSize: 14, fontWeight: 800 }}>
                {parseFloat(totalAmount).toLocaleString('ar-EG')} ج.م
              </div>
            </div>
          </div>

          <div>
            <label className="db-label">ملاحظات</label>
            <textarea className="db-textarea" placeholder="أي ملاحظات إضافية..." rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button className="db-btn db-btn--ghost" onClick={onCancel} disabled={loading}>إلغاء</button>
          <button className="db-btn db-btn--gold" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><svg className="db-spinner" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>جارٍ الحفظ...</>
              : <><IcoCheck /> حفظ التوريد</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   STATS CARDS
══════════════════════════════════════════════════════════ */
function StatsRow({ stats, loading }) {
  const cards = [
    { label: 'كمية اليوم',     value: loading ? '—' : (stats.totalQuantity || 0).toLocaleString('ar-EG'),    unit: 'لتر',      color: 'var(--teal)',   bg: 'var(--teal-bg)',   icon: <IcoDroplet /> },
    { label: 'تكلفة اليوم',    value: loading ? '—' : (stats.totalAmount || 0).toLocaleString('ar-EG'),      unit: 'ج.م',      color: 'var(--gold)',   bg: 'var(--gold-12)',   icon: <IcoCoin /> },
    { label: 'عدد التوريدات',  value: loading ? '—' : (stats.collectionsCount || 0).toLocaleString('ar-EG'), unit: 'توريد',    color: 'var(--purple)', bg: 'var(--purple-bg)', icon: <IcoTruck /> },
    {
      label: 'متوسط السعر',
      value: loading ? '—' : (stats.totalQuantity ? (stats.totalAmount / stats.totalQuantity).toFixed(2) : '0.00'),
      unit: 'ج.م/لتر', color: 'var(--green)', bg: 'var(--green-bg)', icon: <IcoCalendar />,
    },
  ]

  return (
    <div className="db-stats">
      {cards.map(c => (
        <div key={c.label} className="db-stat">
          <div className="db-stat__accent" style={{ background: c.color }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div className="db-stat__value" style={{ color: c.color }}>
                {c.value}
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>{c.unit}</span>
              </div>
              <div className="db-stat__label">{c.label}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>
              {c.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TABLE
══════════════════════════════════════════════════════════ */
function MilkCollectionsTable({ data, loading, pagination, onPageChange, onExportPDF }) {
  const { page, pageSize, total } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (loading) {
    return (
      <div className="db-loading">
        <svg className="db-spinner" width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity=".2"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        جارٍ التحميل...
      </div>
    )
  }

  if (!data.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, color: 'var(--text-muted)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gold-08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          <IcoMilk />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)' }}>لا توجد توريدات</div>
        <div style={{ fontSize: 12 }}>ابدأ بتسجيل أول توريد حليب</div>
      </div>
    )
  }

  const pages = []
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <>
      <div className="db-table-wrap leads-tbl">
        <table className="db-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المورد</th>
              <th>تاريخ التوريد</th>
              <th>الكمية (لتر)</th>
              <th>السعر / لتر</th>
              <th>الإجمالي</th>
              <th>الدهون %</th>
              <th>ملاحظات</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || idx}>
                <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {(page - 1) * pageSize + idx + 1}
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{row.supplier}</div>
                </td>
                <td style={{ color: 'var(--text-sec)', fontSize: 12 }}>
                  {row.date
                    ? new Date(row.date.split('.')[0]).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: 'var(--teal)' }}>
                    {parseFloat(row.quantity || 0).toLocaleString('ar-EG')}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 3 }}>لتر</span>
                </td>
                <td style={{ color: 'var(--text-sec)' }}>
                  {parseFloat(row.pricePerUnit || 0).toLocaleString('ar-EG')} ج.م
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: 'var(--gold)' }}>
                    {(row.totalPrice || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 3 }}>ج.م</span>
                </td>
                <td>
                  {row.fatPercentage != null
                    ? <span className="db-badge db-badge--interested">{row.fatPercentage}%</span>
                    : <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>—</span>
                  }
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 180 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                    {row.notes || '—'}
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => onExportPDF(row)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                  >
                    <IcoPDF /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="db-pagination">
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            عرض {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} من {total.toLocaleString('ar-EG')}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button className="db-page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}><IcoChevronR /></button>
            {start > 1 && (
              <>
                <button className="db-page-btn" onClick={() => onPageChange(1)}>1</button>
                {start > 2 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>…</span>}
              </>
            )}
            {pages.map(p => (
              <button key={p} className={`db-page-btn${p === page ? ' db-page-btn--active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
            ))}
            {end < totalPages && (
              <>
                {end < totalPages - 1 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>…</span>}
                <button className="db-page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
              </>
            )}
            <button className="db-page-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}><IcoChevronL /></button>
          </div>
        </div>
      )}
    </>
  )
}

/* ══════════════════════════════════════════════════════════
   PAGE — MAIN
══════════════════════════════════════════════════════════ */
export default function MilkCollectionsPage() {
  const [data,        setData]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [statsLoad,   setStatsLoad]   = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [suppliers,   setSuppliers]   = useState([])
  const [toast,       setToast]       = useState(null)
  const [pagination,  setPagination]  = useState({ page: 1, pageSize: 10, total: 0 })
  const [dailyStats,  setDailyStats]  = useState({ totalQuantity: 0, totalAmount: 0, collectionsCount: 0 })
  const [filterDate,  setFilterDate]  = useState(new Date().toISOString().split('T')[0])
  const [pdfRow,      setPdfRow]      = useState(null)
  const [pdfLoading,  setPdfLoading]  = useState(false)

  // ref للـ template المخفي
  const pdfRef = useRef(null)

  /* ── Fetch collections ── */
  const fetchData = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const res = await milkCollectionsService.getAll(pg, pagination.pageSize)
      setData(res?.data || [])
      setPagination(prev => ({ ...prev, page: pg, total: res?.total ?? 0 }))
    } catch (e) {
      console.error('fetchData:', e)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize])

  /* ── Fetch daily stats ── */
  const fetchStats = useCallback(async (date) => {
    setStatsLoad(true)
    try {
      const stats = await milkCollectionsService.getDaily(date)
      setDailyStats({
        totalQuantity:    stats?.totalQuantity    ?? stats?.total_quantity ?? 0,
        totalAmount:      stats?.totalAmount      ?? stats?.total_amount   ?? 0,
        collectionsCount: stats?.collectionsCount ?? stats?.count          ?? 0,
      })
    } catch (e) {
      console.error('fetchStats:', e)
    } finally {
      setStatsLoad(false)
    }
  }, [])

  /* ── Fetch suppliers ── */
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await milkCollectionsService.getSuppliers()
      setSuppliers(Array.isArray(res) ? res : res?.data || [])
    } catch (e) {
      console.error('fetchSuppliers:', e)
    }
  }, [])

  useEffect(() => {
    fetchData(1)
    fetchStats(filterDate)
    fetchSuppliers()
  }, [])

  useEffect(() => { fetchStats(filterDate) }, [filterDate])

  /* ══════════════════════════════════════════════════════
     ✅ PDF EXPORT — html2canvas بيرسم الـ template كصورة
        بعدين jsPDF يحطها في PDF — عربي 100% صح
  ══════════════════════════════════════════════════════ */
  const handleExportPDF = useCallback(async (row) => {
    setPdfRow(row)
    setPdfLoading(true)
    setToast({ msg: 'جارٍ إنشاء الـ PDF...', type: 'ok' })

    // خلي React يرندر الـ template الأول
    await new Promise(r => setTimeout(r, 200))

    try {
      const el = pdfRef.current
      if (!el) throw new Error('template not found')

      const canvas = await html2canvas(el, {
        scale: 2,           // دقة عالية
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pdfW  = pdf.internal.pageSize.getWidth()
      const pdfH  = pdf.internal.pageSize.getHeight()
      const ratio = canvas.height / canvas.width
      const imgH  = pdfW * ratio

      // لو أطول من A4 → نقسم على صفحات
      if (imgH <= pdfH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH)
      } else {
        let yPos    = 0
        let remaining = canvas.height
        const pageH = canvas.width * (pdfH / pdfW)

        while (remaining > 0) {
          const sliceH = Math.min(pageH, remaining)
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width  = canvas.width
          sliceCanvas.height = sliceH
          sliceCanvas.getContext('2d').drawImage(canvas, 0, yPos, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

          if (yPos > 0) pdf.addPage()
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceH * (pdfW / canvas.width))

          yPos      += sliceH
          remaining -= sliceH
        }
      }

      pdf.save(`امر استلام-${row.id}.pdf`)
      setToast({ msg: 'تم تصدير الـ PDF بنجاح ✓', type: 'ok' })
    } catch (err) {
      console.error('PDF error:', err)
      setToast({ msg: 'فشل إنشاء الـ PDF', type: 'err' })
    } finally {
      setPdfRow(null)
      setPdfLoading(false)
    }
  }, [])

  /* ── on success ── */
  const handleSuccess = () => {
    setShowForm(false)
    setToast({ msg: 'تم تسجيل التوريد بنجاح ✓', type: 'ok' })
    fetchData(1)
    fetchStats(filterDate)
  }

  const headerActions = (
    <button className="db-btn db-btn--gold" onClick={() => setShowForm(true)}>
      <IcoPlus /> توريد جديد
    </button>
  )

  return (
    <DashboardLayout title="التوريدات" breadcrumb="الموردون والخامات" headerActions={headerActions}>
      <div className="db-page db-animate-in">

        {/* Toast */}
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

        {/* PDF Hidden Template */}
        <PdfTemplate row={pdfRow} innerRef={pdfRef} />

        {/* Modal Form */}
        {showForm && (
          <MilkCollectionForm
            suppliers={suppliers}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Date Filter + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex' }}><IcoCalendar /></span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>إحصائيات يوم:</span>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif", outline: 'none', cursor: 'pointer' }}
            />
          </div>
          <button className="db-btn db-btn--ghost db-btn--sm" onClick={() => { fetchData(1); fetchStats(filterDate) }} style={{ gap: 6 }}>
            <IcoRefresh /> تحديث
          </button>
        </div>

        {/* Stats */}
        <StatsRow stats={dailyStats} loading={statsLoad} />

        {/* Table Card */}
        <div className="db-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
                <IcoTruck />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>سجل التوريدات</div>
                {!loading && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {pagination.total.toLocaleString('ar-EG')} عملية توريد
                  </div>
                )}
              </div>
            </div>
          </div>

          <MilkCollectionsTable
            data={data}
            loading={loading}
            pagination={pagination}
            onPageChange={p => fetchData(p)}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}