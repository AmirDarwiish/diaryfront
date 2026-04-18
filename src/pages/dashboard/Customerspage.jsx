import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Eye, Pencil, Trash2,
  AlertTriangle, CheckCircle, X, Loader2, Wallet,
  Phone, MapPin, ChevronRight, ChevronLeft,
  TrendingDown, RotateCcw, Receipt
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
  d ? new Date(d).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : '—'

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className={`db-toast db-toast--${type === 'ok' ? 'ok' : 'err'}`}
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {type === 'ok' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   CONFIRM DELETE MODAL
══════════════════════════════════════════════════════════ */
function ConfirmModal({ customer, onConfirm, onClose, loading }) {
  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal__accent" style={{ background: 'var(--red)' }} />
        <div className="db-modal__header">
          <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={18} color="var(--red)" /> تأكيد الحذف
          </span>
          <button className="db-modal__close" onClick={onClose}>×</button>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.7 }}>
          هل أنت متأكد من حذف العميل{' '}
          <strong style={{ color: 'var(--text)' }}>{customer.name}</strong>؟
          <br />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            سيتم تعطيل الحساب فقط ولن يُحذف نهائياً.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="db-btn db-btn--ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button className="db-btn db-btn--danger" onClick={onConfirm} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? <Loader2 size={14} className="db-spinner" /> : <Trash2 size={14} />}
            {loading ? 'جاري الحذف…' : 'تأكيد الحذف'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   BALANCE MODAL
══════════════════════════════════════════════════════════ */
function BalanceModal({ customer, onClose }) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Customers/${customer.id}/balance`, { headers: authHeaders() })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const raw = json?.data?.data ?? json?.data ?? json
        const val = typeof raw === 'object' && raw !== null
          ? (raw.balance ?? raw.currentBalance ?? raw.value ?? 0)
          : raw
        setBalance(val)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [customer.id])

  const isPos = Number(balance) >= 0

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal__accent" />
        <div className="db-modal__header">
          <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={18} color="var(--gold)" /> رصيد العميل
          </span>
          <button className="db-modal__close" onClick={onClose}>×</button>
        </div>
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--teal-bg)', color: 'var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 22, fontWeight: 900,
          }}>
            {(customer.name || '؟')[0]}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{customer.name}</div>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 size={28} className="db-spinner" color="var(--gold)" /></div>}
          {error && <div className="db-error-box" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}><AlertTriangle size={15} /> {error}</div>}
          {balance !== null && !loading && (
            <div style={{
              margin: '16px 0', padding: '20px', borderRadius: 12,
              background: isPos ? 'var(--green-bg)' : 'var(--red-bg)',
              border: `1px solid ${isPos ? 'rgba(52,211,153,.25)' : 'rgba(248,113,113,.25)'}`,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>الرصيد الحالي</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: isPos ? 'var(--green)' : 'var(--red)' }}>
                {fmt(balance)}
                <span style={{ fontSize: 14, fontWeight: 600, marginRight: 6, color: 'var(--text-muted)' }}>ج.م</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>
                {Number(balance) > 0 ? '⬆ مستحق على العميل'
                  : Number(balance) < 0 ? '⬇ مستحق للعميل'
                  : 'الحساب متوازن'}
              </div>
            </div>
          )}
        </div>
        <button className="db-btn db-btn--ghost" style={{ width: '100%' }} onClick={onClose}>إغلاق</button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PAYMENT MODAL
══════════════════════════════════════════════════════════ */
function PaymentModal({ customer, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return setError('يرجى إدخال مبلغ صحيح')
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/Customers/payment`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ customerId: customer.id, amount: Number(amount), notes: notes || null }),
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
      <div className="db-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal__accent" />
        <div className="db-modal__header">
          <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={18} color="var(--gold)" /> تسجيل دفعة — {customer.name}
          </span>
          <button className="db-modal__close" onClick={onClose}>×</button>
        </div>
        {error && <div className="db-error-box" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={15} /> {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="db-label">المبلغ (ج.م) *</label>
            <input type="number" className="db-input" placeholder="0.00" min="0" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="db-label">ملاحظات</label>
            <textarea className="db-textarea" placeholder="أي تفاصيل إضافية…"
              value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 72 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="db-btn db-btn--ghost" onClick={onClose} disabled={loading}>إلغاء</button>
            <button className="db-btn db-btn--gold" onClick={submit} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? <><Loader2 size={14} className="db-spinner" /> جاري الحفظ…</> : <><Receipt size={14} /> تسجيل الدفعة</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════════════════ */
function DetailModal({ customerId, onClose, onEdit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Customers/${customerId}`, { headers: authHeaders() })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json?.data?.data ?? json?.data ?? json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [customerId])

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal__accent" />
        <div className="db-modal__header">
          <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={18} color="var(--gold)" /> تفاصيل العميل
          </span>
          <button className="db-modal__close" onClick={onClose}>×</button>
        </div>
        {loading && <div className="db-loading" style={{ padding: 48 }}><Loader2 size={32} className="db-spinner" color="var(--gold)" /></div>}
        {error && <div className="db-error-box" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={15} /> {error}</div>}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12,
              background: 'var(--gold-08)', border: '1px solid var(--gold-20)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--teal-bg)', color: 'var(--teal)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, flexShrink: 0,
              }}>{(data.name || '؟')[0]}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>{data.name}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, marginTop: 4, padding: '2px 8px', borderRadius: 10,
                  background: data.isActive !== false ? 'var(--green-bg)' : 'var(--red-bg)',
                  color: data.isActive !== false ? 'var(--green)' : 'var(--red)',
                }}>
                  {data.isActive !== false ? <CheckCircle size={11} /> : <X size={11} />}
                  {data.isActive !== false ? 'نشط' : 'غير نشط'}
                </div>
              </div>
              <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>#ID</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>{data.id}</div>
              </div>
            </div>

            {[
              { icon: <Phone size={15} />, label: 'الهاتف', value: data.phone || '—' },
              { icon: <MapPin size={15} />, label: 'العنوان', value: data.address || '—' },
              { icon: <Wallet size={15} />, label: 'الرصيد الحالي', value: `${fmt(data.currentBalance)} ج.م`, color: (data.currentBalance ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' },
              { icon: <TrendingDown size={15} />, label: 'تاريخ الإنشاء', value: fmtDate(data.createdAt) },
            ].map(({ icon, label, value, color }) => (
              <div key={label} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 14px', borderRadius: 9,
                background: 'var(--bg-base)', border: '1px solid var(--border)',
              }}>
                <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="db-btn db-btn--ghost" style={{ flex: 1 }} onClick={onClose}>إغلاق</button>
              <button className="db-btn db-btn--gold"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => { onEdit(data); onClose() }}>
                <Pencil size={14} /> تعديل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   CREATE / EDIT MODAL
══════════════════════════════════════════════════════════ */
function FormModal({ editData, onClose, onSuccess }) {
  const isEdit = !!editData
  const [form, setForm] = useState({
    name: editData?.name || '',
    phone: editData?.phone || '',
    address: editData?.address || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) return setError('اسم العميل مطلوب')
    setError(null)
    setLoading(true)
    try {
      const url = isEdit ? `${API_BASE_URL}/api/Customers/${editData.id}` : `${API_BASE_URL}/api/Customers`
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`)
      onSuccess(isEdit ? 'تم تحديث بيانات العميل ✓' : 'تم إضافة العميل بنجاح ✓')
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal__accent" />
        <div className="db-modal__header">
          <span className="db-modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEdit ? <Pencil size={18} color="var(--gold)" /> : <Plus size={18} color="var(--gold)" />}
            {isEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </span>
          <button className="db-modal__close" onClick={onClose}>×</button>
        </div>
        {error && <div className="db-error-box" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={15} /> {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="db-label">اسم العميل *</label>
            <input className="db-input" placeholder="مثال: محمد أحمد" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="db-label">رقم الهاتف</label>
            <input className="db-input" placeholder="01xxxxxxxxx" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="db-label">العنوان</label>
            <input className="db-input" placeholder="المدينة، الشارع…" value={form.address} onChange={set('address')} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="db-btn db-btn--ghost" onClick={onClose} disabled={loading}>إلغاء</button>
            <button className="db-btn db-btn--gold" onClick={submit} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading
                ? <><Loader2 size={14} className="db-spinner" /> جاري الحفظ…</>
                : <>{isEdit ? <Pencil size={14} /> : <Plus size={15} />} {isEdit ? 'حفظ التعديلات' : 'إضافة العميل'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TABLE
══════════════════════════════════════════════════════════ */
function CustomersTable({ customers, onView, onEdit, onDelete, onBalance, onPayment, onRestore, showInactive }) {
  if (customers.length === 0)
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Users size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 700 }}>لا يوجد عملاء</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>ابدأ بإضافة أول عميل</div>
      </div>
    )

  return (
    <div className="db-table-wrap">
      <table className="db-table">
        <thead>
          <tr>
            <th>#</th>
            <th>العميل</th>
            <th>الهاتف</th>
            <th>الرصيد الحالي</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
                  background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 6,
                }}>#{c.id}</span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'var(--teal-bg)', color: 'var(--teal)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontWeight: 900, fontSize: 13,
                  }}>{(c.name || '؟')[0]}</div>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
                    {c.isActive === false && (
                      <span style={{
                        display: 'inline-block', marginRight: 6, fontSize: 10, fontWeight: 700,
                        padding: '1px 6px', borderRadius: 6,
                        background: 'var(--red-bg)', color: 'var(--red)',
                      }}>غير نشط</span>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <span style={{ fontSize: 12, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Phone size={12} color="var(--text-muted)" />
                  {c.phone || '—'}
                </span>
              </td>
              <td>
                <span style={{
                  fontWeight: 800, fontSize: 14,
                  color: (c.currentBalance ?? 0) >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {fmt(c.currentBalance)}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginRight: 3 }}>ج.م</span>
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="db-btn db-btn--ghost db-btn--sm"
                    onClick={() => onView(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    title="عرض التفاصيل">
                    <Eye size={13} /> عرض
                  </button>
                  <button className="db-btn db-btn--ghost db-btn--sm"
                    onClick={() => onBalance(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    title="الرصيد">
                    <Wallet size={13} />
                  </button>
                  <button className="db-btn db-btn--ghost db-btn--sm"
                    onClick={() => onPayment(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--teal)', borderColor: 'var(--teal-bg)' }}
                    title="تسجيل دفعة">
                    <Receipt size={13} />
                  </button>
                  <button className="db-btn db-btn--ghost db-btn--sm"
                    onClick={() => onEdit(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', borderColor: 'var(--gold-20)' }}
                    title="تعديل">
                    <Pencil size={13} />
                  </button>
                  {c.isActive === false ? (
                    <button className="db-btn db-btn--ghost db-btn--sm"
                      onClick={() => onRestore(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)', borderColor: 'var(--green-bg)' }}
                      title="استعادة">
                      <RotateCcw size={13} />
                    </button>
                  ) : (
                    <button className="db-btn db-btn--danger db-btn--sm"
                      onClick={() => onDelete(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      title="حذف">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN CONTENT
══════════════════════════════════════════════════════════ */
function CustomersContent() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('true')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [showCreate, setShowCreate] = useState(false)
  const [editData, setEditData] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [balanceTarget, setBalanceTarget] = useState(null)
  const [paymentTarget, setPaymentTarget] = useState(null)

  /* ── Load ─────────────────────────────────────────── */
  const load = useCallback(async (pg, s, active) => {
    setLoading(true)
    setError(null)
    try {
      let url = `${API_BASE_URL}/api/Customers?page=${pg}&pageSize=${pageSize}&isActive=${active === 'true'}`
      if (s) url += `&search=${encodeURIComponent(s)}`
      const res = await fetch(url, { headers: authHeaders() })
      if (res.status === 401) { navigate('/dashboard/session-expired'); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const d = json?.data?.data ?? json?.data ?? json
      setCustomers(Array.isArray(d) ? d : (d.data ?? []))
      setTotal(d.totalCount ?? d.total ?? (d.data?.length ?? 0))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { load(page, search, isActive) }, [page, search, isActive, load])

  /* ── Delete ───────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/Customers/${deleteTarget.id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setToast({ msg: 'تم حذف العميل بنجاح', type: 'ok' })
      setDeleteTarget(null)
      load(page, search, isActive)
    } catch (e) {
      setToast({ msg: `فشل الحذف: ${e.message}`, type: 'err' })
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── Restore ──────────────────────────────────────── */
  const handleRestore = async (c) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/Customers/${c.id}/restore`, {
        method: 'PUT', headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setToast({ msg: 'تم استعادة العميل بنجاح', type: 'ok' })
      load(page, search, isActive)
    } catch (e) {
      setToast({ msg: `فشل الاستعادة: ${e.message}`, type: 'err' })
    }
  }

  const handleSearch = () => { setPage(1); setSearch(searchInput) }
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1) }
  const handleSuccess = (msg) => { setToast({ msg, type: 'ok' }); load(1, search, isActive); setPage(1) }
  const handleFilterChange = (val) => { setIsActive(val); setPage(1) }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const totalBalance = customers.reduce((s, x) => s + (x.currentBalance ?? 0), 0)

  return (
    <div className="db-page db-animate-in">

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {viewId && (
        <DetailModal
          customerId={viewId}
          onClose={() => setViewId(null)}
          onEdit={c => { setEditData(c); setViewId(null) }}
        />
      )}
      {(showCreate || editData) && (
        <FormModal
          editData={editData}
          onClose={() => { setShowCreate(false); setEditData(null) }}
          onSuccess={handleSuccess}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          customer={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
      {balanceTarget && <BalanceModal customer={balanceTarget} onClose={() => setBalanceTarget(null)} />}
      {paymentTarget && (
        <PaymentModal
          customer={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* ── Page Header ──────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>إدارة العملاء</div>
          <h1 style={{
            fontSize: 22, fontWeight: 900, color: 'var(--text)',
            lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Users size={22} color="var(--teal)" /> العملاء
          </h1>
        </div>
        <button className="db-btn db-btn--gold" onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Plus size={16} /> عميل جديد
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="db-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        {[
          { label: 'إجمالي العملاء', value: total.toLocaleString('ar-EG'), unit: 'عميل', color: 'var(--teal)', icon: <Users size={18} /> },
          { label: 'العملاء النشطون', value: customers.filter(c => c.isActive !== false).length.toLocaleString('ar-EG'), unit: 'نشط', color: 'var(--green)', icon: <CheckCircle size={18} /> },
          { label: 'إجمالي الأرصدة', value: fmt(totalBalance), unit: 'ج.م', color: totalBalance >= 0 ? 'var(--gold)' : 'var(--red)', icon: <Wallet size={18} /> },
        ].map(({ label, value, unit, color, icon }) => (
          <div key={label} className="db-stat">
            <div className="db-stat__accent" style={{ background: color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div className="db-stat__value" style={{ color, fontSize: 22 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{unit}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
            </div>
            <div className="db-stat__label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Card ────────────────────────────────── */}
      <div className="db-card">

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input type="text" className="db-input"
              placeholder="بحث بالاسم أو الهاتف…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingRight: 36 }}
            />
          </div>
          <button className="db-btn db-btn--gold db-btn--sm" onClick={handleSearch}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Search size={13} /> بحث
          </button>
          {search && (
            <button className="db-btn db-btn--ghost db-btn--sm" onClick={clearSearch}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <X size={13} /> مسح
            </button>
          )}

          <div style={{ display: 'flex', gap: 4 }}>
            {[{ val: 'true', label: 'نشط' }, { val: 'false', label: 'غير نشط' }].map(({ val, label }) => (
              <button key={val}
                className={`db-tab${isActive === val ? ' db-tab--active' : ''}`}
                style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                onClick={() => handleFilterChange(val)}>
                {label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap', marginRight: 'auto' }}>
            {total} عميل
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="db-error-box" style={{ margin: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> {error}
            <button className="db-btn db-btn--ghost db-btn--sm"
              onClick={() => load(page, search, isActive)} style={{ marginRight: 'auto' }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="db-loading">
            <Loader2 size={32} className="db-spinner" color="var(--gold)" />
            جاري تحميل العملاء…
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <CustomersTable
            customers={customers}
            onView={setViewId}
            onEdit={setEditData}
            onDelete={setDeleteTarget}
            onBalance={setBalanceTarget}
            onPayment={setPaymentTarget}
            onRestore={handleRestore}
            showInactive={isActive === 'false'}
          />
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="db-pagination">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
              صفحة {page} من {totalPages} — {total} عميل
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="db-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronRight size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg
                if (totalPages <= 5) pg = i + 1
                else if (page <= 3) pg = i + 1
                else if (page >= totalPages - 2) pg = totalPages - 4 + i
                else pg = page - 2 + i
                return (
                  <button key={pg}
                    className={`db-page-btn${page === pg ? ' db-page-btn--active' : ''}`}
                    onClick={() => setPage(pg)}>
                    {pg.toLocaleString('ar-EG')}
                  </button>
                )
              })}
              <button className="db-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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
export default function CustomersPage() {
  return (
    <DashboardLayout title="العملاء" breadcrumb="إدارة العملاء">
      <CustomersContent />
    </DashboardLayout>
  )
}