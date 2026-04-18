import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import milkCollectionsService from '../../services/milkCollections.service';

// ── مخطط التحقق (Validation Schema) ────────────────────────
const schema = yup.object().shape({
  supplierId: yup.string().required('يجب اختيار المورد'),
  productId: yup.string().required('يجب اختيار المنتج'),
  quantity: yup.number()
    .typeError('يجب أن يكون رقماً')
    .positive('الكمية يجب أن تكون أكبر من 0')
    .required('الكمية مطلوبة'),
  price: yup.number()
    .typeError('يجب أن يكون رقماً')
    .positive('السعر يجب أن يكون أكبر من 0')
    .required('السعر مطلوب'),
});

const MilkCollectionForm = ({ onSuccess, onCancel }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  // تحميل القوائم عند فتح النموذج
  useEffect(() => {
    const loadLookups = async () => {
      try {
        if (milkCollectionsService) {
          const [sResponse, pResponse] = await Promise.all([
            milkCollectionsService.getSuppliers(),
            milkCollectionsService.getProducts()
          ]);

          // ✅ التصحيح: الباك-إند يرجع object جواه data، والـ data دي جواها مصفوفة data (بسبب الـ Pagination)
          const sArray = sResponse?.data?.data || sResponse?.data || [];
          const pArray = pResponse?.data?.data || pResponse?.data || [];
          
          setSuppliers(sArray);
          setProducts(pArray);
        }
      } catch (err) {
        console.error("خطأ في تحميل قوائم البيانات:", err);
      }
    };
    loadLookups();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        supplierId: parseInt(data.supplierId),
        productId: parseInt(data.productId),
        collectionDate: new Date().toISOString(),
      };
      
      await milkCollectionsService.create(payload);
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || "فشل في تسجيل عملية التوريد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="db-card" style={{ background: '#0d1420', padding: '24px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ color: '#C9A96E', fontSize: '18px', fontWeight: '800', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
        تسجيل توريد حليب خام جديد
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* حقل المورد */}
          <div className="db-field">
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>المورد</label>
            <select 
              {...register('supplierId')} 
              style={{ width: '100%', background: '#080d16', color: '#fff', border: errors.supplierId ? '1px solid #ef4444' : '1px solid #1e293b', padding: '10px', borderRadius: '8px' }}
            >
              <option value="">-- اختر المورد --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.supplierId && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '5px' }}>{errors.supplierId.message}</p>}
          </div>

          {/* حقل المنتج */}
          <div className="db-field">
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>المنتج (نوع الحليب)</label>
            <select 
              {...register('productId')} 
              style={{ width: '100%', background: '#080d16', color: '#fff', border: errors.productId ? '1px solid #ef4444' : '1px solid #1e293b', padding: '10px', borderRadius: '8px' }}
            >
              <option value="">-- اختر المنتج --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.productName}</option>
              ))}
            </select>
            {errors.productId && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '5px' }}>{errors.productId.message}</p>}
          </div>

          {/* حقل الكمية */}
          <div className="db-field">
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>الكمية (لتر/كجم)</label>
            <input 
              type="number" 
              step="0.1" 
              {...register('quantity')} 
              style={{ width: '100%', background: '#080d16', color: '#fff', border: errors.quantity ? '1px solid #ef4444' : '1px solid #1e293b', padding: '10px', borderRadius: '8px' }}
              placeholder="0.0"
            />
            {errors.quantity && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '5px' }}>{errors.quantity.message}</p>}
          </div>

          {/* حقل السعر */}
          <div className="db-field">
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>سعر الوحدة (ج.م)</label>
            <input 
              type="number" 
              step="0.01" 
              {...register('price')} 
              style={{ width: '100%', background: '#080d16', color: '#fff', border: errors.price ? '1px solid #ef4444' : '1px solid #1e293b', padding: '10px', borderRadius: '8px' }}
              placeholder="0.00"
            />
            {errors.price && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '5px' }}>{errors.price.message}</p>}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <button 
            type="button" 
            onClick={onCancel} 
            style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{ 
              background: 'linear-gradient(135deg,#d4a855,#C9A96E)', 
              color: '#080d16', 
              border: 'none', 
              padding: '10px 30px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التوريد'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MilkCollectionForm;