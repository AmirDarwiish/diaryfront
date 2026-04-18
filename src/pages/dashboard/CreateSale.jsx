import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import API_BASE_URL from '../../config';

// ── Icons ────────────────────────────────────────────────────
const IconSuccess = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconError = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
);

export default function CreateSale() {
  // ── State ────────────────────────────────────────────────
  const [customer, setCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [items, setItems] = useState([
    { id: generateId(), productId: '', quantity: 1, price: 0, maxStock: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // ── Helpers ──────────────────────────────────────────────
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const searchCustomers = async (query) => {
    setIsSearching(true);
    setShowDropdown(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/Customers?Search=${encodeURIComponent(query)}&PageSize=10`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      setSearchResults(data.data?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => searchCustomers(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    setIsSavingCustomer(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Customers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (res.ok) {
        const created = { id: data.data, name: newCustomer.name, phone: newCustomer.phone, currentBalance: 0 };
        setCustomer(created);
        setShowCreateModal(false);
        setNewCustomer({ name: '', phone: '', address: '' });
        showAlert('success', 'تم إضافة العميل الجديد بنجاح.');
      } else {
        showAlert('error', data.message || 'فشل في إضافة العميل.');
      }
    } catch {
      showAlert('error', 'خطأ في الاتصال بالخادم.');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Products`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setAvailableProducts(data.data?.data || []);
        } else {
          showAlert('error', 'فشل في تحميل قائمة المنتجات.');
        }
      } catch {
        showAlert('error', 'تعذر الاتصال بالخادم لتحميل المنتجات.');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleAddItem = () => {
    setItems([...items, { id: generateId(), productId: '', quantity: 1, price: 0, maxStock: null }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) {
      showAlert('error', 'يجب أن تحتوي الفاتورة على صنف واحد على الأقل.');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      let updated = { ...item, [field]: value };
      if (field === 'productId' && value !== '') {
        const prod = availableProducts.find(p => p.id === parseInt(value));
        if (prod) {
          updated.price = prod.sellingPrice || prod.price || 0;
          updated.maxStock = prod.stockQuantity;
        }
      }
      return updated;
    }));
  };

  const calculateGrandTotal = () =>
    items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 6000);
  };

  const handleSubmit = async () => {
    const validItems = items
      .filter(i => i.productId && parseFloat(i.quantity) > 0)
      .map(i => ({
        productId: parseInt(i.productId),
        quantity: parseFloat(i.quantity),
        price: parseFloat(i.price),
      }));

    if (validItems.length === 0) {
      showAlert('error', 'يجب اختيار منتج واحد على الأقل ببيانات صحيحة.');
      return;
    }

    const payload = { customerId: customer?.id ?? null, isPaid, items: validItems };
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Sales`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && !data.isError) {
        showAlert('success', `تم حفظ الفاتورة بنجاح! رقم الفاتورة: #${data.data || ''}`);
        setItems([{ id: generateId(), productId: '', quantity: 1, price: 0, maxStock: null }]);
        setCustomer(null);
        setSearchQuery('');
        setIsPaid(false);
      } else {
        showAlert('error', data.message || 'حدث خطأ أثناء الحفظ، تأكد من توافر المخزون.');
      }
    } catch {
      showAlert('error', 'تعذر الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <DashboardLayout
      title="إنشاء فاتورة مبيعات"
      breadcrumb="الداشبورد / المبيعات / فاتورة جديدة"
      headerActions={
        <button
          className="db-btn db-btn--gold"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingProducts}
          style={{ minWidth: '130px', height: '42px' }}
        >
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 13, height: 13, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
              جاري الحفظ...
            </span>
          ) : 'حفظ وإصدار الفاتورة'}
        </button>
      }
    >
      <div className="db-page">

        {/* Alert */}
        {alert.show && (
          <div className="cs-alert db-animate-in" data-type={alert.type}>
            {alert.type === 'error' ? <IconError /> : <IconSuccess />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* ── Row 1: Customer + Total ─────────────────────── */}
        <div className="cs-top-grid">

          {/* Customer Card */}
          <div className="db-card cs-card">
            <p className="cs-card-label">العميل</p>

            {customer ? (
              <div className="cs-customer-chip">
                <div className="cs-customer-avatar">
                  {customer.name.charAt(0)}
                </div>
                <div className="cs-customer-info">
                  <span className="cs-customer-name">#{customer.id} — {customer.name}</span>
                  <span className="cs-customer-phone">{customer.phone}</span>
                </div>
                <button
                  className="cs-chip-remove"
                  onClick={() => setCustomer(null)}
                  aria-label="إزالة العميل"
                >×</button>
              </div>
            ) : (
              <div className="cs-search-row">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="db-input"
                    placeholder="ابحث بالاسم أو التليفون..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                  />
                  {showDropdown && (
                    <div className="cs-dropdown">
                      {isSearching && (
                        <div className="cs-dropdown-hint">جاري البحث...</div>
                      )}
                      {!isSearching && searchResults.length === 0 && searchQuery && (
                        <div className="cs-dropdown-hint">لا يوجد نتائج</div>
                      )}
                      {!isSearching && searchResults.map(c => (
                        <div
                          key={c.id}
                          className="cs-dropdown-item"
                          onMouseDown={() => { setCustomer(c); setShowDropdown(false); setSearchQuery(''); }}
                        >
                          <span className="cs-dropdown-name">{c.name}</span>
                          <span className="cs-dropdown-meta">{c.phone} · {c.currentBalance?.toLocaleString()} EGP</span>
                        </div>
                      ))}
                      <div
                        className="cs-dropdown-create"
                        onMouseDown={() => {
                          setShowCreateModal(true);
                          setShowDropdown(false);
                          setNewCustomer({ name: searchQuery, phone: '', address: '' });
                        }}
                      >
                        + إنشاء عميل: "{searchQuery}"
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="db-btn db-btn--gold cs-add-btn"
                  onClick={() => {
                    setShowCreateModal(true);
                    setNewCustomer({ name: searchQuery, phone: '', address: '' });
                    setShowDropdown(false);
                  }}
                  title="إضافة عميل جديد"
                >
                  <IconPlus />
                </button>
              </div>
            )}

            {/* Payment Type */}
            <div className="cs-pay-grid">
              {[
                { val: false, label: 'آجل', desc: 'يضاف للرصيد المديون', Icon: IconClock },
                { val: true, label: 'نقدي', desc: 'مدفوع فوراً', Icon: IconCard },
              ].map(({ val, label, desc, Icon }) => (
                <button
                  key={String(val)}
                  type="button"
                  className={`cs-pay-btn ${isPaid === val ? 'cs-pay-btn--active' : ''}`}
                  onClick={() => setIsPaid(val)}
                >
                  <div className="cs-pay-icon">
                    <Icon />
                  </div>
                  <div className="cs-pay-text">
                    <span className="cs-pay-label">{label}</span>
                    <span className="cs-pay-desc">{desc}</span>
                  </div>
                  {isPaid === val && (
                    <svg className="cs-pay-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              ))}
            </div>

            {!customer && (
              <p className="cs-note">
                بدون عميل محدد → الفاتورة نقدي ولا ترحل لأي حساب.
              </p>
            )}
          </div>

          {/* Total Card */}
          <div className="db-card cs-total-card">
            <span className="cs-total-label">إجمالي الفاتورة</span>
            <span className="cs-total-amount">
              {calculateGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="cs-total-currency">EGP</span>
          </div>
        </div>

        {/* ── Items Card ──────────────────────────────────── */}
        <div className="db-card cs-items-card">
          <div className="cs-items-header">
            <div>
              <h3 className="cs-items-title">الأصناف المباعة</h3>
              <p className="cs-items-sub">يتم خصم المخزون آلياً بنظام FIFO.</p>
            </div>
            <button className="db-btn db-btn--ghost cs-add-item-btn" onClick={handleAddItem}>
              <IconPlus /> إضافة صنف
            </button>
          </div>

          {/* Items list — mobile card layout, no scrolling table */}
          <div className="cs-items-list">
            {items.map((item, index) => (
              <div key={item.id} className="cs-item-row">
                <div className="cs-item-row-head">
                  <span className="cs-item-num">صنف #{index + 1}</span>
                  <button
                    className="cs-item-remove"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="حذف الصنف"
                  >
                    <IconTrash />
                  </button>
                </div>

                {/* Product Select */}
                <div className="cs-field">
                  <label className="cs-field-label">المنتج</label>
                  {isLoadingProducts ? (
                    <div className="cs-loading-text">جاري التحميل...</div>
                  ) : (
                    <select
                      className="db-select"
                      value={item.productId}
                      onChange={e => handleItemChange(item.id, 'productId', e.target.value)}
                    >
                      <option value="">-- اختر منتجاً --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.productName}
                          {p.stockQuantity !== undefined ? ` (مخزن: ${p.stockQuantity})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Qty + Price inline */}
                <div className="cs-field-row">
                  <div className="cs-field">
                    <label className="cs-field-label">الكمية</label>
                    <input
                      type="number"
                      className="db-input cs-input-center"
                      min="0.1"
                      step="0.1"
                      value={item.quantity}
                      onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="cs-field">
                    <label className="cs-field-label">سعر الوحدة</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        className="db-input cs-price-input"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => handleItemChange(item.id, 'price', e.target.value)}
                        dir="ltr"
                      />
                      <span className="cs-price-badge">EGP</span>
                    </div>
                  </div>
                </div>

                {/* Line Total */}
                <div className="cs-line-total">
                  <span className="cs-line-total-label">الإجمالي</span>
                  <span className="cs-line-total-val">
                    {((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0))
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="db-btn db-btn--ghost cs-add-item-bottom" onClick={handleAddItem}>
            + إضافة سطر جديد
          </button>
        </div>

        {/* ── Save Button (bottom sticky on mobile) ────────── */}
        <div className="cs-sticky-footer">
          <button
            className="db-btn db-btn--gold cs-save-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingProducts}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                جاري الحفظ...
              </span>
            ) : 'حفظ وإصدار الفاتورة'}
          </button>
        </div>

        {/* ── Add Customer Modal ───────────────────────────── */}
        {showCreateModal && (
          <div className="cs-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
            <div className="cs-modal db-animate-in">
              <h3 className="cs-modal-title">إضافة عميل جديد</h3>

              <div className="cs-modal-fields">
                {[
                  { key: 'name', label: 'اسم العميل *', placeholder: 'أدخل اسم العميل بالكامل', type: 'text' },
                  { key: 'phone', label: 'رقم الهاتف', placeholder: '01xxxxxxxxx', type: 'tel' },
                  { key: 'address', label: 'العنوان', placeholder: 'المحافظة / المنطقة', type: 'text' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key} className="cs-field">
                    <label className="cs-field-label">{label}</label>
                    <input
                      type={type}
                      className="db-input"
                      value={newCustomer[key]}
                      onChange={e => setNewCustomer({ ...newCustomer, [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              <div className="cs-modal-actions">
                <button
                  className="db-btn db-btn--gold"
                  style={{ flex: 1 }}
                  onClick={handleCreateCustomer}
                  disabled={isSavingCustomer || !newCustomer.name.trim()}
                >
                  {isSavingCustomer ? 'جاري الحفظ...' : 'حفظ العميل'}
                </button>
                <button
                  className="db-btn cs-cancel-btn"
                  style={{ flex: 1 }}
                  onClick={() => setShowCreateModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Scoped Styles ────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .db-animate-in { animation: fadeIn .3s ease-out; }

        /* Alert */
        .cs-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 16px; border-radius: 10px; margin-bottom: 20px;
          font-size: 13px; font-weight: 700;
        }
        .cs-alert[data-type="error"] {
          background: var(--red-bg); color: var(--red);
          border: 1px solid rgba(248,113,113,.25);
        }
        .cs-alert[data-type="success"] {
          background: var(--green-bg); color: var(--green);
          border: 1px solid rgba(52,211,153,.3);
        }

        /* Top Grid: stacks on mobile, side-by-side on desktop */
        .cs-top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (min-width: 768px) {
          .cs-top-grid { grid-template-columns: 1fr 280px; }
        }

        .cs-card { padding: 20px; }

        /* Card label */
        .cs-card-label {
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .08em; color: var(--text-muted); margin-bottom: 10px;
        }

        /* Customer chip */
        .cs-customer-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          background: var(--blue-bg); border: 1px solid rgba(110,168,254,.2);
        }
        .cs-customer-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: rgba(110,168,254,.25); color: var(--blue);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800;
        }
        .cs-customer-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cs-customer-name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cs-customer-phone { font-size: 11px; color: var(--text-muted); }
        .cs-chip-remove {
          margin-right: auto; background: none; border: none;
          color: var(--red); cursor: pointer; font-size: 20px; line-height: 1;
          padding: 0 4px; flex-shrink: 0;
        }

        /* Search row */
        .cs-search-row { display: flex; gap: 8px; align-items: center; }
        .cs-add-btn {
          width: 44px !important; height: 44px !important;
          padding: 0 !important; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }

        /* Dropdown */
        .cs-dropdown {
          position: absolute; top: calc(100% + 4px); right: 0; left: 0; z-index: 200;
          background: var(--bg, #fff); border: 1px solid var(--border);
          border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.15); overflow: hidden;
          max-height: 240px; overflow-y: auto;
        }
        .cs-dropdown-hint { padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center; }
        .cs-dropdown-item {
          padding: 11px 14px; cursor: pointer; font-size: 13px;
          border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          gap: 8px; transition: background .15s;
        }
        .cs-dropdown-item:hover { background: var(--bg-hover, #f1f5f9); }
        .cs-dropdown-name { font-weight: 700; color: var(--text); }
        .cs-dropdown-meta { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
        .cs-dropdown-create {
          padding: 12px 14px; cursor: pointer; font-size: 13px;
          color: var(--blue, #0d6efd); font-weight: 700;
          background: rgba(110,168,254,.05);
        }
        .cs-dropdown-create:hover { background: rgba(110,168,254,.1); }

        /* Payment grid */
        .cs-pay-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-top: 14px;
        }
        .cs-pay-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 10px; cursor: pointer;
          border: 1.5px solid var(--border); background: transparent;
          transition: all .15s; text-align: right; width: 100%;
          min-height: 56px;
        }
        .cs-pay-btn--active {
          border-color: var(--gold);
          background: var(--gold-08, rgba(201,169,110,.08));
        }
        .cs-pay-icon {
          width: 32px; height: 32px; border-radius: 7px; flex-shrink: 0;
          background: var(--bg-hover); display: flex; align-items: center;
          justify-content: center; color: var(--text-muted);
          transition: all .15s;
        }
        .cs-pay-btn--active .cs-pay-icon {
          background: var(--gold-20, rgba(201,169,110,.2));
          color: var(--gold);
        }
        .cs-pay-text { display: flex; flex-direction: column; gap: 2px; }
        .cs-pay-label { font-size: 13px; font-weight: 800; color: var(--text); }
        .cs-pay-btn--active .cs-pay-label { color: var(--gold); }
        .cs-pay-desc { font-size: 10px; color: var(--text-muted); }
        .cs-pay-check { margin-right: auto; color: var(--gold); flex-shrink: 0; }

        /* Note */
        .cs-note {
          margin-top: 12px; padding: 10px 12px; border-radius: 8px;
          background: var(--blue-bg); color: var(--blue);
          font-size: 11px; font-weight: 600; line-height: 1.6;
          border: 1px solid rgba(110,168,254,.15);
        }

        /* Total card */
        .cs-total-card {
          padding: 24px; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: var(--bg-elevated); position: relative; overflow: hidden;
        }
        .cs-total-card::before {
          content: ''; position: absolute; top: 0; right: 0;
          width: 4px; height: 100%;
          background: linear-gradient(to bottom, var(--gold), var(--gold-light, #e5c97e));
        }
        .cs-total-label { font-size: 13px; font-weight: 800; color: var(--text-muted); margin-bottom: 8px; }
        .cs-total-amount {
          font-size: clamp(28px, 6vw, 46px); font-weight: 900;
          color: var(--gold); line-height: 1;
        }
        .cs-total-currency { font-size: 13px; color: var(--text-muted); font-weight: 800; margin-top: 6px; letter-spacing: 1px; }

        /* Items card */
        .cs-items-card { padding: 20px; margin-top: 0; }
        .cs-items-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .cs-items-title { font-size: 15px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
        .cs-items-sub { font-size: 11px; color: var(--text-faint); margin: 0; }
        .cs-add-item-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; white-space: nowrap;
        }

        /* Item row card */
        .cs-items-list { display: flex; flex-direction: column; gap: 12px; }
        .cs-item-row {
          border: 1px solid var(--border); border-radius: 10px;
          padding: 14px; background: var(--bg-elevated, transparent);
        }
        .cs-item-row-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px;
        }
        .cs-item-num { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
        .cs-item-remove {
          background: none; border: 1px solid rgba(248,113,113,.3);
          color: var(--red); cursor: pointer; border-radius: 6px;
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .cs-item-remove:hover { background: var(--red-bg); }

        /* Field */
        .cs-field { display: flex; flex-direction: column; gap: 5px; }
        .cs-field-label { font-size: 11px; font-weight: 700; color: var(--text-muted); }
        .cs-loading-text { font-size: 12px; color: var(--text-muted); padding: 8px 0; }

        .cs-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }

        .cs-input-center { text-align: center; }
        .cs-price-input { padding-left: 40px !important; font-weight: 700; color: var(--gold); }
        .cs-price-badge {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%); font-size: 9px;
          color: var(--text-faint); font-weight: 800; pointer-events: none;
        }

        /* Line total */
        .cs-line-total {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border);
        }
        .cs-line-total-label { font-size: 12px; color: var(--text-muted); font-weight: 700; }
        .cs-line-total-val { font-size: 14px; font-weight: 900; color: var(--text); }

        /* Add item bottom */
        .cs-add-item-bottom {
          margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
          font-size: 13px;
        }

        /* Sticky footer (mobile only) */
        .cs-sticky-footer {
          display: none;
          position: sticky; bottom: 0; left: 0; right: 0;
          padding: 12px 16px; z-index: 50;
          background: var(--bg, #fff);
          border-top: 1px solid var(--border);
          margin-top: 16px;
        }
        .cs-save-btn { width: 100%; height: 48px; font-size: 15px; font-weight: 800; }
        @media (max-width: 767px) {
          .cs-sticky-footer { display: block; }
        }

        /* Modal */
        .cs-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
          padding: 0;
        }
        @media (min-width: 480px) {
          .cs-modal-overlay { align-items: center; padding: 16px; }
        }
        .cs-modal {
          background: var(--bg, #fff); color: var(--text, #000);
          width: 100%; max-width: 440px;
          border-radius: 16px 16px 0 0; padding: 24px 20px 32px;
          box-shadow: 0 -8px 40px rgba(0,0,0,.25);
          max-height: 92dvh; overflow-y: auto;
        }
        @media (min-width: 480px) {
          .cs-modal { border-radius: 14px; padding: 28px 24px; box-shadow: 0 20px 40px rgba(0,0,0,.3); }
        }
        .cs-modal-title { font-size: 17px; font-weight: 800; margin: 0 0 20px; }
        .cs-modal-fields { display: flex; flex-direction: column; gap: 14px; }
        .cs-modal-actions { display: flex; gap: 10px; margin-top: 24px; }
        .cs-cancel-btn {
          background: var(--bg-hover, #e2e8f0) !important;
          color: var(--text, #000) !important;
        }
      `}</style>
    </DashboardLayout>
  );
}