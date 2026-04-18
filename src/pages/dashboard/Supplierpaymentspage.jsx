import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Factory, Plus, Search, Eye, ChevronRight, ChevronLeft,
  AlertTriangle, CheckCircle, X, Loader2, Wallet, Receipt,
  TrendingDown, Calendar, FileText
} from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import API_BASE_URL from '../../config'

/* ── Auth ──────────────────────────────────────────────────── */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

/* ── Helpers ───────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n ?? 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })

const fmtDate = (d) =>
  d
    ? new Date(d + (d.endsWith('Z') ? '' : 'Z')).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

/* ══════════════════════════════════════════════════════════════
  TOAST
══════════════════════════════════════════════════════════════ */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className={`sp-toast sp-toast--${type === 'ok' ? 'ok' : 'err'}`}>
      {type === 'ok' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
  PAYMENT DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function PaymentModal({ paymentId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/SupplierPayments/${paymentId}`, {
          headers: authHeaders(),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json.data ?? json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [paymentId])

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal__bar" />
        <div className="sp-modal__header">
          <span className="sp-modal__title">
            <Receipt size={17} color="var(--gold)" /> تفاصيل الدفعة
          </span>
          <button className="sp-modal__close" onClick={onClose}>×</button>
        </div>

        {loading && (
          <div className="sp-center" style={{ padding: '48px 0' }}>
            <Loader2 size={28} className="db-spinner" color="var(--gold)" />
            <span>جاري التحميل…</span>
          </div>
        )}

        {error && (
          <div className="sp-error-box" style={{ margin: '14px 18px' }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {data && (
          <div className="sp-detail-list">
            <div className="sp-id-badge">
              <span className="sp-id-badge__label">رقم الدفعة</span>
              <span className="sp-id-badge__val">#{data.id}</span>
            </div>
            {[
              { icon: <Factory size={14} />, label: 'المورد',  value: data.supplier },
              { icon: <Wallet size={14} />,  label: 'المبلغ',  value: `${fmt(data.amount)} ج.م`, highlight: true },
              { icon: <Calendar size={14} />,label: 'التاريخ', value: fmtDate(data.date) },
              { icon: <FileText size={14} />,label: 'ملاحظات', value: data.notes || '—' },
            ].map(({ icon, label, value, highlight }) => (
              <div key={label} className="sp-detail-row">
                <span className="sp-detail-icon">{icon}</span>
                <div className="sp-detail-body">
                  <div className="sp-detail-label">{label}</div>
                  <div className={`sp-detail-val${highlight ? ' sp-detail-val--red' : ''}`}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
  CREATE PAYMENT MODAL
══════════════════════════════════════════════════════════════ */
function CreateModal({ suppliers, paymentMethods, onClose, onSuccess }) {
  const [form, setForm] = useState({ supplierId: '', amount: '', paymentMethodId: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.supplierId) return setError('يرجى اختيار المورد')
    if (!form.amount || Number(form.amount) <= 0) return setError('يرجى إدخال مبلغ صحيح')
    setError(null)
    setLoading(true)
    try {
      const body = {
        supplierId: Number(form.supplierId),
        amount: Number(form.amount),
        notes: form.notes || null,
      }
      if (form.paymentMethodId) body.paymentMethodId = Number(form.paymentMethodId)
      const res = await fetch(`${API_BASE_URL}/api/SupplierPayments`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`)
      onSuccess('تم تسجيل الدفعة بنجاح ✓')
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal__bar" />
        <div className="sp-modal__header">
          <span className="sp-modal__title">
            <Plus size={17} color="var(--gold)" /> تسجيل دفعة جديدة
          </span>
          <button className="sp-modal__close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="sp-error-box" style={{ margin: '12px 18px 0' }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="sp-form">
          <div className="sp-field">
            <label className="sp-label">المورد *</label>
            <select className="db-select" value={form.supplierId} onChange={set('supplierId')}>
              <option value="">— اختر المورد —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="sp-field">
            <label className="sp-label">المبلغ (ج.م) *</label>
            <input
              type="number" className="db-input"
              placeholder="0.00" min="0" step="0.01"
              value={form.amount} onChange={set('amount')}
            />
          </div>

          {paymentMethods.length > 0 && (
            <div className="sp-field">
              <label className="sp-label">طريقة الدفع</label>
              <select className="db-select" value={form.paymentMethodId} onChange={set('paymentMethodId')}>
                <option value="">— اختياري —</option>
                {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          <div className="sp-field">
            <label className="sp-label">ملاحظات</label>
            <textarea
              className="db-textarea" placeholder="أي تفاصيل إضافية…"
              value={form.notes} onChange={set('notes')}
              style={{ minHeight: 72 }}
            />
          </div>

          <div className="sp-modal-actions">
            <button className="db-btn db-btn--ghost sp-modal-cancel" onClick={onClose} disabled={loading}>إلغاء</button>
            <button className="db-btn db-btn--gold sp-modal-submit" onClick={submit} disabled={loading}>
              {loading
                ? <span className="sp-btn-inner"><Loader2 size={14} className="db-spinner" /> جاري الحفظ…</span>
                : <span className="sp-btn-inner"><Plus size={14} /> تسجيل الدفعة</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
  STAT CARD
══════════════════════════════════════════════════════════════ */
function MiniStat({ label, value, unit = 'ج.م', color, icon }) {
  return (
    <div className="sp-stat">
      <div className="sp-stat__bar" style={{ background: color }} />
      <div className="sp-stat__top">
        <div>
          <div className="sp-stat__val" style={{ color }}>{value}</div>
          <div className="sp-stat__unit">{unit}</div>
        </div>
        <div className="sp-stat__icon" style={{ background: `${color}18`, color }}>{icon}</div>
      </div>
      <div className="sp-stat__label">{label}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
  PAYMENTS LIST — mobile cards + desktop table
══════════════════════════════════════════════════════════════ */
function PaymentsList({ payments, onView }) {
  if (payments.length === 0)
    return (
      <div className="sp-empty">
        <Factory size={36} style={{ opacity: 0.18, marginBottom: 10 }} />
        <div className="sp-empty__title">لا توجد دفعات</div>
        <div className="sp-empty__sub">ابدأ بتسجيل أول دفعة للمورد</div>
      </div>
    )

  return (
    <>
      {/* Mobile cards */}
      <div className="sp-cards">
        {payments.map((p) => (
          <div key={p.id} className="sp-payment-card">
            <div className="sp-payment-card__head">
              <div className="sp-payment-card__avatar">{(p.supplier || '؟')[0]}</div>
              <div className="sp-payment-card__info">
                <span className="sp-payment-card__name">{p.supplier || '—'}</span>
                <span className="sp-payment-card__date">{fmtDate(p.date)}</span>
              </div>
              <div className="sp-payment-card__id">#{p.id}</div>
            </div>
            <div className="sp-payment-card__body">
              <div className="sp-payment-card__amount">
                {fmt(p.amount)} <span className="sp-payment-card__currency">ج.م</span>
              </div>
              {p.notes && <div className="sp-payment-card__notes">{p.notes}</div>}
            </div>
            <button className="db-btn db-btn--ghost sp-payment-card__view" onClick={() => onView(p.id)}>
              <Eye size={13} /> عرض التفاصيل
            </button>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="sp-table-wrap db-table-wrap">
        <table className="db-table">
          <thead>
            <tr>
              <th>#</th><th>المورد</th><th>المبلغ</th>
              <th>التاريخ</th><th>ملاحظات</th><th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td><span className="sp-id-pill">#{p.id}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="sp-avatar">{(p.supplier || '؟')[0]}</div>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.supplier || '—'}</span>
                  </div>
                </td>
                <td>
                  <span className="sp-amount-cell">
                    {fmt(p.amount)}<span className="sp-amount-unit">ج.م</span>
                  </span>
                </td>
                <td><span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{fmtDate(p.date)}</span></td>
                <td>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.notes || '—'}
                  </span>
                </td>
                <td>
                  <button className="db-btn db-btn--ghost db-btn--sm" onClick={() => onView(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={13} /> عرض
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
  MAIN PAGE
══════════════════════════════════════════════════════════════ */
function SupplierPaymentsContent() {
  const navigate = useNavigate()

  const [payments, setPayments]             = useState([])
  const [total, setTotal]                   = useState(0)
  const [page, setPage]                     = useState(1)
  const [pageSize]                          = useState(10)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [search, setSearch]                 = useState('')
  const [suppliers, setSuppliers]           = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [showCreate, setShowCreate]         = useState(false)
  const [viewId, setViewId]                 = useState(null)
  const [toast, setToast]                   = useState(null)

  const loadPayments = useCallback(async (pg = page) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/SupplierPayments?page=${pg}&pageSize=${pageSize}`,
        { headers: authHeaders() }
      )
      if (res.status === 401) { navigate('/dashboard/session-expired'); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const d = json.data ?? json
      setPayments(d.data ?? [])
      setTotal(d.total ?? 0)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, pageSize, navigate])

  const loadSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Suppliers?pageSize=200`, { headers: authHeaders() })
      if (res.ok) { const json = await res.json(); const d = json.data ?? json; setSuppliers(d.data ?? d ?? []) }
    } catch {}
  }

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/PaymentMethods`, { headers: authHeaders() })
      if (res.ok) { const json = await res.json(); setPaymentMethods(json.data ?? json ?? []) }
    } catch {}
  }

  useEffect(() => { loadPayments(page) }, [page])
  useEffect(() => { loadSuppliers(); loadPaymentMethods() }, [])

  const totalAmount = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalPages  = Math.max(1, Math.ceil(total / pageSize))

  const filtered = search.trim()
    ? payments.filter(p =>
        (p.supplier ?? '').includes(search) ||
        String(p.id).includes(search) ||
        (p.notes ?? '').includes(search))
    : payments

  const handleSuccess = (msg) => {
    setToast({ msg, type: 'ok' })
    setPage(1)
    loadPayments(1)
  }

  return (
    <div className="db-page db-animate-in">

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {viewId && <PaymentModal paymentId={viewId} onClose={() => setViewId(null)} />}
      {showCreate && (
        <CreateModal
          suppliers={suppliers} paymentMethods={paymentMethods}
          onClose={() => setShowCreate(false)} onSuccess={handleSuccess}
        />
      )}

      {/* Header */}
      <div className="sp-page-header">
        <div>
          <div className="sp-page-header__bread">الموردون</div>
          <h1 className="sp-page-header__title">
            <Factory size={20} color="var(--purple)" /> مدفوعات الموردين
          </h1>
        </div>
        <button className="db-btn db-btn--gold sp-new-btn" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> دفعة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="sp-stats-grid">
        <MiniStat label="إجمالي الدفعات (الصفحة)" value={fmt(totalAmount)} color="var(--red)"    icon={<TrendingDown size={17} />} />
        <MiniStat label="عدد السجلات الكلي"        value={total.toLocaleString('ar-EG')} unit="دفعة" color="var(--purple)" icon={<Receipt size={17} />} />
        <MiniStat label="الموردون المسجلون"         value={suppliers.length.toLocaleString('ar-EG')} unit="مورد" color="var(--teal)" icon={<Factory size={17} />} />
      </div>

      {/* Card */}
      <div className="db-card" style={{ overflow: 'hidden' }}>

        <div className="sp-toolbar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} className="sp-search-icon" />
            <input
              type="text" className="db-input sp-search-input"
              placeholder="بحث بالمورد، رقم الدفعة، الملاحظات…"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sp-toolbar-right">
            {search && (
              <button className="db-btn db-btn--ghost db-btn--sm" onClick={() => setSearch('')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <X size={13} /> مسح
              </button>
            )}
            <span className="sp-count">{filtered.length} نتيجة</span>
          </div>
        </div>

        {error && (
          <div className="sp-error-box" style={{ margin: '12px 16px' }}>
            <AlertTriangle size={15} /> {error}
            <button className="db-btn db-btn--ghost db-btn--sm" onClick={() => loadPayments(page)} style={{ marginRight: 'auto' }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="sp-center" style={{ padding: '56px 0' }}>
            <Loader2 size={28} className="db-spinner" color="var(--gold)" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>جاري تحميل الدفعات…</span>
          </div>
        )}

        {!loading && !error && <PaymentsList payments={filtered} onView={setViewId} />}

        {!loading && !error && totalPages > 1 && (
          <div className="sp-pagination">
            <span className="sp-pagination__info">صفحة {page} من {totalPages} — {total} دفعة</span>
            <div className="sp-pagination__btns">
              <button className="db-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronRight size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg
                if (totalPages <= 5) pg = i + 1
                else if (page <= 3) pg = i + 1
                else if (page >= totalPages - 2) pg = totalPages - 4 + i
                else pg = page - 2 + i
                return (
                  <button key={pg} className={`db-page-btn${page === pg ? ' db-page-btn--active' : ''}`} onClick={() => setPage(pg)}>
                    {pg.toLocaleString('ar-EG')}
                  </button>
                )
              })}
              <button className="db-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Scoped Styles ══ */}
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .db-animate-in { animation: fadeIn .3s ease-out; }
        .db-spinner    { animation: spin .7s linear infinite; }

        .sp-toast {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 9999; display: flex; align-items: center; gap: 8px;
          padding: 11px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
          box-shadow: 0 4px 20px rgba(0,0,0,.15); white-space: nowrap;
          animation: fadeIn .25s ease-out;
        }
        .sp-toast--ok  { background: var(--green-bg); color: var(--green); border: 1px solid rgba(52,211,153,.3); }
        .sp-toast--err { background: var(--red-bg);   color: var(--red);   border: 1px solid rgba(248,113,113,.25); }

        .sp-page-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .sp-page-header__bread { font-size: 11px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
        .sp-page-header__title { font-size: clamp(17px, 4vw, 22px); font-weight: 900; color: var(--text); line-height: 1.2; display: flex; align-items: center; gap: 10px; margin: 0; }
        .sp-new-btn { display: flex; align-items: center; gap: 7px; }

        .sp-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px; }
        @media (min-width: 600px) { .sp-stats-grid { grid-template-columns: repeat(3, 1fr); } }

        .sp-stat { background: var(--bg-elevated, var(--bg-base)); border: 1px solid var(--border); border-radius: 12px; padding: 13px 14px; position: relative; overflow: hidden; }
        .sp-stat__bar { position: absolute; top: 0; right: 0; width: 3px; height: 100%; border-radius: 0 12px 12px 0; }
        .sp-stat__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .sp-stat__val { font-size: clamp(15px, 3.5vw, 21px); font-weight: 900; line-height: 1.1; }
        .sp-stat__unit { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
        .sp-stat__icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-stat__label { font-size: 10px; color: var(--text-muted); font-weight: 700; }

        .sp-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 14px; border-bottom: 1px solid var(--border); }
        .sp-search-icon { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .sp-search-input { padding-right: 34px !important; }
        .sp-toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .sp-count { font-size: 11px; color: var(--text-muted); font-weight: 700; white-space: nowrap; }

        .sp-error-box { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; background: var(--red-bg); color: var(--red); border: 1px solid rgba(248,113,113,.2); }
        .sp-empty { padding: 56px 20px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; }
        .sp-empty__title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .sp-empty__sub   { font-size: 12px; }
        .sp-center { display: flex; flex-direction: column; align-items: center; gap: 10px; }

        /* Mobile cards */
        .sp-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; }
        @media (min-width: 640px) { .sp-cards { display: none; } }

        .sp-payment-card { border: 1px solid var(--border); border-radius: 10px; padding: 13px 14px; }
        .sp-payment-card__head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .sp-payment-card__avatar { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; background: var(--purple-bg); color: var(--purple); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; }
        .sp-payment-card__info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .sp-payment-card__name { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sp-payment-card__date { font-size: 11px; color: var(--text-muted); }
        .sp-payment-card__id   { font-size: 11px; font-weight: 800; color: var(--text-muted); background: var(--bg-base); padding: 2px 7px; border-radius: 5px; white-space: nowrap; }
        .sp-payment-card__body { margin-bottom: 10px; }
        .sp-payment-card__amount { font-size: 20px; font-weight: 900; color: var(--red); }
        .sp-payment-card__currency { font-size: 12px; color: var(--text-muted); font-weight: 700; }
        .sp-payment-card__notes { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
        .sp-payment-card__view { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; height: 38px; }

        /* Desktop table */
        .sp-table-wrap { display: none; }
        @media (min-width: 640px) { .sp-table-wrap { display: block; } }
        .sp-id-pill { font-size: 11px; font-weight: 800; color: var(--text-muted); background: var(--bg-base); padding: 2px 8px; border-radius: 6px; }
        .sp-avatar { width: 30px; height: 30px; border-radius: 8px; background: var(--purple-bg); color: var(--purple); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900; font-size: 12px; }
        .sp-amount-cell { font-weight: 800; color: var(--red); font-size: 14px; }
        .sp-amount-unit { font-size: 10px; color: var(--text-muted); font-weight: 600; margin-right: 3px; }

        .sp-pagination { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--border); }
        .sp-pagination__info { font-size: 12px; color: var(--text-muted); font-weight: 700; }
        .sp-pagination__btns { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }

        /* Modal — bottom sheet on mobile */
        .sp-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.55); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
        @media (min-width: 520px) { .sp-overlay { align-items: center; padding: 16px; } }

        .sp-modal { background: var(--bg, #fff); color: var(--text, #000); width: 100%; max-width: 480px; border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom, 16px); box-shadow: 0 -8px 40px rgba(0,0,0,.2); max-height: 92dvh; overflow-y: auto; animation: fadeIn .25s ease-out; }
        @media (min-width: 520px) { .sp-modal { border-radius: 14px; box-shadow: 0 20px 40px rgba(0,0,0,.25); } }

        .sp-modal__bar { width: 36px; height: 4px; border-radius: 2px; background: var(--border); margin: 10px auto 0; }
        @media (min-width: 520px) { .sp-modal__bar { display: none; } }

        .sp-modal__header { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px 13px; border-bottom: 1px solid var(--border); }
        .sp-modal__title  { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: var(--text); }
        .sp-modal__close  { background: none; border: none; color: var(--text-muted); font-size: 22px; line-height: 1; cursor: pointer; padding: 0 4px; transition: color .15s; }
        .sp-modal__close:hover { color: var(--red); }

        .sp-detail-list { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
        .sp-id-badge { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: var(--gold-08); border: 1px solid var(--gold-20); }
        .sp-id-badge__label { font-size: 12px; color: var(--text-muted); font-weight: 700; }
        .sp-id-badge__val   { font-size: 18px; font-weight: 900; color: var(--gold); }

        .sp-detail-row { display: flex; gap: 12px; align-items: flex-start; padding: 10px 13px; border-radius: 9px; background: var(--bg-base); border: 1px solid var(--border); }
        .sp-detail-icon { color: var(--text-muted); margin-top: 2px; flex-shrink: 0; }
        .sp-detail-body { flex: 1; min-width: 0; }
        .sp-detail-label { font-size: 10px; color: var(--text-muted); font-weight: 700; margin-bottom: 2px; }
        .sp-detail-val   { font-size: 14px; font-weight: 700; color: var(--text); word-break: break-word; }
        .sp-detail-val--red { color: var(--red); }

        .sp-form { display: flex; flex-direction: column; gap: 14px; padding: 16px 18px; }
        .sp-field { display: flex; flex-direction: column; gap: 5px; }
        .sp-label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
        .sp-modal-actions { display: flex; gap: 8px; margin-top: 4px; }
        .sp-modal-cancel  { flex: 1; }
        .sp-modal-submit  { flex: 2; }
        .sp-btn-inner { display: flex; align-items: center; gap: 6px; }
      `}</style>
    </div>
  )
}

/* ══ Export ══ */
export default function SupplierPaymentsPage() {
  return (
    <DashboardLayout title="مدفوعات الموردين" breadcrumb="الموردون / المدفوعات">
      <SupplierPaymentsContent />
    </DashboardLayout>
  )
}