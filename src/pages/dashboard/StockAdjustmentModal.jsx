import { useState } from 'react';
import API_BASE_URL from '../../config';

const Spinner = () => (
  <div style={{ width:14, height:14, border:'2px solid rgba(0,0,0,0.2)', 
                borderTopColor:'#000', borderRadius:'50%', 
                animation:'spin 0.6s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function StockAdjustmentModal({ product, onClose, onSave }) {
const [form, setForm] = useState({ quantity: '', type: 1, reason: '', expiryDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      setError('الكمية يجب أن تكون أكبر من صفر'); return;
    }
    if (!form.reason.trim()) {
      setError('سبب التسوية مطلوب'); return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/Products/${product.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          quantity: parseFloat(form.quantity),
          type: parseInt(form.type),
          reason: form.reason,
            expiryDate: form.expiryDate || null 
        })
      });
      const data = await res.json();
      if (res.ok) { onSave(); }
      else { setError(data.message || 'حدث خطأ'); }
    } catch {
      setError('تعذر الاتصال بالسيرفر');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-card db-animate-in" style={{ width:480, padding:24 }}>
        
        {/* Header */}
        <div style={{ marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:14 }}>
          <h3 style={{ fontSize:17, fontWeight:900, color:'var(--text)' }}>
            تسوية مخزون — {product.name}
          </h3>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
            المخزون الحالي: <strong style={{ color:'var(--gold)' }}>{product.stock} {product.unit}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* النوع */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[{ val:1, label:'إضافة للمخزون', color:'var(--green)' },
              { val:2, label:'خصم من المخزون', color:'var(--red)' }
            ].map(opt => (
              <div
                key={opt.val}
                onClick={() => setForm({...form, type: opt.val})}
                style={{
                  padding:'12px 16px', borderRadius:10, cursor:'pointer', textAlign:'center',
                  fontWeight:800, fontSize:13, transition:'all .15s',
                  border: `2px solid ${form.type === opt.val ? opt.color : 'var(--border)'}`,
                  background: form.type === opt.val ? `${opt.color}15` : 'transparent',
                  color: form.type === opt.val ? opt.color : 'var(--text-muted)'
                }}
              >
                {opt.val === 1 ? '+ ' : '- '}{opt.label}
              </div>
            ))}
          </div>

          {/* الكمية */}
          <div style={{ marginBottom:14 }}>
            <label className="db-label">الكمية</label>
            <input
              type="number" step="0.01" className="db-input"
              placeholder="0.00"
              value={form.quantity}
              onChange={e => setForm({...form, quantity: e.target.value})}
              style={{ 
                borderColor: form.type === 1 ? 'rgba(52,211,153,.4)' : 'rgba(248,113,113,.4)',
                fontWeight:800, fontSize:16
              }}
            />
            {/* تاريخ الصلاحية — يظهر فقط عند الإضافة */}
{form.type === 1 && (
  <div style={{ marginBottom: 14 }}>
    <label className="db-label">تاريخ الصلاحية (اختياري)</label>
    <input
      type="date"
      className="db-input"
      value={form.expiryDate}
      onChange={e => setForm({ ...form, expiryDate: e.target.value })}
    />
  </div>
)}
          </div>

          {/* السبب */}
          <div style={{ marginBottom:14 }}>
            <label className="db-label">سبب التسوية</label>
            <select
              className="db-input"
              value={form.reason}
              onChange={e => setForm({...form, reason: e.target.value})}
            >
              <option value="">-- اختر السبب --</option>
              <optgroup label="إضافة">
                <option value="جرد فعلي زيادة">جرد فعلي — زيادة</option>
                <option value="إرجاع من عميل">إرجاع من عميل</option>
                <option value="تصحيح خطأ إدخال">تصحيح خطأ إدخال</option>
              </optgroup>
              <optgroup label="خصم">
                <option value="جرد فعلي نقص">جرد فعلي — نقص</option>
                <option value="تالف أو منتهي الصلاحية">تالف أو منتهي الصلاحية</option>
                <option value="هدية أو عينة">هدية أو عينة</option>
                <option value="تصحيح خطأ إدخال">تصحيح خطأ إدخال</option>
              </optgroup>
            </select>
          </div>

          {/* ملاحظة إضافية */}
          <div style={{ marginBottom:14 }}>
            <label className="db-label">ملاحظة إضافية (اختياري)</label>
            <input
              className="db-input"
              placeholder="أي تفاصيل إضافية..."
              onChange={e => setForm({...form, reason: form.reason + (e.target.value ? ` — ${e.target.value}` : '')})}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:14,
                          background:'var(--red-bg)', color:'var(--red)', 
                          fontSize:13, fontWeight:700 }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', 
                        borderTop:'1px solid var(--border)', paddingTop:16, marginTop:8 }}>
            <button type="button" className="db-btn db-btn--ghost" 
                    onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                minWidth:140, padding:'9px 20px', borderRadius:9, border:'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight:800, fontSize:13, fontFamily:'inherit',
                background: form.type === 1 ? 'var(--green)' : 'var(--red)',
                color:'#fff', display:'flex', alignItems:'center', 
                gap:8, justifyContent:'center'
              }}
            >
              {isSubmitting ? <><Spinner /> جاري الحفظ...</> 
                            : form.type === 1 ? '+ تأكيد الإضافة' : '- تأكيد الخصم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}