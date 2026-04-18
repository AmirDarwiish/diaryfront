import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';

// ── أيقونة التحميل (Spinner) ────────────────────────────────
const Spinner = () => (
  <div className="db-spinner" style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product;
  
  // ── States ────────────────────────────────────────────────
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState([]);
const [formData, setFormData] = useState({
  name: product?.name || '',
  code: product?.code || '',
  unitId: product?.unitId || '',
  defaultPurchasePrice: product?.defaultPurchasePrice || 0,
  defaultSellingPrice: product?.defaultSellingPrice || 0,
  type: 1,
  openingQuantity: 0,
  openingExpiryDate: '',
  minStock: product?.minStock || 0,
  isRawMaterial: true,
  isManufactured: false
});

  // ── جلب الوحدات عند الفتح ──────────────────────────────────
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/units`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await res.json();
        setUnits(result.data?.data || result.data || []);
      } catch (error) {
        console.error("Units Fetch Error:", error);
      }
    };
    fetchUnits();
  }, []);
  useEffect(() => {
  if (!product?.id) return;
fetch(`${API_BASE_URL}/api/Products/${product.id}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})
  .then(res => res.json())
  .then(result => {
    console.log("FULL RESULT:", result);

    const data = result.data?.data || result.data || result;

    setBatches(data.batches || data.Batches || []);
  });

},
 [product]);

  // ── معالج الحفظ (الحل النهائي للتهنيج والتكرار) ───────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. منع الإرسال المتكرر
    if (isSubmitting) return;

    // 2. التحقق من البيانات الأساسية
    if (!formData.unitId) {
      alert("الرجاء اختيار وحدة القياس");
      return;
    }

    setIsSubmitting(true);

    const url = isEdit ? `${API_BASE_URL}/api/Products/${product.id}` : `${API_BASE_URL}/api/Products`;
    const method = isEdit ? 'PUT' : 'POST';

    // 3. تجهيز الـ Payload (ضمان أنواع البيانات)
const payload = {
  name: formData.name,
  code: formData.code,
  unitId: parseInt(formData.unitId),
  type: 1,
  defaultPurchasePrice: parseFloat(formData.defaultPurchasePrice),
  defaultSellingPrice: parseFloat(formData.defaultSellingPrice),
  isRawMaterial: true,
  isManufactured: false,
  openingQuantity: !isEdit ? parseFloat(formData.openingQuantity) : null,
  openingExpiryDate: formData.openingExpiryDate || null,
  minStock: parseFloat(formData.minStock)
};
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        onSave(); // نجاح: أغلق المودال وحدّث الجدول
      } else {
        // فشل (مثل كود مكرر): اظهر الرسالة من السيرفر
        alert(result.message || "حدث خطأ أثناء حفظ البيانات");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("تعذر الاتصال بالسيرفر، تأكد من اتصالك بالإنترنت");
    } finally {
      setIsSubmitting(false); // إعادة تفعيل الأزرار
    }
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-card db-animate-in" style={{ width: '550px', padding: '24px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)' }}>
            {isEdit ? "تعديل بيانات المنتج" : "إضافة منتج جديد للمعمل"}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            تأكد من إدخال كود فريد لكل صنف لضمان دقة التقارير.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="db-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div className="db-field" style={{ gridColumn: 'span 2' }}>
              <label className="db-label">اسم المنتج</label>
              <input 
                className="db-input" 
                placeholder="مثال: زبادي طبيعي 150جم"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>

            <div className="db-field">
              <label className="db-label">كود المنتج (Barcode/SKU)</label>
              <input 
                className="db-input" 
                placeholder="YO-100"
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                required 
              />
            </div>

            <div className="db-field">
              <label className="db-label">وحدة القياس</label>
              <select 
                className="db-input" 
                value={formData.unitId} 
                onChange={e => setFormData({...formData, unitId: e.target.value})}
                required
              >
                <option value="">-- اختر الوحدة --</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="db-field">
              <label className="db-label">سعر الشراء الافتراضي</label>
              <input 
                type="number" step="0.01" className="db-input" 
                value={formData.defaultPurchasePrice} 
                onChange={e => setFormData({...formData, defaultPurchasePrice: e.target.value})} 
              />
            </div>

            <div className="db-field">
              <label className="db-label">سعر البيع الافتراضي</label>
              <input 
                type="number" step="0.01" className="db-input" 
                value={formData.defaultSellingPrice} 
                onChange={e => setFormData({...formData, defaultSellingPrice: e.target.value})} 
              />
            </div>

            {!isEdit && (
              <div className="db-field" style={{ gridColumn: 'span 2' }}>
                <label className="db-label" style={{ color: 'var(--gold)' }}>رصيد أول المدة (Opening Stock)</label>
                <input 
                  type="number" className="db-input" 
                  style={{ borderColor: 'rgba(201, 169, 110, 0.4)', background: 'rgba(201, 169, 110, 0.05)' }} 
                  value={formData.openingQuantity} 
                  onChange={e => setFormData({...formData, openingQuantity: e.target.value})} 
                />
                <div className="db-field" style={{ gridColumn: 'span 2' }}>
  <label className="db-label">تاريخ الصلاحية</label>
  <input
    type="date"
    className="db-input"
    value={formData.openingExpiryDate}
    onChange={e => setFormData({...formData, openingExpiryDate: e.target.value})}
  />
</div>
<div className="db-field">
  <label className="db-label">الحد الأدنى للمخزون</label>
  <input
    type="number"
    className="db-input"
    value={formData.minStock}
    onChange={e => setFormData({...formData, minStock: e.target.value})}
  />
</div>
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
                  سيتم إنشاء Batch تلقائي بهذا الرصيد بنظام FIFO.
                </p>
              </div>
            )}
          </div>
          
{batches.length > 0 && (
  <table className="db-table" style={{ marginTop: '20px' }}>
    <thead>
      <tr>
        <th>الكمية</th>
        <th>المتبقي</th>
        <th>الصلاحية</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      {batches.map(b => (
        <tr key={b.id}>
          <td>{b.quantity}</td>
          <td>{b.remainingQuantity}</td>
          <td>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "-"}</td>
          <td>
            {b.isExpired ? "منتهي" : b.isNearExpiry ? "قرب ينتهي" : "سليم"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

          {/* Footer Actions */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button 
              type="button" 
              className="db-btn db-btn--ghost" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="db-btn db-btn--gold" 
              disabled={isSubmitting}
              style={{ minWidth: '140px' }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Spinner /> جاري الحفظ...
                </div>
              ) : (
                "حفظ البيانات"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}