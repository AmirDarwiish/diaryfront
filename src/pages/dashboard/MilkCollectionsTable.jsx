import React from 'react';

const thStyle = { padding: '14px 16px', color: '#6b7891', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' };
const tdStyle = { padding: '13px 16px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' };

const MilkCollectionsTable = ({ data, loading, onPageChange, pagination }) => {

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', color: '#6b7891' }}>
        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(201,169,110,0.2)', borderTopColor: '#C9A96E', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '15px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>جاري تحميل سجلات التوريد...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#6b7891' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
        <p style={{ fontSize: '14px' }}>لا توجد سجلات توريد حليب حالياً.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0d1420', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>المورد</th>
              <th style={thStyle}>نوع المنتج</th>
              <th style={thStyle}>تاريخ التوريد</th>
              <th style={thStyle}>الكمية (لتر)</th>
              <th style={thStyle}>السعر / لتر</th>
              <th style={thStyle}>الإجمالي</th>
              <th style={thStyle}>الدهون %</th>
              <th style={thStyle}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.Id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>

                <td style={{ ...tdStyle, color: '#334155' }}>{index + 1}</td>

                <td style={{ ...tdStyle, fontWeight: '800', color: '#e8edf5' }}>
                  {item.Supplier}
                </td>

                <td style={tdStyle}>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '4px' }}>
                    {item.Product}
                  </span>
                </td>

                <td style={tdStyle}>
                  <span style={{ fontSize: '11px', color: '#6b7891', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '5px' }}>
                    {new Date(item.Date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </td>

                <td style={{ ...tdStyle, color: '#fff', fontWeight: 'bold' }}>
                  {item.Quantity} <small style={{ color: '#6b7891' }}>لتر</small>
                </td>

                <td style={tdStyle}>
                  {item.PricePerUnit?.toLocaleString()} <small style={{ color: '#6b7891' }}>EGP</small>
                </td>

                <td style={{ ...tdStyle, color: '#C9A96E', fontWeight: '900' }}>
                  {(item.TotalPrice ?? (item.Quantity * item.PricePerUnit))?.toLocaleString()} EGP
                </td>

                {/* ✅ الدهون — optional */}
                <td style={tdStyle}>
                  {item.FatPercentage != null
                    ? <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{item.FatPercentage}%</span>
                    : <span style={{ color: '#334155' }}>—</span>
                  }
                </td>

                {/* ✅ الملاحظات — optional */}
                <td style={{ ...tdStyle, color: '#6b7891', fontSize: '11px' }}>
                  {item.Notes ?? <span style={{ color: '#334155' }}>—</span>}
                </td>
                <td>
  <button
    onClick={() => handleExportPDF(row)}
    style={{
      padding: '4px 10px',
      borderRadius: '6px',
      background: '#C9A96E',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px'
    }}
  >
    PDF
  </button>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
        <span style={{ fontSize: '12px', color: '#6b7891' }}>
          إجمالي السجلات: <strong style={{ color: '#e8edf5' }}>{pagination.total}</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #1e293b', background: '#080d16', color: pagination.page === 1 ? '#334155' : '#94a3b8', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >السابق</button>
          <span style={{ color: '#C9A96E', fontSize: '13px', fontWeight: 'bold', padding: '0 10px' }}>
            صفحة {pagination.page}
          </span>
          <button
            style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #1e293b', background: '#080d16', color: (pagination.page * pagination.pageSize >= pagination.total) ? '#334155' : '#94a3b8', cursor: (pagination.page * pagination.pageSize >= pagination.total) ? 'not-allowed' : 'pointer', fontSize: '12px' }}
            disabled={pagination.page * pagination.pageSize >= pagination.total}
            onClick={() => onPageChange(pagination.page + 1)}
          >التالي</button>
        </div>
      </div>
    </div>
  );
};

export default MilkCollectionsTable;