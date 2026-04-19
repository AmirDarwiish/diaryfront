import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from './DashboardLayout';
import API_BASE_URL from '../../config';

// ── Icons ─────────────────────────────────────────────────
const Icons = {
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  Close: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Package: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

// ── Spinner ───────────────────────────────────────────────
const Spinner = ({ size = 13, color = '#fff' }) => (
  <div style={{
    width: size, height: size,
    border: `2px solid ${color}25`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    flexShrink: 0
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Unit Modal (Add / Edit) ───────────────────────────────
const UnitModal = ({ unit, onClose, onSave }) => {
  const isEdit = !!unit;
  const [form, setForm] = useState({ name: unit?.name || '', code: unit?.code || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('الاسم مطلوب');
    if (!form.code.trim()) return setError('الكود مطلوب');
    setLoading(true);
    setError('');
    const url = isEdit
      ? `${API_BASE_URL}/api/Units/${unit.id}`
      : `${API_BASE_URL}/api/Units`;
    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: form.name.trim(), code: form.code.trim() })
      });
      const result = await res.json();
      if (res.ok) onSave();
      else setError(result.message || 'حدث خطأ');
    } catch {
      setError('تعذر الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="db-modal-overlay"
      onClick={onClose}
    >
      <div
        className="db-card db-animate-in"
        style={{ width: '420px', padding: '24px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>
              {isEdit ? 'تعديل وحدة القياس' : 'إضافة وحدة جديدة'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              الكود سيُحوَّل تلقائياً لأحرف كبيرة
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text)', display: 'flex' }}
          >
            <Icons.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="db-field">
              <label className="db-label">اسم الوحدة</label>
              <input
                className="db-input"
                placeholder="مثال: كيلوجرام"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                autoFocus
                required
              />
            </div>
            <div className="db-field">
              <label className="db-label">الكود</label>
              <input
                className="db-input"
                placeholder="مثال: KG"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
                style={{ fontFamily: 'monospace', letterSpacing: '1.5px', fontSize: '13px' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12.5px', color: '#dc2626' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
            <button type="button" className="db-btn db-btn--ghost" onClick={onClose} disabled={loading}>
              إلغاء
            </button>
            <button type="submit" className="db-btn db-btn--gold" disabled={loading} style={{ minWidth: '110px' }}>
              {loading
                ? <div style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'center' }}><Spinner /> جاري الحفظ...</div>
                : isEdit ? 'حفظ التعديل' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────
const DeleteModal = ({ unit, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/Units/${unit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      onConfirm();
    } catch {
      onClose();
    }
  };

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div
        className="db-card db-animate-in"
        style={{ width: '380px', padding: '24px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#dc2626' }}>
            <Icons.Trash />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
            تعطيل وحدة القياس
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            هيتم تعطيل <strong style={{ color: 'var(--text)' }}>{unit.name} ({unit.code})</strong> وإخفاؤها من القوائم. يمكن تفعيلها لاحقاً.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="db-btn db-btn--ghost" onClick={onClose} disabled={loading}>
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '8px 22px', background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <><Spinner /> جاري...</> : 'تعطيل'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
export default function UnitsPage() {
  const [units, setUnits]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pageSize]                  = useState(10);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterActive, setFilterActive] = useState('');   // '' | 'true' | 'false'
  const [loading, setLoading]       = useState(false);
  const [modalUnit, setModalUnit]   = useState(undefined); // undefined=closed, null=add, obj=edit
  const [deleteUnit, setDeleteUnit] = useState(null);

  const totalPages = Math.ceil(total / pageSize);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, pageSize });
    if (search)       params.append('search', search);
    if (filterActive) params.append('isActive', filterActive);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Units?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
const d = result.data || {};
setUnits(d.data || []);
setTotal(d.total || 0);
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filterActive]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSaved = () => {
    setModalUnit(undefined);
    fetchUnits();
  };

  const handleDeleted = () => {
    setDeleteUnit(null);
    fetchUnits();
  };

  return (
    <DashboardLayout
      title="وحدات القياس"
      breadcrumb="الداشبورد / وحدات القياس"
      headerActions={
        <button
          className="db-btn db-btn--gold"
          onClick={() => setModalUnit(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Icons.Plus /> إضافة وحدة
        </button>
      }
    >
      <div className="db-page">


      {/* ── Filters Bar */}
      <div className="db-card" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            <Icons.Search />
          </span>
          <input
            className="db-input"
            placeholder="بحث بالاسم أو الكود..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ paddingRight: '34px', width: '100%' }}
          />
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: 'الكل', value: '' },
            { label: 'نشط', value: 'true' },
            { label: 'معطّل', value: 'false' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterActive(opt.value); setPage(1); }}
              style={{
                padding: '6px 14px', borderRadius: '7px', border: '1px solid',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                borderColor: filterActive === opt.value ? 'var(--gold, #c9a96e)' : 'var(--border)',
                background: filterActive === opt.value ? 'rgba(201,169,110,0.1)' : 'transparent',
                color: filterActive === opt.value ? 'var(--gold, #c9a96e)' : 'var(--text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Total badge */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          إجمالي: <strong style={{ color: 'var(--text)' }}>{total}</strong>
        </div>
      </div>

      {/* ── Table */}
      <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
            <Spinner size={18} color="var(--text-muted, #9ca3af)" /> جاري التحميل...
          </div>
        ) : units.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>📦</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>لا توجد وحدات</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>جرّب تغيير البحث أو أضف وحدة جديدة</div>
          </div>
        ) : (
          <table className="db-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '48px' }}>#</th>
                <th>الاسم</th>
                <th style={{ width: '120px' }}>الكود</th>
                <th style={{ width: '100px' }}>الحالة</th>
                <th style={{ width: '100px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, idx) => (
                <tr key={u.id} style={{ transition: 'background 0.1s' }}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</td>
                  <td>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px',
                      background: 'var(--surface-2, #f3f4f6)', padding: '3px 10px',
                      borderRadius: '6px', color: 'var(--text)', fontWeight: 700
                    }}>
                      {u.code}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '11.5px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                      background: u.isActive ? '#f0fdf4' : '#f9fafb',
                      color: u.isActive ? '#16a34a' : '#9ca3af'
                    }}>
                      {u.isActive ? 'نشط' : 'معطّل'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        title="تعديل"
                        onClick={() => setModalUnit(u)}
                        style={{
                          width: '30px', height: '30px', border: '1px solid var(--border)',
                          borderRadius: '7px', background: 'transparent', cursor: 'pointer',
                          color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold,#c9a96e)'; e.currentTarget.style.color = 'var(--gold,#c9a96e)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Icons.Edit />
                      </button>
                      {u.isActive && (
                        <button
                          title="تعطيل"
                          onClick={() => setDeleteUnit(u)}
                          style={{
                            width: '30px', height: '30px', border: '1px solid var(--border)',
                            borderRadius: '7px', background: 'transparent', cursor: 'pointer',
                            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Icons.Trash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 18px', borderTop: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              صفحة {page} من {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: '32px', height: '32px', border: '1px solid var(--border)',
                  borderRadius: '7px', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? 'var(--border)' : 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icons.ChevronRight />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '32px' }}>…</span>
                    : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          width: '32px', height: '32px', border: '1px solid',
                          borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          borderColor: page === p ? 'var(--gold,#c9a96e)' : 'var(--border)',
                          background: page === p ? 'rgba(201,169,110,0.1)' : 'transparent',
                          color: page === p ? 'var(--gold,#c9a96e)' : 'var(--text)',
                        }}
                      >
                        {p}
                      </button>
                    )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: '32px', height: '32px', border: '1px solid var(--border)',
                  borderRadius: '7px', background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? 'var(--border)' : 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icons.ChevronLeft />
              </button>
            </div>
          </div>
        )}
      </div>




      {/* ── Modals */}
      {modalUnit !== undefined && (
        <UnitModal
          unit={modalUnit}
          onClose={() => setModalUnit(undefined)}
          onSave={handleSaved}
        />
      )}
      {deleteUnit && (
        <DeleteModal
          unit={deleteUnit}
          onClose={() => setDeleteUnit(null)}
          onConfirm={handleDeleted}
        />
      )}
      </div>
    </DashboardLayout>
  );
}