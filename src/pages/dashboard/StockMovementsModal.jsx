import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';

export default function StockMovementsModal({ product, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0 });

  useEffect(() => {
    fetchMovements();
  }, [page]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE_URL}/api/Products/${product.id}/movements?page=${page}&pageSize=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        const result = data.data || data;
        setMovements(result.data || []);
        setTotal(result.total || 0);

        const allData = result.data || [];
        const totalIn = allData.filter(m => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
        const totalOut = allData.filter(m => m.quantity < 0).reduce((s, m) => s + m.quantity, 0);
        setStats({ totalIn, totalOut });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (type) => {
    const map = {
      'وارد':      { cls: 'badge-in',        dot: '#1D9E75' },
      'صادر':      { cls: 'badge-out',       dot: '#D85A30' },
      'تسوية +':   { cls: 'badge-adj-plus',  dot: '#639922' },
      'تسوية -':   { cls: 'badge-adj-minus', dot: '#BA7517' },
    };
    return map[type] || { cls: 'badge-in', dot: '#1D9E75' };
  };

  return (
    <>
      <style>{`
        .sm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;direction:rtl}
        .sm-modal{background:var(--bg-card);border-radius:16px;width:720px;max-width:95vw;max-height:88vh;overflow:hidden;display:flex;flex-direction:column}
        .sm-header{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
        .sm-header h2{font-size:15px;font-weight:800}
        .sm-header h2 span{color:var(--text-muted);font-weight:400}
        .sm-close{background:none;border:none;cursor:pointer;font-size:20px;color:var(--text-muted);padding:4px 8px;border-radius:8px}
        .sm-close:hover{background:var(--bg-base)}
        .sm-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px 22px;border-bottom:1px solid var(--border)}
        .sm-stat{background:var(--bg-base);border-radius:10px;padding:10px 14px}
        .sm-stat-label{font-size:11px;color:var(--text-faint);margin-bottom:4px}
        .sm-stat-val{font-size:20px;font-weight:800}
        .sm-table-wrap{overflow-y:auto;flex:1}
        .sm-table{width:100%;border-collapse:collapse;font-size:13px}
        .sm-table thead th{padding:10px 16px;text-align:right;font-size:12px;color:var(--text-muted);border-bottom:1px solid var(--border);background:var(--bg-base);position:sticky;top:0;font-weight:600}
        .sm-table tbody td{padding:11px 16px;border-bottom:1px solid var(--border);color:var(--text)}
        .sm-table tbody tr:last-child td{border-bottom:none}
        .sm-table tbody tr:hover{background:var(--bg-base)}
        .sm-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600}
        .badge-in{background:#E1F5EE;color:#0F6E56}
        .badge-out{background:#FAECE7;color:#993C1D}
        .badge-adj-plus{background:#EAF3DE;color:#3B6D11}
        .badge-adj-minus{background:#FAEEDA;color:#854F0B}
        .sm-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
        .sm-footer{display:flex;justify-content:space-between;align-items:center;padding:12px 22px;border-top:1px solid var(--border)}
        .sm-footer span{font-size:12px;color:var(--text-muted)}
        .sm-pag{display:flex;gap:6px}
        .sm-pag button{background:none;border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;color:var(--text)}
        .sm-pag button:disabled{opacity:0.35;cursor:default}
      `}</style>

      <div className="sm-overlay" onClick={onClose}>
        <div className="sm-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sm-header">
            <h2>حركات المخزون — <span>{product.name}</span></h2>
            <button className="sm-close" onClick={onClose}>✕</button>
          </div>

          {/* Stats */}
          <div className="sm-stats">
            <div className="sm-stat">
              <div className="sm-stat-label">إجمالي وارد</div>
              <div className="sm-stat-val" style={{ color: 'var(--green)' }}>+{stats.totalIn}</div>
            </div>
            <div className="sm-stat">
              <div className="sm-stat-label">إجمالي صادر</div>
              <div className="sm-stat-val" style={{ color: 'var(--red)' }}>{stats.totalOut}</div>
            </div>
            <div className="sm-stat">
              <div className="sm-stat-label">الرصيد الحالي</div>
              <div className="sm-stat-val" style={{ color: 'var(--blue)' }}>{product.stock} <small style={{ fontSize: '12px' }}>{product.unit}</small></div>
            </div>
          </div>

          {/* Table */}
          <div className="sm-table-wrap">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
            ) : (
              <table className="sm-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المصدر</th>
                    <th>الكمية</th>
                    <th>التكلفة</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>لا توجد حركات</td></tr>
                  ) : movements.map((m, i) => {
                    const badge = getBadge(m.type);
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(m.date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                          <br />
                          <span style={{ fontSize: '11px' }}>{new Date(m.date).toLocaleTimeString('ar-EG', { timeStyle: 'short' })}</span>
                        </td>
                        <td>
                          <span className={`sm-badge ${badge.cls}`}>
                            <span className="sm-dot" style={{ background: badge.dot }}></span>
                            {m.type}
                          </span>
                        </td>
                        <td>{m.source}</td>
                        <td style={{ fontWeight: 800, color: m.quantity >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {m.quantity >= 0 ? '+' : ''}{m.quantity}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {m.cost > 0 ? `${m.cost.toLocaleString()} EGP` : '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{m.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="sm-footer">
            <span>إجمالي {total} حركة</span>
            <div className="sm-pag">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</button>
              <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>التالي</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}