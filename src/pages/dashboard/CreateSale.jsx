import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout'; 
import API_BASE_URL from '../../config';

// ── الأيقونات (SVG Icons) ────────────────────────────────────
const IconSuccess = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconError = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default function CreateSale() {
  // ── State Management ────────────────────────────────────
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

  // ── Helpers ─────────────────────────────────────────────
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

  // ── Debounce Search Effect ──────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 400); // ينتظر 400 ملي ثانية بعد آخر حرف اتكتب

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    setIsSavingCustomer(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Customers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newCustomer)
      });
      const data = await res.json();
      if (res.ok) {
        // اختار العميل الجديد مباشرة
        const created = { 
            id: data.data, 
            name: newCustomer.name, 
            phone: newCustomer.phone, 
            currentBalance: 0 
        };
        setCustomer(created);
        setShowCreateModal(false);
        setNewCustomer({ name: '', phone: '', address: '' });
        showAlert('success', 'تم إضافة العميل الجديد بنجاح.');
      } else {
        showAlert('error', data.message || 'فشل في إضافة العميل.');
      }
    } catch {
        showAlert('error', 'خطأ في الاتصال بالخادم.');
    } finally { setIsSavingCustomer(false); }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Products`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableProducts(data.data?.data || []);
        } else {
          showAlert('error', 'فشل في تحميل قائمة المنتجات.');
        }
      } catch (error) {
        showAlert('error', 'تعذر الاتصال بالخادم لتحميل المنتجات.');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // ── Handlers ────────────────────────────────────────────
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
      if (item.id === id) {
        let updatedItem = { ...item, [field]: value };
        if (field === 'productId' && value !== '') {
          const selectedProduct = availableProducts.find(p => p.id === parseInt(value));
          if (selectedProduct) {
            updatedItem.price = selectedProduct.sellingPrice || selectedProduct.price || 0;
            updatedItem.maxStock = selectedProduct.stockQuantity;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + (q * p);
    }, 0);
  };

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
        price: parseFloat(i.price)
      }));

    if (validItems.length === 0) {
      showAlert('error', 'يجب اختيار منتج واحد على الأقل ببيانات صحيحة.');
      return;
    }

const payload = {
  customerId: customer?.id ?? null,
  isPaid,
  items: validItems
};

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Sales`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && !data.isError) { 
        showAlert('success', `تم حفظ الفاتورة بنجاح! رقم الفاتورة: #${data.data || ''}`);
        setItems([{ id: generateId(), productId: '', quantity: 1, price: 0, maxStock: null }]);
        setCustomer(null);
        setSearchQuery('');
      } else {
        showAlert('error', data.message || 'حدث خطأ أثناء الحفظ، تأكد من توافر المخزون.');
      }
    } catch (error) {
      showAlert('error', 'تعذر الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout 
      title="إنشاء فاتورة مبيعات" 
      breadcrumb="الداشبورد / المبيعات / فاتورة جديدة"
      headerActions={
        <button 
          className="db-btn db-btn--gold" 
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingProducts}
          style={{ minWidth: '140px' }}
        >
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="db-spinner" style={{ width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              جاري الحفظ...
            </span>
          ) : (
            'حفظ وإصدار الفاتورة'
          )}
        </button>
      }
    >
      <div className="db-page">
        {/* التنبيهات */}
        {alert.show && (
          <div 
            className="db-animate-in" 
            style={{ 
              padding: '14px 20px', borderRadius: '10px', marginBottom: '24px', 
              fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px',
              background: alert.type === 'error' ? 'var(--red-bg)' : 'var(--green-bg)',
              color: alert.type === 'error' ? 'var(--red)' : 'var(--green)',
              border: `1px solid ${alert.type === 'error' ? 'rgba(248,113,113,.25)' : 'rgba(52,211,153,.3)'}`
            }}
          >
            {alert.type === 'error' ? <IconError /> : <IconSuccess />}
            {alert.message}
          </div>
        )}

        <div className="db-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'stretch' }}>
          
          <div className="db-card" style={{ padding: '24px', overflow: 'visible' }}>
            {customer ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', 
                            background:'var(--blue-bg)', borderRadius:8, border:'1px solid rgba(110,168,254,.2)' }}>
                <span style={{ fontWeight:700, fontSize:13 }}>#{customer.id} — {customer.name}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{customer.phone}</span>
                <button onClick={() => setCustomer(null)} style={{ marginRight:'auto', background:'none', border:'none', 
                          color:'var(--red)', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position:'relative', flex: 1 }}>
                  <input
                    className="db-input"
                    placeholder="ابحث بالاسم أو التليفون..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                  />
                  {showDropdown && (
                    <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, left:0, zIndex:100,
                                  background:'var(--bg, #ffffff)', border:'1px solid var(--border)', borderRadius:8,
                                  boxShadow:'0 8px 24px rgba(0,0,0,.15)', overflow:'hidden' }}>
                      {isSearching && <div style={{ padding:12, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>جاري البحث...</div>}
                      {!isSearching && searchResults.length === 0 && searchQuery && (
                         <div style={{ padding:12, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>لا يوجد نتائج</div>
                      )}
                      {!isSearching && searchResults.map(c => (
                        <div key={c.id} onMouseDown={() => { setCustomer(c); setShowDropdown(false); setSearchQuery(''); }}
                             style={{ padding:'10px 14px', cursor:'pointer', fontSize:13, borderBottom:'1px solid var(--border)',
                                      display:'flex', justifyContent:'space-between', transition: 'background 0.2s', background: 'var(--bg, #ffffff)' }}
                             className="dd-item-hover">
                          <span style={{ fontWeight:700, color: 'var(--text, #000)' }}>{c.name}</span>
                          <span style={{ fontSize:11, color:'var(--text-muted, #666)' }}>{c.phone} | {c.currentBalance?.toLocaleString()} EGP</span>
                        </div>
                      ))}
                      <div onMouseDown={() => { setShowCreateModal(true); setShowDropdown(false); setNewCustomer({...newCustomer, name: searchQuery}); }}
                           style={{ padding:'12px 14px', cursor:'pointer', fontSize:13, color:'var(--blue, #0d6efd)', fontWeight:700,
                                    display:'flex', gap:6, alignItems:'center', background: 'rgba(110,168,254,.05)' }}>
                        + إنشاء عميل جديد: "{searchQuery}"
                      </div>
                    </div>
                  )}
                </div>
                {/* الزرار الخاص بإضافة عميل جديد */}
                <button
                  type="button"
                  className="db-btn db-btn--gold"
                  style={{ width: '42px', height: '42px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
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
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--blue-bg)', borderRadius: '8px', border: '1px solid rgba(110,168,254,.15)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
             <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
  {[
    { val: false, label: 'آجل', desc: 'يضاف للرصيد المديون', icon: '🕐' },
    { val: true,  label: 'نقدي', desc: 'مدفوع فوراً', icon: '💵' },
  ].map(({ val, label, desc }) => (
    <div
      key={String(val)}
      onClick={() => setIsPaid(val)}
      style={{
        flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
        border: `2px solid ${isPaid === val ? 'var(--gold)' : 'var(--border)'}`,
        background: isPaid === val ? 'var(--gold-08)' : 'transparent',
        transition: 'all .15s',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: isPaid === val ? 'var(--gold-20)' : 'var(--bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {val ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPaid === val ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPaid === val ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13, color: isPaid === val ? 'var(--gold)' : 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      {isPaid === val && (
        <div style={{ marginRight: 'auto' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </div>
  ))}
</div>
              <span style={{ color: 'var(--blue)', marginTop: '2px' }}><IconInfo /></span>
              <p style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600, lineHeight: 1.6 }}>
                  إذا لم يتم اختيار عميل، سيتم اعتبار الفاتورة "نقدي" (Cash) ولن ترحل لأي حساب.
              </p>
            </div>
          </div>

          <div className="db-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, var(--gold), var(--gold-light))' }}></div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px' }}>إجمالي الفاتورة المطلوب</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--gold)', lineHeight: 1, textShadow: '0 4px 20px rgba(201,169,110,.2)' }}>
              {calculateGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 800, marginTop: '8px', letterSpacing: '1px' }}>EGP</div>
          </div>

        </div>

        <div className="db-card" style={{ padding: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>الأصناف المباعة</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>يتم خصم المخزون آلياً بنظام FIFO.</p>
            </div>
            <button className="db-btn db-btn--ghost" onClick={handleAddItem}>
              + إضافة صنف آخر
            </button>
          </div>

          <div className="db-table-wrap" style={{ overflow: 'visible' }}>
            <table className="db-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>المنتج</th>
                  <th style={{ width: '15%' }}>الكمية</th>
                  <th style={{ width: '20%' }}>سعر الوحدة</th>
                  <th style={{ width: '15%' }}>الإجمالي</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} style={{ background: index % 2 !== 0 ? 'var(--bg-hover)' : 'transparent' }}>
                    <td>
                      {isLoadingProducts ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px' }}>جاري التحميل...</div>
                      ) : (
                        <select 
                          className="db-select" 
                          value={item.productId}
                          onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                          style={{ fontWeight: item.productId ? 700 : 400, color: item.productId ? 'var(--text)' : 'var(--text-faint)' }}
                        >
                          <option value="">-- اختر منتجاً --</option>
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name || p.productName} {p.stockQuantity !== undefined ? `(مخزن: ${p.stockQuantity})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="db-input" 
                        min="0.1" step="0.1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        style={{ textAlign: 'center', fontWeight: 700 }}
                      />
                    </td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          className="db-input" 
                          min="0" step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          style={{ paddingLeft: '38px', fontWeight: 700, color: 'var(--gold)' }}
                          dir="ltr"
                        />
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-faint)', fontWeight: 800 }}>EGP</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 900, color: 'var(--text)', fontSize: '14px', verticalAlign: 'middle' }}>
                      {((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <button 
                        className="db-btn--icon" 
                        style={{ color: 'var(--red)', borderColor: 'transparent', width: '32px', height: '32px', margin: '0 auto' }}
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button className="db-btn db-btn--ghost db-btn--sm" onClick={handleAddItem}>
                إضافة سطر جديد
            </button>
          </div>
        </div>

        {/* ── مودال إضافة العميل (The Modal) ──────────────── */}
        {showCreateModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
          }}>
            {/* تم إضافة خلفية صريحة var(--bg, #ffffff) ولون نص واضح عشان نعالج مشكلة الشفافية */}
            <div className="db-card db-animate-in" style={{ width: '100%', maxWidth: '450px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backgroundColor: 'var(--bg, #ffffff)', color: 'var(--text, #000000)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>إضافة عميل جديد</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>اسم العميل *</label>
                  <input 
                    className="db-input" 
                    style={{ backgroundColor: 'var(--bg-elevated, #f9fafb)', color: 'inherit' }}
                    value={newCustomer.name} 
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="أدخل اسم العميل بالكامل"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>رقم الهاتف</label>
                  <input 
                    className="db-input" 
                    style={{ backgroundColor: 'var(--bg-elevated, #f9fafb)', color: 'inherit' }}
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>العنوان</label>
                  <input 
                    className="db-input" 
                    style={{ backgroundColor: 'var(--bg-elevated, #f9fafb)', color: 'inherit' }}
                    value={newCustomer.address} 
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="المحافظة / المنطقة"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button 
                  className="db-btn db-btn--gold" 
                  style={{ flex: 1 }}
                  onClick={handleCreateCustomer}
                  disabled={isSavingCustomer || !newCustomer.name.trim()}
                >
                  {isSavingCustomer ? 'جاري الحفظ...' : 'حفظ العميل'}
                </button>
                <button 
                  className="db-btn" 
                  style={{ flex: 1, background: 'var(--bg-hover, #e2e8f0)', color: 'var(--text, #000)' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dd-item-hover:hover { background: var(--bg-hover, #f1f5f9) !important; }
        .db-animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </DashboardLayout>
  );
}