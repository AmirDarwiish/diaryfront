import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import API_BASE_URL from '../../config';

// ── الأيقونات ─────────────────────────────────────────────
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const IconFilePlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);
const IconPrint = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);

// ── دالة طباعة الفاتورة (نظيفة للعميل) ──────────────────
const printInvoice = (sale) => {
  const items = (sale.items || []).map(item => `
    <tr>
      <td>${item.productName}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${item.sellingPrice?.toLocaleString()} EGP</td>
      <td class="center bold">${item.totalPrice?.toLocaleString()} EGP</td>
    </tr>`).join('');

  const dateStr = new Date(sale.createdAt).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
  const customerName = sale.customerName || (sale.customerId ? `عميل #${sale.customerId}` : 'نقدي');

  const win = window.open('', '_blank', 'width=750,height=700');
  win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
  <title>فاتورة #${sale.id}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;direction:rtl;padding:40px;color:#111;background:#fff}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #111}
    .company{font-size:22px;font-weight:900}
    .inv-meta{text-align:left;font-size:12px;color:#555}
    .inv-meta strong{color:#111;font-size:14px;display:block;margin-bottom:3px}
    .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px}
    .meta-box{background:#f9fafb;border-radius:8px;padding:12px 14px}
    .meta-box .lbl{font-size:10px;color:#9ca3af;margin-bottom:3px}
    .meta-box .val{font-size:13px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
    thead tr{background:#f3f4f6}
    th{padding:10px 14px;text-align:right;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb}
    td{padding:11px 14px;font-size:13px;border-bottom:1px solid #f3f4f6}
    td.center{text-align:center;color:#6b7280}
    td.bold{font-weight:800;color:#111}
    .total-box{display:inline-flex;align-items:baseline;gap:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 24px;margin-bottom:36px}
    .total-box .lbl{font-size:12px;color:#92400e}
    .total-box .val{font-size:22px;font-weight:900;color:#b45309}
    .footer{text-align:center;font-size:11px;color:#9ca3af;padding-top:20px;border-top:1px solid #e5e7eb}
    @media print{body{padding:24px}}
  </style>
  </head><body>
  <div class="header">
    <div class="company">فاتورة مبيعات</div>
    <div class="inv-meta">
      <strong>#${sale.id}</strong>
      ${dateStr}
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-box"><div class="lbl">العميل</div><div class="val">${customerName}</div></div>
    <div class="meta-box"><div class="lbl">رقم الفاتورة</div><div class="val">#${sale.id}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>المنتج</th>
        <th style="text-align:center">الكمية</th>
        <th style="text-align:center">سعر الوحدة</th>
        <th style="text-align:center">الإجمالي</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total-box">
    <span class="lbl">إجمالي الفاتورة</span>
    <span class="val">${sale.totalAmount?.toLocaleString()} EGP</span>
  </div>
  <div class="footer">شكراً لتعاملكم معنا</div>
  <scr` + `ipt>setTimeout(function(){window.print();window.close();},300);</scr` + `ipt>
  </body></html>`);
  win.document.close();
};

// ── Main Component ────────────────────────────────────────
export default function SalesList() {
  const navigate = useNavigate();

  const [sales, setSales]               = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [stats, setStats]               = useState({ totalCount: 0, totalRevenue: 0, todaySales: 0 });
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/Sales`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const salesData = data.data || data || [];
          setSales(salesData);
          setFilteredSales(salesData);
          const totalRevenue = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          const today = new Date().toISOString().split('T')[0];
          const todaySales = salesData.filter(s => (s.createdAt || s.date || '').includes(today)).length;
          setStats({ totalCount: salesData.length, totalRevenue, todaySales });
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSales();
  }, []);

  useEffect(() => {
    setFilteredSales(
      sales.filter(s =>
        s.id.toString().includes(searchTerm) ||
        (s.customerId && s.customerId.toString().includes(searchTerm)) ||
        (s.customerName && s.customerName.includes(searchTerm))
      )
    );
  }, [searchTerm, sales]);

  const openSaleModal = async (saleId) => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/Sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  // ESC يقفل المودال
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          <IconFilePlus /> إنشاء فاتورة جديدة
        </button>
      }
    >
      <div className="db-page">

        {/* ── Stats ──────────────────────────────────────────── */}
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

        {/* ── Search ─────────────────────────────────────────── */}
        <div className="db-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="db-input"
              placeholder="البحث برقم الفاتورة أو اسم العميل..."
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

        {/* ── Table ──────────────────────────────────────────── */}
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
                    <th>القيمة</th>
                    <th style={{ textAlign: 'center' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>
                        لا توجد بيانات متطابقة مع البحث
                      </td>
                    </tr>
                  ) : filteredSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="db-fw-800">#{sale.id}</td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(sale.createdAt || sale.date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td>
                        {sale.customerId ? (
                          <span className="db-badge db-badge--interested">
                            {sale.customerName || `عميل #${sale.customerId}`}
                          </span>
                        ) : (
                          <span className="db-badge db-badge--cold">نقدي</span>
                        )}
                      </td>
                      <td className="db-fw-800 db-text-gold">
                        {sale.totalAmount?.toLocaleString()} <span style={{ fontSize: '10px' }}>EGP</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="db-btn--icon"
                          title="عرض الفاتورة"
                          onClick={() => openSaleModal(sale.id)}
                        >
                          <IconEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Invoice Modal (نظيف للعميل) ──────────────────────── */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card, #fff)', borderRadius: '16px', padding: '32px', width: '660px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl', boxShadow: '0 28px 80px rgba(0,0,0,0.32)' }}
          >
            {modalLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                جاري التحميل...
              </div>
            ) : selectedSale && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: 'var(--text, #111)' }}>
                      فاتورة رقم #{selectedSale.id}
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {new Date(selectedSale.createdAt).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: '1px solid var(--border, #e5e7eb)', borderRadius: '7px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                </div>

                {/* بيانات العميل */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
                  {[
                    { label: 'العميل', value: selectedSale.customerName || (selectedSale.customerId ? `عميل #${selectedSale.customerId}` : 'نقدي') },
                    { label: 'رقم الفاتورة', value: `#${selectedSale.id}` },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--surface-2, #f9fafb)', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>{item.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text, #111)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* جدول المنتجات — بدون تكلفة أو ربح */}
                <div style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2, #f9fafb)' }}>
                        {['المنتج', 'الكمية', 'سعر الوحدة', 'الإجمالي'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', textAlign: i === 0 ? 'right' : 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', borderBottom: '1px solid var(--border, #e5e7eb)', width: i === 0 ? 'auto' : '110px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSale.items || []).map((item, i, arr) => (
                        <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border, #f3f4f6)' : 'none' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text, #111)' }}>{item.productName}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.quantity}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.sellingPrice?.toLocaleString()} EGP</td>
                          <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: 'var(--text, #111)' }}>{item.totalPrice?.toLocaleString()} EGP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* الإجمالي فقط */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: '10px', padding: '14px 24px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>إجمالي الفاتورة</span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gold, #c9a96e)' }}>
                      {selectedSale.totalAmount?.toLocaleString()} EGP
                    </span>
                  </div>
                </div>

                {/* الأزرار */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '18px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '8px 18px', border: '1px solid var(--border, #e5e7eb)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={() => printInvoice(selectedSale)}
                    style={{ padding: '8px 20px', background: 'var(--text, #111)', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}
                  >
                    <IconPrint /> طباعة الفاتورة
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