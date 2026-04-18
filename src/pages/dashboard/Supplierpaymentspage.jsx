      import { useState, useEffect, useCallback } from 'react'
      import { useNavigate } from 'react-router-dom'
      import {
        Factory, Plus, Search, Eye, ChevronRight, ChevronLeft,
        AlertTriangle, CheckCircle, X, Loader2, Wallet, Receipt,
        TrendingDown, Calendar, FileText
      } from 'lucide-react'
      import DashboardLayout from './DashboardLayout'
      import API_BASE_URL from '../../config'

      /* ── Auth ──────────────────────────────────────────────── */
      const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      })

      /* ── Helpers ───────────────────────────────────────────── */
      const fmt = (n) =>
        Number(n ?? 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })

      const fmtDate = (d) =>
        d
          ? new Date(d + (d.endsWith('Z') ? '' : 'Z')).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—'

      /* ══════════════════════════════════════════════════════════
        TOAST
      ══════════════════════════════════════════════════════════ */
      function Toast({ msg, type, onDone }) {
        useEffect(() => {
          const t = setTimeout(onDone, 3000)
          return () => clearTimeout(t)
        }, [onDone])
        return (
          <div
            className={`db-toast db-toast--${type === 'ok' ? 'ok' : 'err'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {type === 'ok' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {msg}
          </div>
        )
      }

      /* ══════════════════════════════════════════════════════════
        PAYMENT DETAIL MODAL
      ══════════════════════════════════════════════════════════ */
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
          <div className="db-overlay" onClick={onClose}>
            <div
              className="db-modal"
              style={{ maxWidth: 480 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="db-modal__accent" />

              <div className="db-modal__header">
                <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={18} color="var(--gold)" />
                  تفاصيل الدفعة
                </span>
                <button className="db-modal__close" onClick={onClose}>×</button>
              </div>

              {loading && (
                <div className="db-loading" style={{ padding: 48 }}>
                  <Loader2 size={32} className="db-spinner" color="var(--gold)" />
                  جاري التحميل…
                </div>
              )}

              {error && (
                <div className="db-error-box" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              {data && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* ID Badge */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--gold-08)', border: '1px solid var(--gold-20)',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>رقم الدفعة</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>#{data.id}</span>
                  </div>

                  {/* Fields */}
                  {[
                    { icon: <Factory size={15} />, label: 'المورد', value: data.supplier },
                    { icon: <Wallet size={15} />, label: 'المبلغ', value: `${fmt(data.amount)} ج.م`, color: 'var(--red)' },
                    { icon: <Calendar size={15} />, label: 'التاريخ', value: fmtDate(data.date) },
                    { icon: <FileText size={15} />, label: 'ملاحظات', value: data.notes || '—' },
                  ].map(({ icon, label, value, color }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        padding: '10px 14px', borderRadius: 9,
                        background: 'var(--bg-base)', border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--text)', wordBreak: 'break-word' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }

      /* ══════════════════════════════════════════════════════════
        CREATE PAYMENT MODAL
      ══════════════════════════════════════════════════════════ */
      function CreateModal({ suppliers, paymentMethods, onClose, onSuccess }) {
        const [form, setForm] = useState({
          supplierId: '',
          amount: '',
          paymentMethodId: '',
          notes: '',
        })
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
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
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
          <div className="db-overlay" onClick={onClose}>
            <div
              className="db-modal"
              style={{ maxWidth: 460 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="db-modal__accent" />

              <div className="db-modal__header">
                <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={18} color="var(--gold)" />
                  تسجيل دفعة جديدة
                </span>
                <button className="db-modal__close" onClick={onClose}>×</button>
              </div>

              {error && (
                <div className="db-error-box" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Supplier */}
                <div>
                  <label className="db-label">المورد *</label>
                  <select className="db-select" value={form.supplierId} onChange={set('supplierId')}>
                    <option value="">— اختر المورد —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="db-label">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    className="db-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={set('amount')}
                  />
                </div>

                {/* Payment Method */}
                {paymentMethods.length > 0 && (
                  <div>
                    <label className="db-label">طريقة الدفع</label>
                    <select className="db-select" value={form.paymentMethodId} onChange={set('paymentMethodId')}>
                      <option value="">— اختياري —</option>
                      {paymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="db-label">ملاحظات</label>
                  <textarea
                    className="db-textarea"
                    placeholder="أي تفاصيل إضافية…"
                    value={form.notes}
                    onChange={set('notes')}
                    style={{ minHeight: 72 }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button className="db-btn db-btn--ghost" onClick={onClose} disabled={loading}>
                    إلغاء
                  </button>
                  <button className="db-btn db-btn--gold" onClick={submit} disabled={loading}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Loader2 size={14} className="db-spinner" /> جاري الحفظ…
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={15} /> تسجيل الدفعة
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      /* ══════════════════════════════════════════════════════════
        STAT MINI CARD
      ══════════════════════════════════════════════════════════ */
      function MiniStat({ label, value, unit = 'ج.م', color, icon }) {
        return (
          <div className="db-stat">
            <div className="db-stat__accent" style={{ background: color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div className="db-stat__value" style={{ color, fontSize: 22 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{unit}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${color}18`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>
            </div>
            <div className="db-stat__label">{label}</div>
          </div>
        )
      }

      /* ══════════════════════════════════════════════════════════
        PAYMENTS TABLE
      ══════════════════════════════════════════════════════════ */
      function PaymentsTable({ payments, onView }) {
        if (payments.length === 0)
          return (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Factory size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>لا توجد دفعات</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>ابدأ بتسجيل أول دفعة للمورد</div>
            </div>
          )

        return (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المورد</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>ملاحظات</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
                        background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 6,
                      }}>
                        #{p.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'var(--purple-bg)', color: 'var(--purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontWeight: 900, fontSize: 12,
                        }}>
                          {(p.supplier || '؟')[0]}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.supplier || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: 14 }}>
                        {fmt(p.amount)}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginRight: 3 }}>ج.م</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>
                        {fmtDate(p.date)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12, color: 'var(--text-muted)',
                        maxWidth: 180, display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="db-btn db-btn--ghost db-btn--sm"
                        onClick={() => onView(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Eye size={13} /> عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      /* ══════════════════════════════════════════════════════════
        MAIN PAGE CONTENT
      ══════════════════════════════════════════════════════════ */
      function SupplierPaymentsContent() {
        const navigate = useNavigate()

        const [payments, setPayments]         = useState([])
        const [total, setTotal]               = useState(0)
        const [page, setPage]                 = useState(1)
        const [pageSize]                      = useState(10)
        const [loading, setLoading]           = useState(true)
        const [error, setError]               = useState(null)

        const [search, setSearch]             = useState('')
        const [suppliers, setSuppliers]       = useState([])
        const [paymentMethods, setPaymentMethods] = useState([])

        const [showCreate, setShowCreate]     = useState(false)
        const [viewId, setViewId]             = useState(null)
        const [toast, setToast]               = useState(null)

        /* ── Load payments ─────────────────────────────────── */
        const loadPayments = useCallback(async (pg = page) => {
          setLoading(true)
          setError(null)
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
          } catch (e) {
            setError(e.message)
          } finally {
            setLoading(false)
          }
        }, [page, pageSize, navigate])

        /* ── Load suppliers (for create modal) ────────────── */
        const loadSuppliers = async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/Suppliers?pageSize=200`, {
              headers: authHeaders(),
            })
            if (res.ok) {
              const json = await res.json()
              const d = json.data ?? json
              setSuppliers(d.data ?? d ?? [])
            }
          } catch {}
        }

        /* ── Load payment methods ─────────────────────────── */
        const loadPaymentMethods = async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/PaymentMethods`, {
              headers: authHeaders(),
            })
            if (res.ok) {
              const json = await res.json()
              setPaymentMethods(json.data ?? json ?? [])
            }
          } catch {}
        }

        useEffect(() => {
          loadPayments(page)
        }, [page])

        useEffect(() => {
          loadSuppliers()
          loadPaymentMethods()
        }, [])

        /* ── Derived stats ─────────────────────────────────── */
        const totalAmount  = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
        const totalPages   = Math.max(1, Math.ceil(total / pageSize))

        /* ── Search filter (client-side on current page) ─── */
        const filtered = search.trim()
          ? payments.filter(
              (p) =>
                (p.supplier ?? '').includes(search) ||
                String(p.id).includes(search) ||
                (p.notes ?? '').includes(search)
            )
          : payments

        const handleSuccess = (msg) => {
          setToast({ msg, type: 'ok' })
          setPage(1)
          loadPayments(1)
        }

        return (
          <div className="db-page db-animate-in">

            {/* Toast */}
            {toast && (
              <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
            )}

            {/* Modals */}
            {viewId && <PaymentModal paymentId={viewId} onClose={() => setViewId(null)} />}
            {showCreate && (
              <CreateModal
                suppliers={suppliers}
                paymentMethods={paymentMethods}
                onClose={() => setShowCreate(false)}
                onSuccess={handleSuccess}
              />
            )}

            {/* ── Page Header ────────────────────────────────── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22,
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>
                  الموردون
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Factory size={22} color="var(--purple)" />
                  مدفوعات الموردين
                </h1>
              </div>

              <button
                className="db-btn db-btn--gold"
                onClick={() => setShowCreate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Plus size={16} /> دفعة جديدة
              </button>
            </div>

            {/* ── Stats Strip ────────────────────────────────── */}
            <div className="db-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
              <MiniStat
                label="إجمالي الدفعات (الصفحة)"
                value={fmt(totalAmount)}
                color="var(--red)"
                icon={<TrendingDown size={18} />}
              />
              <MiniStat
                label="عدد السجلات الكلي"
                value={total.toLocaleString('ar-EG')}
                unit="دفعة"
                color="var(--purple)"
                icon={<Receipt size={18} />}
              />
              <MiniStat
                label="الموردون المسجلون"
                value={suppliers.length.toLocaleString('ar-EG')}
                unit="مورد"
                color="var(--teal)"
                icon={<Factory size={18} />}
              />
            </div>

            {/* ── Main Card ──────────────────────────────────── */}
            <div className="db-card">

              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap',
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <Search size={14} style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    className="db-input"
                    placeholder="بحث بالمورد، رقم الدفعة، الملاحظات…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingRight: 36 }}
                  />
                </div>
                {search && (
                  <button
                    className="db-btn db-btn--ghost db-btn--sm"
                    onClick={() => setSearch('')}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <X size={13} /> مسح
                  </button>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {filtered.length} نتيجة
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="db-error-box" style={{ margin: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> {error}
                  <button
                    className="db-btn db-btn--ghost db-btn--sm"
                    onClick={() => loadPayments(page)}
                    style={{ marginRight: 'auto' }}
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {/* Loading */}
              {loading && !error && (
                <div className="db-loading">
                  <Loader2 size={32} className="db-spinner" color="var(--gold)" />
                  جاري تحميل الدفعات…
                </div>
              )}

              {/* Table */}
              {!loading && !error && (
                <PaymentsTable payments={filtered} onView={setViewId} />
              )}

              {/* Pagination */}
              {!loading && !error && totalPages > 1 && (
                <div className="db-pagination">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
                    صفحة {page} من {totalPages} — {total} دفعة
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                      className="db-page-btn"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      title="السابق"
                    >
                      <ChevronRight size={14} />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pg
                      if (totalPages <= 5) pg = i + 1
                      else if (page <= 3) pg = i + 1
                      else if (page >= totalPages - 2) pg = totalPages - 4 + i
                      else pg = page - 2 + i
                      return (
                        <button
                          key={pg}
                          className={`db-page-btn${page === pg ? ' db-page-btn--active' : ''}`}
                          onClick={() => setPage(pg)}
                        >
                          {pg.toLocaleString('ar-EG')}
                        </button>
                      )
                    })}

                    <button
                      className="db-page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      title="التالي"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      /* ══════════════════════════════════════════════════════════
        EXPORT
      ══════════════════════════════════════════════════════════ */
      export default function SupplierPaymentsPage() {
        return (
          <DashboardLayout
            title="مدفوعات الموردين"
            breadcrumb="الموردون / المدفوعات"
          >
            <SupplierPaymentsContent />
          </DashboardLayout>
        )
      }