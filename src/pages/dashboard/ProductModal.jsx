import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config';

// ── Icons SVG ─────────────────────────────────────────────
const Icons = {
  Zap: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Print: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Close: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// ── Spinner ───────────────────────────────────────────────
const Spinner = () => (
  <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Short Code Generator: PRD-XXXX ────────────────────────
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = () => {
  const seg = Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  return `PRD-${seg}`;
};

// ── Barcode SVG (deterministic) ───────────────────────────
const BarcodeSVG = ({ value, width = 150, height = 44 }) => {
  const bars = [];
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pr = (i) => { const v = Math.sin(seed + i * 9301 + 49297) * 233280; return Math.abs(v - Math.floor(v)); };
  let x = 6;
  const bw = (width - 12) / 50;
  for (let i = 0; i < 50; i++) {
    const thick = pr(i + 100) > 0.72;
    const on = pr(i) > 0.38;
    const w = bw * (thick ? 1.9 : 1);
    if (on) bars.push(<rect key={i} x={x} y={3} width={w * 0.78} height={height - 13} fill="#000" rx="0.4" />);
    x += w;
    if (x > width - 6) break;
  }
  return (
    <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="white" />
      {bars}
      <text x={width / 2} y={height - 1} textAnchor="middle" fontSize="7" fontFamily="'Courier New', monospace" letterSpacing="0.8" fill="#000">{value}</text>
    </svg>
  );
};

// ── QR Code SVG (deterministic visual) ───────────────────
const QRCodeSVG = ({ value, size = 68 }) => {
  const G = 21;
  const cs = size / G;
  const seed = value.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const pr = (r, c) => { const v = Math.sin(seed + r * 127 + c * 311 + r * c * 7) * 99991; return Math.abs(v - Math.floor(v)); };
  const finderOn = (r, c) => {
    const inTL = r < 8 && c < 8, inTR = r < 8 && c >= G - 8, inBL = r >= G - 8 && c < 8;
    if (!inTL && !inTR && !inBL) return null;
    const lr = inBL ? r - (G - 8) : r, lc = inTR ? c - (G - 8) : c;
    if (lr === 7 || lc === 7) return false;
    return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
  };
  const cells = [];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      const f = finderOn(r, c);
      const on = f !== null ? f : pr(r, c) > 0.48;
      if (on) cells.push(<rect key={`${r}-${c}`} x={c * cs} y={r * cs} width={cs} height={cs} fill="#000" />);
    }
  }
  return (
    <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  );
};

// ── Sticker Print Modal ───────────────────────────────────
// الستيكر نظيف للعميل: اسم المنتج + باركود + QR + تاريخ الصلاحية بس
const BatchPrintModal = ({ batches, productName, productCode, onClose }) => {
  const printRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=860,height=720');
    win.document.write(
      '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">' +
      '<title>ستيكرات — ' + productName + '</title>' +
      '<style>' +
      '*{margin:0;padding:0;box-sizing:border-box}' +
      'body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;direction:rtl;background:#f0f0f0;padding:20px}' +
      '.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}' +
      '.sticker{background:#fff;border:1px dashed #ccc;border-radius:10px;padding:14px;text-align:center;page-break-inside:avoid}' +
      '@media print{body{background:none;padding:8px}.grid{gap:8px}}' +
      '</style>' +
      '</head><body>' +
      content +
      '<scr' + 'ipt>setTimeout(function(){window.print();window.close();},300);</scr' + 'ipt>' +
      '</body></html>'
    );
    win.document.close();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface,#fff)', borderRadius: '14px', width: '700px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 80px rgba(0,0,0,0.38)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>معاينة الستيكرات</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{productName} — {batches.length} دفعة</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Close />
          </button>
        </div>

        {/* Stickers Grid */}
        <div style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
          <div ref={printRef}>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {batches.map(b => {
                const batchCode  = `${productCode}-B${b.id}`;
                const expiryStr  = b.expiryDate
                  ? new Date(b.expiryDate).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
                  : null;
                // QR بيانات داخلية بس — بدون كمية أو حالة
                const qrData = `${batchCode}|EXP:${b.expiryDate || 'NA'}`;

                return (
                  <div
                    key={b.id}
                    className="sticker"
                    style={{
                      background: '#fff',
                      border: '1px dashed #d1d5db',
                      borderRadius: '10px',
                      padding: '14px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {/* اسم المنتج */}
                    <div style={{
                      fontSize: '12px', fontWeight: 700, color: '#111',
                      lineHeight: 1.35, paddingBottom: '8px',
                      borderBottom: '1px solid #f3f4f6', width: '100%'
                    }}>
                      {productName}
                    </div>

                    {/* Barcode + QR */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', justifyContent: 'center' }}>
                      <BarcodeSVG value={batchCode} width={128} height={42} />
                      <QRCodeSVG value={qrData} size={58} />
                    </div>

                    {/* تاريخ الصلاحية فقط */}
                    {expiryStr ? (
                      <div style={{
                        marginTop: '4px', paddingTop: '8px',
                        borderTop: '1px solid #f3f4f6', width: '100%',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                      }}>
                        <span style={{ fontSize: '9px', color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                          Best Before
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#111', letterSpacing: '0.5px' }}>
                          {expiryStr}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '9px', color: '#d1d5db', marginTop: '4px' }}>
                        بدون تاريخ صلاحية
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
            إلغاء
          </button>
          <button onClick={handlePrint} style={{ padding: '8px 20px', background: 'var(--text,#111)', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Icons.Print /> طباعة الكل
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────
export default function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product;
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState([]);
  const [showPrint, setShowPrint] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  // ESC يقفل المودال (بس لو مفيش print modal مفتوح فوقيه)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !showPrint) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showPrint]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/units`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(result => setUnits(result.data?.data || result.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!product?.id) return;
    fetch(`${API_BASE_URL}/api/Products/${product.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(result => {
        const data = result.data?.data || result.data || result;
        setBatches(data.batches || data.Batches || []);
      });
  }, [product]);

  const handleGenerateCode = () => {
    setIsGenerating(true);
    setTimeout(() => { setFormData(p => ({ ...p, code: generateCode() })); setIsGenerating(false); }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.unitId) { alert("الرجاء اختيار وحدة القياس"); return; }
    setIsSubmitting(true);
    const url = isEdit ? `${API_BASE_URL}/api/Products/${product.id}` : `${API_BASE_URL}/api/Products`;
    const payload = {
      name: formData.name, code: formData.code, unitId: parseInt(formData.unitId), type: 1,
      defaultPurchasePrice: parseFloat(formData.defaultPurchasePrice),
      defaultSellingPrice: parseFloat(formData.defaultSellingPrice),
      isRawMaterial: true, isManufactured: false,
      openingQuantity: !isEdit ? parseFloat(formData.openingQuantity) : null,
      openingExpiryDate: formData.openingExpiryDate || null,
      minStock: parseFloat(formData.minStock)
    };
    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) onSave();
      else alert(result.message || "حدث خطأ أثناء حفظ البيانات");
    } catch {
      alert("تعذر الاتصال بالسيرفر");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="db-modal-overlay" onClick={onClose}>
        <div className="db-card db-animate-in" style={{ width: '560px', padding: '24px', position: 'relative' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ marginBottom: '22px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text)' }}>
              {isEdit ? "تعديل بيانات المنتج" : "إضافة منتج جديد للمعمل"}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              تأكد من إدخال كود فريد لكل صنف لضمان دقة التقارير.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

              {/* Product Name */}
              <div className="db-field" style={{ gridColumn: 'span 2' }}>
                <label className="db-label">اسم المنتج</label>
                <input className="db-input" placeholder="مثال: زبادي طبيعي 150جم" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              {/* Code + Generate Button */}
              <div className="db-field">
                <label className="db-label">كود المنتج (SKU)</label>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <input className="db-input" placeholder="PRD-A3X9" value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    required style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px', fontSize: '13px' }} />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    title="توليد كود تلقائي"
                    style={{
                      flexShrink: 0, height: '38px', width: '38px',
                      background: isGenerating ? 'var(--surface-2,#f3f4f6)' : 'var(--text,#111)',
                      color: isGenerating ? 'var(--text-muted)' : '#fff',
                      border: 'none', borderRadius: '7px',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isGenerating ? <Spinner /> : <Icons.Zap />}
                  </button>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  اضغط البرق لتوليد كود — شكل: PRD-XXXX
                </p>
              </div>

              {/* Unit */}
              <div className="db-field">
                <label className="db-label">وحدة القياس</label>
                <select className="db-input" value={formData.unitId}
                  onChange={e => setFormData({ ...formData, unitId: e.target.value })} required>
                  <option value="">-- اختر الوحدة --</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {/* Prices */}
              <div className="db-field">
                <label className="db-label">سعر الشراء الافتراضي</label>
                <input type="number" step="0.01" className="db-input" value={formData.defaultPurchasePrice}
                  onChange={e => setFormData({ ...formData, defaultPurchasePrice: e.target.value })} />
              </div>

              <div className="db-field">
                <label className="db-label">سعر البيع الافتراضي</label>
                <input type="number" step="0.01" className="db-input" value={formData.defaultSellingPrice}
                  onChange={e => setFormData({ ...formData, defaultSellingPrice: e.target.value })} />
              </div>

              {/* Opening Stock (Add mode only) */}
              {!isEdit && (
                <div className="db-field" style={{ gridColumn: 'span 2' }}>
                  <label className="db-label" style={{ color: 'var(--gold)' }}>رصيد أول المدة (Opening Stock)</label>
                  <input type="number" className="db-input"
                    style={{ borderColor: 'rgba(201,169,110,0.4)', background: 'rgba(201,169,110,0.04)' }}
                    value={formData.openingQuantity}
                    onChange={e => setFormData({ ...formData, openingQuantity: e.target.value })} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div className="db-field">
                      <label className="db-label">تاريخ الصلاحية</label>
                      <input type="date" className="db-input" value={formData.openingExpiryDate}
                        onChange={e => setFormData({ ...formData, openingExpiryDate: e.target.value })} />
                    </div>
                    <div className="db-field">
                      <label className="db-label">الحد الأدنى للمخزون</label>
                      <input type="number" className="db-input" value={formData.minStock}
                        onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                    </div>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    سيتم إنشاء Batch تلقائي بهذا الرصيد بنظام FIFO.
                  </p>
                </div>
              )}
            </div>

            {/* Batches Table */}
            {batches.length > 0 && (
              <div style={{ marginTop: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="db-label" style={{ margin: 0 }}>
                    الدفعات — <span style={{ color: 'var(--gold)' }}>{batches.length}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPrint(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 13px',
                      background: 'var(--text,#111)', color: '#fff', border: 'none',
                      borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.78'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Icons.Print /> طباعة الستيكرات
                  </button>
                </div>
                <table className="db-table" style={{ width: '100%', fontSize: '12.5px' }}>
                  <thead>
                    <tr><th>الكمية</th><th>المتبقي</th><th>الصلاحية</th><th>الحالة</th></tr>
                  </thead>
                  <tbody>
                    {batches.map(b => {
                      const st = b.isExpired
                        ? { text: 'منتهي', color: '#dc2626', bg: '#fef2f2' }
                        : b.isNearExpiry
                        ? { text: 'قرب ينتهي', color: '#d97706', bg: '#fffbeb' }
                        : { text: 'سليم', color: '#16a34a', bg: '#f0fdf4' };
                      return (
                        <tr key={b.id}>
                          <td>{b.quantity}</td>
                          <td>{b.remainingQuantity}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                            {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('ar-EG') : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px', background: st.bg, color: st.color }}>
                              {st.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ marginTop: '28px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button type="button" className="db-btn db-btn--ghost" onClick={onClose} disabled={isSubmitting}>إلغاء</button>
              <button type="submit" className="db-btn db-btn--gold" disabled={isSubmitting} style={{ minWidth: '130px' }}>
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'center' }}>
                    <Spinner /> جاري الحفظ...
                  </div>
                ) : "حفظ البيانات"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Print Modal */}
      {showPrint && (
        <BatchPrintModal
          batches={batches}
          productName={formData.name}
          productCode={formData.code}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
}