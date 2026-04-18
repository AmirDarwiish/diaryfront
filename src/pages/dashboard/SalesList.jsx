  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import DashboardLayout from './DashboardLayout'; 
  import API_BASE_URL from '../../config';

  // ── الأيقونات (SVG Icons) ────────────────
  const IconSearch = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  );
  const IconEye = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  );
  const IconFilePlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
  );

  export default function SalesList() {
    const navigate = useNavigate();
    
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalCount: 0, totalRevenue: 0, todaySales: 0 });

    useEffect(() => {
      const fetchSales = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/api/Sales`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            const salesData = data.data || data || [];
            setSales(salesData);
            setFilteredSales(salesData);
            calculateStats(salesData);
          }
        } catch (err) {
          console.error("Error fetching sales:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSales();
    }, []);

    useEffect(() => {
      const results = sales.filter(sale => 
        sale.id.toString().includes(searchTerm) || 
        (sale.customerId && sale.customerId.toString().includes(searchTerm))
      );
      setFilteredSales(results);
    }, [searchTerm, sales]);

    const calculateStats = (data) => {
      const totalRevenue = data.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const todaySales = data.filter(s => (s.createdAt || s.date).includes(today)).length;
      
      setStats({
        totalCount: data.length,
        totalRevenue: totalRevenue,
        todaySales: todaySales
      });
    };
    const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const openSaleModal = async (saleId) => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/Sales/${saleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSale(data.data || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

    return (
      <DashboardLayout 
        title="سجل المبيعات" 
        breadcrumb="الرئيسية / المبيعات"
        headerActions={
          <button 
            className="db-btn db-btn--gold" 
            onClick={() => navigate('/dashboard/sales/new')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconFilePlus />
            إنشاء فاتورة جديدة
          </button>
        }
      >
        <div className="db-page">

          {/* ── Stats Section ────────────────────────────────── */}
          <div className="db-stats">
            <div className="db-stat">
              <div className="db-stat__accent" style={{ background: 'var(--blue)' }}></div>
              <div className="db-stat__value">{stats.totalCount}</div>
              <div className="db-stat__label">إجمالي الفواتير</div>
            </div>
            <div className="db-stat">
              <div className="db-stat__accent" style={{ background: 'var(--gold)' }}></div>
              <div className="db-stat__value">
                {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                <span style={{ fontSize: '12px', marginRight: '4px' }}>EGP</span>
              </div>
              <div className="db-stat__label">إجمالي الإيرادات</div>
            </div>
            <div className="db-stat">
              <div className="db-stat__accent" style={{ background: 'var(--green)' }}></div>
              <div className="db-stat__value">{stats.todaySales}</div>
              <div className="db-stat__label">فواتير اليوم</div>
            </div>
          </div>

          {/* ── Filters & Search ────────────────────────────── */}
          <div className="db-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="db-input" 
                placeholder="البحث برقم الفاتورة أو رقم العميل..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>
                <IconSearch />
              </span>
            </div>
            <button className="db-btn db-btn--ghost">تصفية متقدمة</button>
          </div>

          {/* ── Sales Table ─────────────────────────────────── */}
          <div className="db-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800 }}>قائمة العمليات الأخيرة</h3>
              <span className="db-badge" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                عرض {filteredSales.length} فاتورة
              </span>
            </div>

            {isLoading ? (
              <div className="db-loading">
                <div className="db-spinner" style={{ width: 24, height: 24, border: '3px solid var(--gold-08)', borderTopColor: 'var(--gold)', borderRadius: '50%', marginBottom: '10px' }}></div>
                جاري تحميل البيانات...
              </div>
            ) : (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>التاريخ</th>
                      <th>العميل</th>
                      <th>التكلفة</th>
                      <th>القيمة</th>
                      <th>الربح</th>
                      <th style={{ textAlign: 'center' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>لا توجد بيانات متطابقة مع البحث</td>
                      </tr>
                    ) : (
                      filteredSales.map(sale => {
                        const profit = (sale.totalAmount || 0) - (sale.totalCost || 0);
                        return (
                          <tr key={sale.id}>
                            <td className="db-fw-800">#{sale.id}</td>
                            <td style={{ fontSize: '12px' }}>{new Date(sale.createdAt || sale.date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                            <td>
                              {sale.customerId ? (
  <span className="db-badge db-badge--interested">
    {sale.customerName || (sale.customerId ? `عميل #${sale.customerId}` : 'نقدي')}
  </span>                            ) : (
                                <span className="db-badge db-badge--cold">نقدي</span>
                              )}
                            </td>
                            <td className="db-text-muted">{sale.totalCost?.toLocaleString()} <span style={{fontSize: '10px'}}>EGP</span></td>
                            <td className="db-fw-800 db-text-gold">{sale.totalAmount?.toLocaleString()} <span style={{fontSize: '10px'}}>EGP</span></td>
                            <td>
                              <span style={{ 
                                color: profit >= 0 ? 'var(--green)' : 'var(--red)', 
                                fontWeight: 800,
                                fontSize: '13px'
                              }}>
                                {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
  <button className="db-btn--icon" title="عرض التفاصيل / طباعة"
    onClick={() => openSaleModal(sale.id)}>
    <IconEye />
  </button>                          </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {isModalOpen && (
    <div onClick={() => setIsModalOpen(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: '16px', padding: '32px',
        width: '700px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
        direction: 'rtl'
      }}>
        {modalLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري التحميل...
          </div>
        ) : selectedSale && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>تفاصيل الفاتورة #{selectedSale.id}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{
                background: 'none', border: 'none', fontSize: '22px',
                cursor: 'pointer', color: 'var(--text-muted)'
              }}>✕</button>
            </div>

            {/* بيانات الفاتورة */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'رقم الفاتورة', value: `#${selectedSale.id}` },
                { label: 'التاريخ', value: new Date(selectedSale.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) },
                { label: 'العميل', value: selectedSale.customerName || (selectedSale.customerId ? `عميل #${selectedSale.customerId}` : 'نقدي') },            ].map((item, i) => (
                <div key={i} className="db-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* المنتجات */}
            <div className="db-card" style={{ padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>المنتجات</h3>
              <table className="db-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>سعر البيع</th>
                    <th>الإجمالي</th>
                    <th>التكلفة</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSale.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{item.sellingPrice?.toLocaleString()} EGP</td>
                      <td className="db-text-gold db-fw-800">{item.totalPrice?.toLocaleString()} EGP</td>
                      <td className="db-text-muted">{item.totalCost?.toLocaleString()} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* الملخص */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'إجمالي القيمة', value: `${selectedSale.totalAmount?.toLocaleString()} EGP`, color: 'var(--gold)' },
                { label: 'إجمالي التكلفة', value: `${selectedSale.totalCost?.toLocaleString()} EGP`, color: 'var(--text-muted)' },
                { label: 'صافي الربح', value: `${((selectedSale.totalAmount || 0) - (selectedSale.totalCost || 0)).toLocaleString()} EGP`, color: (selectedSale.totalAmount - selectedSale.totalCost) >= 0 ? 'var(--green)' : 'var(--red)' },
              ].map((item, i) => (
                <div key={i} className="db-card" style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* زرار الطباعة */}
            <div style={{ textAlign: 'center' }}>
              <button className="db-btn db-btn--gold" onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                🖨️ طباعة الفاتورة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )}
      </DashboardLayout>
    );
  }