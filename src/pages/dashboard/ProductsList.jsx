import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout'; // تأكد من المسار الصحيح
import API_BASE_URL from '../../config';
import ProductModal from './ProductModal'; // تأكد من وجود الملف بجانبه
import StockAdjustmentModal from './StockAdjustmentModal';
import StockMovementsModal from './StockMovementsModal';
// ── تعريف الأيقونات (Icons) داخل الملف لمنع خطأ الـ Reference ────────
const Icons = {
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  )
};

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [movementsProduct, setMovementsProduct] = useState(null);


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/Products?Page=${page}&PageSize=10&Search=${searchTerm}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const result = await res.json();
      if (res.ok) {
        // فك الـ Data بناءً على ApiResponse<object> في الـ C#
        setProducts(result.data?.data || []);
        setTotal(result.data?.total || 0);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500); // Debounce للبحث
    return () => clearTimeout(delayDebounceFn);
  }, [page, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/Products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchProducts();
    } catch (error) { console.error(error); }
  };

  return (
    <DashboardLayout 
      title="مستودع المنتجات" 
      breadcrumb="الداشبورد / المنتجات"
      headerActions={
        <button className="db-btn db-btn--gold" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Plus /> إضافة منتج
          </span>
        </button>
      }
    >
      <div className="db-page">
        {/* شريط البحث */}
        <div className="db-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>
              <Icons.Search />
            </span>
            <input 
              className="db-input" 
              style={{ paddingRight: '45px' }} 
              placeholder="ابحث باسم المنتج أو الكود..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* الجدول */}
        <div className="db-card" style={{ padding: 0 }}>
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكود</th>
                  <th>المخزن</th>
                  <th>سعر البيع</th>
                  <th>الحالة</th>
                  <th style={{ textAlign: 'center' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>جاري جلب البيانات من Zeiia Server...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>لا توجد منتجات مطابقة.</td></tr>
                ) : products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--gold)' }}><Icons.Box /></div>
                        <span style={{ fontWeight: 800 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{p.code}</td>
                    <td style={{ fontWeight: 900 }}>{p.stock} <small>{p.unit}</small></td>
                    <td style={{ color: 'var(--gold)', fontWeight: 800 }}>{p.defaultSellingPrice?.toLocaleString()} EGP</td>
                    <td>
                      <span className={`db-status ${p.isActive ? 'active' : 'inactive'}`}>
                        {p.isActive ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="db-btn--icon" onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}><Icons.Edit /></button>
                        <button className="db-btn--icon" style={{ color: 'var(--red)' }} onClick={() => handleDelete(p.id)}><Icons.Trash /></button>
                        <button 
  className="db-btn--icon" 
  title="تسوية مخزون"
  style={{ color:'var(--teal)' }} 
  onClick={() => setAdjustingProduct(p)}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19 12 12 19 5 12"/>
  </svg>
</button>
<button
  className="db-btn--icon"
  title="حركات المخزون"
  style={{ color: 'var(--blue)' }}
  onClick={() => setMovementsProduct(p)}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
</button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="db-table-footer">
            <span>إجمالي النتائج: {total}</span>
            <div className="db-pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</button>
              <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>التالي</button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSave={() => { setIsModalOpen(false); fetchProducts(); }} 
        />
        
      )}
      {adjustingProduct && (
  <StockAdjustmentModal
    product={adjustingProduct}
    onClose={() => setAdjustingProduct(null)}
    onSave={() => { setAdjustingProduct(null); fetchProducts(); }}
  />
)}
{movementsProduct && (
  <StockMovementsModal
    product={movementsProduct}
    onClose={() => setMovementsProduct(null)}
  />
)}
      
    </DashboardLayout>
  );
}