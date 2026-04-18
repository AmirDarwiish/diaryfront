import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import API_BASE_URL from '../../config';

// ── تعريف الأيقونات ────────
const Icons = {
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  ),
  Activity: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  ),
  ChevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
  ),
};

const TYPE_NAMES = { 1: 'أصول', 2: 'خصوم', 3: 'حقوق ملكية', 4: 'إيرادات', 5: 'مصروفات' };

// ── API Service ────────
const api = {
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }),
  baseUrl: `${API_BASE_URL}/api`,
  getAccounts: async () => fetch(`${api.baseUrl}/Accounts`, { headers: api.getHeaders() }).then(r => r.json()),
  createAccount: async (data) => fetch(`${api.baseUrl}/Accounts`, { method: 'POST', headers: api.getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateAccount: async (id, data) => fetch(`${api.baseUrl}/Accounts/${id}`, { method: 'PUT', headers: api.getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteAccount: async (id) => fetch(`${api.baseUrl}/Accounts/${id}`, { method: 'DELETE', headers: api.getHeaders() }).then(r => r.json()),
getAccountBalance: async (id) => fetch(`${api.baseUrl}/Accounts/${id}/balance`, { headers: api.getHeaders() }).then(r => r.json()),
getAllBalances: async () => fetch(`${api.baseUrl}/Accounts/all-balances`, { headers: api.getHeaders() }).then(r => r.json()),
  getJournals: async (query) => {
    const params = new URLSearchParams(query).toString();
    return fetch(`${api.baseUrl}/Journal?${params}`, { headers: api.getHeaders() }).then(r => r.json());
  },
  getJournal: async (id) => fetch(`${api.baseUrl}/Journal/${id}`, { headers: api.getHeaders() }).then(r => r.json()),
  postJournal: async (id) => fetch(`${api.baseUrl}/Journal/${id}/post`, { method: 'POST', headers: api.getHeaders() }).then(r => r.json()),
  createManualJournal: async (data) => fetch(`${api.baseUrl}/Journal/manual`, { method: 'POST', headers: api.getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
};

// ── بناء الشجرة من flat list ────────
const buildTree = (flat) => {
  const map = {};
  flat.forEach(a => map[a.id] = { ...a, children: [] });
  const roots = [];
  flat.forEach(a => {
    if (a.parentId && map[a.parentId]) {
      map[a.parentId].children.push(map[a.id]);
    } else {
      roots.push(map[a.id]);
    }
  });
  return roots;
};

// ── حساب مجموع الأرصدة للحساب وأبنائه ────────
const sumBalances = (node, balances) => {
return balances[node.id]?.balance || 0;
};
// ── صف الشجرة ────────
const TreeRow = ({ node, depth, balances, onEdit, onDelete, onBalance, openSet, toggleOpen }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = openSet.has(node.id);
  const balance = sumBalances(node, balances);
  const isParent = depth === 0;
  const isMid = depth === 1;

  return (
    <>
      <tr style={{
        background: isParent
          ? 'var(--bg-section, rgba(0,0,0,0.04))'
          : isMid
          ? 'var(--bg-hover, rgba(0,0,0,0.02))'
          : 'transparent',
        borderRight: isParent ? '3px solid var(--gold)' : 'none',
      }}>
        {/* الكود */}
        <td style={{
          fontFamily: 'monospace',
          fontWeight: isParent ? 800 : 600,
          paddingRight: `${depth * 20 + 12}px`,
          fontSize: isParent ? '13px' : isMid ? '12px' : '11px',
          color: isParent ? 'var(--text)' : 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {hasChildren ? (
              <button
                onClick={() => toggleOpen(node.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  transition: 'transform .15s',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                }}
              >
                <Icons.ChevronDown />
              </button>
            ) : (
              <span style={{ width: '18px', display: 'inline-block' }} />
            )}
            {node.code}
          </div>
        </td>

        {/* الاسم */}
        <td style={{
          fontWeight: isParent ? 800 : isMid ? 600 : 400,
          fontSize: isParent ? '14px' : '13px',
        }}>
          {!hasChildren && (
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '10px', opacity: 0.5 }}>└</span>
          )}
          {node.name}
          {hasChildren && (
            <span style={{
              marginRight: '6px', fontSize: '10px',
              color: 'var(--text-muted)', opacity: 0.6
            }}>
              ({node.children.length})
            </span>
          )}
        </td>

        {/* النوع */}
        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {TYPE_NAMES[node.type] || '-'}
        </td>

        {/* الرصيد */}
<td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--teal)' }}>
  {balances[node.id]?.debit?.toLocaleString('ar-EG') || '—'}
</td>
<td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--red)' }}>
  {balances[node.id]?.credit?.toLocaleString('ar-EG') || '—'}
</td>
<td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: balance > 0 ? 'var(--teal)' : balance < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
  {balance !== 0 ? balance.toLocaleString('ar-EG') + ' ج.م' : <span style={{ opacity: 0.3 }}>—</span>}
</td>

        {/* الحالة */}
        <td>
          <span className={`db-status ${node.isActive ? 'active' : 'inactive'}`}>
            {node.isActive ? 'نشط' : 'موقوف'}
          </span>
        </td>

        {/* إجراءات */}
        <td>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="db-btn--icon" title="تعديل" onClick={() => onEdit(node)}>
              <Icons.Edit />
            </button>
            <button className="db-btn--icon" title="حذف" style={{ color: 'var(--red)' }} onClick={() => onDelete(node.id)}>
              <Icons.Trash />
            </button>
            <button className="db-btn--icon" title="رصيد الحساب" style={{ color: 'var(--teal)' }} onClick={() => onBalance(node.id)}>
              <Icons.Activity />
            </button>
          </div>
        </td>
      </tr>

      {hasChildren && isOpen && node.children.map(child => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          balances={balances}
          onEdit={onEdit}
          onDelete={onDelete}
          onBalance={onBalance}
          openSet={openSet}
          toggleOpen={toggleOpen}
        />
      ))}
    </>
  );
};

const TotalsRow = ({ tree, balances }) => {
  let totalDebit = 0;
  let totalCredit = 0;

  const collectLeafBalances = (nodes) => {
    nodes.forEach(node => {
      if (!node.children || node.children.length === 0) {
        const b = balances[node.id] || {};
        totalDebit += b.debit || 0;
        totalCredit += b.credit || 0;
      } else {
        collectLeafBalances(node.children);
      }
    });
  };

  collectLeafBalances(tree);

  return (
    <tr style={{
      borderTop: '2px solid var(--border)',
      background: 'var(--bg-hover)',
      position: 'sticky',
      bottom: 0,
    }}>
      <td colSpan="3" style={{ fontWeight: 800 }}>
        الإجمالي
      </td>

      <td style={{ color: 'var(--teal)', fontWeight: 900 }}>
        {totalDebit.toLocaleString('ar-EG')}
      </td>

      <td style={{ color: 'var(--red)', fontWeight: 900 }}>
        {totalCredit.toLocaleString('ar-EG')}
      </td>

      <td colSpan="2"></td>
    </tr>
  );
};

// بعد fetchAllBalances، احسب أرصدة الحسابات الأب من الشجرة

// ── المكون الرئيسي ────────
export default function AccountingModule() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Accounts
  const [accounts, setAccounts] = useState([]);
  const [accountsTree, setAccountsTree] = useState([]);
  const [balances, setBalances] = useState({});
  const [openSet, setOpenSet] = useState(new Set());
  const [accountModal, setAccountModal] = useState({ open: false, isEdit: false, data: null });
  const [balanceModal, setBalanceModal] = useState({ open: false, data: null });

  // Journals
  const [journals, setJournals] = useState([]);
  const [journalQuery, setJournalQuery] = useState({ page: 1, pageSize: 10 });
  const [totalJournals, setTotalJournals] = useState(0);
  const [journalModal, setJournalModal] = useState({ open: false });
  const [journalDetailsModal, setJournalDetailsModal] = useState({ open: false, data: null });

  // Forms
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 1, parentId: '' });
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', reference: '',
    lines: [{ accountId: '', debit: 0, credit: 0, notes: '' }, { accountId: '', debit: 0, credit: 0, notes: '' }]
  });

  // ── تحميل البيانات ────────
const loadAccounts = async () => {
  setLoading(true);
  try {
    const [accountsRes, balancesRes] = await Promise.all([
      api.getAccounts(),
      api.getAllBalances()        // ← request واحد بدل المئات
    ]);

    if (accountsRes.success) {
      const flat = accountsRes.data || [];
      setAccounts(flat);
      const tree = buildTree(flat);
      setAccountsTree(tree);
      setOpenSet(new Set(tree.map(n => n.id)));
    }

    if (balancesRes.success) {
      // حوّل الـ array لـ object مفتاحه accountId
      const map = Object.fromEntries(
        balancesRes.data.map(b => [b.accountId, b])
      );
      setBalances(map);
    }
  } finally {
    setLoading(false);
  }
};


  const loadJournals = async () => {
    setLoading(true);
    try {
      const res = await api.getJournals(journalQuery);
      if (res.success) {
        setJournals(res.data?.data || []);
        setTotalJournals(res.data?.totalCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'accounts') loadAccounts();
    else loadJournals();
  }, [activeTab, journalQuery.page]);

  const toggleOpen = (id) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Handlers ────────
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    const payload = {
      ...accountForm,
      type: Number(accountForm.type),
      parentId: accountForm.parentId ? Number(accountForm.parentId) : null
    };
    const res = accountModal.isEdit
      ? await api.updateAccount(accountModal.data.id, payload)
      : await api.createAccount(payload);
    if (res.success) {
      showToast('تم الحفظ بنجاح', 'ok');
      setAccountModal({ open: false });
      loadAccounts();
    } else {
      showToast(res.message, 'err');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('متأكد من حذف الحساب؟')) return;
    const res = await api.deleteAccount(id);
    if (res.success) {
      showToast('تم الحذف بنجاح', 'ok');
      loadAccounts();
    } else {
      showToast(res.message, 'err');
    }
  };

  const handleViewBalance = async (id) => {
    const res = await api.getAccountBalance(id);
    if (res.success) setBalanceModal({ open: true, data: res.data });
  };

  const handleEditAccount = (acc) => {
    setAccountForm(acc);
    setAccountModal({ open: true, isEdit: true, data: acc });
  };

  const handleSaveJournal = async (e) => {
    e.preventDefault();
    const totalDebit = journalForm.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = journalForm.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    if (totalDebit !== totalCredit) return showToast('القيد غير متزن!', 'err');
    const payload = {
      ...journalForm,
      lines: journalForm.lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit), accountId: Number(l.accountId) }))
    };
    const res = await api.createManualJournal(payload);
    if (res.success) {
      showToast('تم إنشاء القيد بنجاح', 'ok');
      setJournalModal({ open: false });
      loadJournals();
    } else {
      showToast(res.message || 'حدث خطأ أثناء الحفظ', 'err');
    }
  };

  const handlePostJournal = async (id) => {
    if (!window.confirm('هل أنت متأكد من ترحيل القيد؟ لا يمكن التعديل بعد الترحيل.')) return;
    const res = await api.postJournal(id);
    if (res.success) {
      showToast('تم ترحيل القيد بنجاح', 'ok');
      loadJournals();
    } else {
      showToast(res.message, 'err');
    }
  };

  const handleViewJournal = async (id) => {
    const res = await api.getJournal(id);
    if (res.success) setJournalDetailsModal({ open: true, data: res.data });
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <DashboardLayout
      title="النظام المالي"
      breadcrumb={`الداشبورد / ${activeTab === 'accounts' ? 'شجرة الحسابات' : 'قيود اليومية'}`}
      headerActions={
        activeTab === 'accounts' ? (
          <button className="db-btn db-btn--gold" onClick={() => {
            setAccountForm({ code: '', name: '', type: 1, parentId: '' });
            setAccountModal({ open: true, isEdit: false });
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Plus /> إضافة حساب
            </span>
          </button>
        ) : (
          <button className="db-btn db-btn--gold" onClick={() => {
            setJournalForm({
              date: new Date().toISOString().split('T')[0],
              description: '', reference: '',
              lines: [{ accountId: '', debit: 0, credit: 0, notes: '' }, { accountId: '', debit: 0, credit: 0, notes: '' }]
            });
            setJournalModal({ open: true });
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Plus /> قيد يومية يدوي
            </span>
          </button>
        )
      }
    >
      <div className="db-page db-animate-in">

        {toast && <div className={`db-toast db-toast--${toast.type}`}>{toast.msg}</div>}

        {/* Tabs */}
        <div className="db-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div className="db-tabs">
            <button className={`db-tab ${activeTab === 'accounts' ? 'db-tab--active' : ''}`} onClick={() => setActiveTab('accounts')}>
              شجرة الحسابات
            </button>
            <button className={`db-tab ${activeTab === 'journals' ? 'db-tab--active' : ''}`} onClick={() => setActiveTab('journals')}>
              القيود المحاسبية
            </button>
          </div>
        </div>

        {/* ── شجرة الحسابات ── */}
        {activeTab === 'accounts' && (
          <div className="db-card db-animate-in" style={{ padding: 0 }}>
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>اسم الحساب</th>
                    <th>النوع</th>
<th>مدين</th>
<th>دائن</th>
<th>الرصيد</th>                    <th>الحالة</th>
                    <th style={{ textAlign: 'center' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>جاري جلب البيانات...</td></tr>
                  ) : accountsTree.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>لا توجد حسابات مسجلة.</td></tr>
                  ) : accountsTree.map(node => (
                    <TreeRow
                      key={node.id}
                      node={node}
                      depth={0}
                      balances={balances}
                      onEdit={handleEditAccount}
                      onDelete={handleDeleteAccount}
                      onBalance={handleViewBalance}
                      openSet={openSet}
                      toggleOpen={toggleOpen}
                    />
                  ))}
                </tbody>
                {accountsTree.length > 0 && (
                  <tfoot>
<TotalsRow tree={accountsTree} balances={balances} />
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ── القيود المحاسبية ── */}
        {activeTab === 'journals' && (
          <div className="db-card db-animate-in" style={{ padding: 0 }}>
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>رقم القيد</th>
                    <th>التاريخ</th>
                    <th>البيان</th>
                    <th>المرجع</th>
                    <th>حالة الترحيل</th>
                    <th style={{ textAlign: 'center' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>جاري جلب البيانات...</td></tr>
                  ) : journals.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>لا توجد قيود مسجلة.</td></tr>
                  ) : journals.map(j => (
                    <tr key={j.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>#{j.id}</td>
                      <td style={{ fontWeight: 800 }}>{new Date(j.date).toLocaleDateString()}</td>
                      <td className="db-text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.description}</td>
                      <td>{j.reference || '-'}</td>
                      <td>
                        {j.isPosted
                          ? <span className="db-badge db-badge--converted">مرحل</span>
                          : <span className="db-badge db-badge--cold">غير مرحل</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button className="db-btn--icon" title="التفاصيل" onClick={() => handleViewJournal(j.id)}><Icons.Eye /></button>
                          {!j.isPosted && (
                            <button className="db-btn--icon" title="ترحيل القيد" style={{ color: 'var(--green)' }} onClick={() => handlePostJournal(j.id)}><Icons.CheckCircle /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="db-table-footer">
              <span>إجمالي القيود: {totalJournals}</span>
              <div className="db-pagination">
                <button disabled={journalQuery.page === 1} onClick={() => setJournalQuery({ ...journalQuery, page: journalQuery.page - 1 })}>السابق</button>
                <button disabled={journalQuery.page * journalQuery.pageSize >= totalJournals} onClick={() => setJournalQuery({ ...journalQuery, page: journalQuery.page + 1 })}>التالي</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: حساب ── */}
        {accountModal.open && (
          <div className="db-modal-overlay">
            <div className="db-modal db-animate-in">
              <div className="db-modal__accent"></div>
              <div className="db-modal__header">
                <h3 className="db-modal__title">{accountModal.isEdit ? 'تعديل حساب' : 'إضافة حساب جديد'}</h3>
                <button type="button" className="db-modal__close" onClick={() => setAccountModal({ open: false })}>&times;</button>
              </div>
              <form onSubmit={handleSaveAccount}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="db-label">كود الحساب</label>
                  <input required className="db-input" value={accountForm.code} onChange={e => setAccountForm({ ...accountForm, code: e.target.value })} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="db-label">اسم الحساب</label>
                  <input required className="db-input" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="db-label">نوع الحساب</label>
                  <select className="db-select" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}>
                    <option value={1}>أصول</option>
                    <option value={2}>خصوم</option>
                    <option value={3}>حقوق ملكية</option>
                    <option value={4}>إيرادات</option>
                    <option value={5}>مصروفات</option>
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label className="db-label">الحساب الأب (إن وجد)</label>
                  <select className="db-select" value={accountForm.parentId || ''} onChange={e => setAccountForm({ ...accountForm, parentId: e.target.value })}>
                    <option value="">-- رئيسي (بدون أب) --</option>
                    {accounts.filter(a => a.id !== accountForm.id).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="db-btn db-btn--gold db-btn--lg" style={{ width: '100%' }}>حفظ البيانات</button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: رصيد ── */}
        {balanceModal.open && balanceModal.data && (
          <div className="db-modal-overlay">
            <div className="db-modal db-animate-in">
              <div className="db-modal__accent"></div>
              <div className="db-modal__header">
                <h3 className="db-modal__title">كشف رصيد مجمع</h3>
                <button className="db-modal__close" onClick={() => setBalanceModal({ open: false })}>&times;</button>
              </div>
              <div className="db-stats" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
                <div className="db-stat">
                  <div className="db-stat__label">إجمالي الحركة المدينة</div>
                  <div className="db-stat__value" style={{ color: 'var(--teal)' }}>{balanceModal.data.debit?.toLocaleString()}</div>
                </div>
                <div className="db-stat">
                  <div className="db-stat__label">إجمالي الحركة الدائنة</div>
                  <div className="db-stat__value" style={{ color: 'var(--red)' }}>{balanceModal.data.credit?.toLocaleString()}</div>
                </div>
                <div className="db-stat" style={{ background: 'var(--gold-08)', borderColor: 'var(--gold-20)' }}>
                  <div className="db-stat__label">الرصيد الفعلي</div>
                  <div className="db-stat__value db-text-gold">{balanceModal.data.balance?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: قيد يدوي ── */}
        {journalModal.open && (
          <div className="db-modal-overlay">
            <div className="db-modal db-animate-in" style={{ maxWidth: '800px' }}>
              <div className="db-modal__accent"></div>
              <div className="db-modal__header">
                <h3 className="db-modal__title">تسجيل قيد يومية يدوي</h3>
                <button className="db-modal__close" onClick={() => setJournalModal({ open: false })}>&times;</button>
              </div>
              <form onSubmit={handleSaveJournal}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="db-label">التاريخ</label>
                    <input type="date" required className="db-input" value={journalForm.date} onChange={e => setJournalForm({ ...journalForm, date: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="db-label">المرجع المستندي</label>
                    <input className="db-input" value={journalForm.reference} onChange={e => setJournalForm({ ...journalForm, reference: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="db-label">البيان (وصف القيد)</label>
                  <textarea required className="db-textarea" rows="2" value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })}></textarea>
                </div>
                <div className="db-divider"></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 className="db-fw-800" style={{ fontSize: '14px' }}>أطراف القيد</h4>
                  <span className="db-badge db-badge--cold" style={{ fontSize: '10px' }}>يجب أن يتساوى إجمالي المدين والدائن</span>
                </div>
                {journalForm.lines.map((line, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 2 }}>
                      <select required className="db-select" value={line.accountId} onChange={e => {
                        const newLines = [...journalForm.lines];
                        newLines[index].accountId = e.target.value;
                        setJournalForm({ ...journalForm, lines: newLines });
                      }}>
                        <option value="">اختر الحساب...</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" step="0.01" required placeholder="مدين" className="db-input" value={line.debit} onChange={e => {
                        const newLines = [...journalForm.lines];
                        newLines[index].debit = e.target.value;
                        setJournalForm({ ...journalForm, lines: newLines });
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" step="0.01" required placeholder="دائن" className="db-input" value={line.credit} onChange={e => {
                        const newLines = [...journalForm.lines];
                        newLines[index].credit = e.target.value;
                        setJournalForm({ ...journalForm, lines: newLines });
                      }} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <input placeholder="ملاحظات السطر" className="db-input" value={line.notes} onChange={e => {
                        const newLines = [...journalForm.lines];
                        newLines[index].notes = e.target.value;
                        setJournalForm({ ...journalForm, lines: newLines });
                      }} />
                    </div>
                    {journalForm.lines.length > 2 && (
                      <button type="button" className="db-btn--icon" style={{ color: 'var(--red)' }} onClick={() => {
                        setJournalForm({ ...journalForm, lines: journalForm.lines.filter((_, i) => i !== index) });
                      }}><Icons.Trash /></button>
                    )}
                  </div>
                ))}
                <button type="button" className="db-btn db-btn--ghost db-btn--sm" style={{ marginBottom: '24px', marginTop: '8px' }} onClick={() => {
                  setJournalForm({ ...journalForm, lines: [...journalForm.lines, { accountId: '', debit: 0, credit: 0, notes: '' }] });
                }}>
                  <Icons.Plus /> إضافة سطر
                </button>
                <div className="db-card" style={{ padding: '12px', marginBottom: '20px', background: 'var(--bg-hover)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>الإجمالي:</span>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <span style={{ color: 'var(--teal)' }}>مدين: {journalForm.lines.reduce((s, l) => s + Number(l.debit || 0), 0)}</span>
                      <span style={{ color: 'var(--red)' }}>دائن: {journalForm.lines.reduce((s, l) => s + Number(l.credit || 0), 0)}</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className="db-btn db-btn--gold db-btn--lg" style={{ width: '100%' }}>حفظ القيد</button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: تفاصيل القيد ── */}
        {journalDetailsModal.open && journalDetailsModal.data && (
          <div className="db-modal-overlay">
            <div className="db-modal db-animate-in" style={{ maxWidth: '700px' }}>
              <div className="db-modal__accent"></div>
              <div className="db-modal__header">
                <h3 className="db-modal__title">تفاصيل القيد #{journalDetailsModal.data.id}</h3>
                <button className="db-modal__close" onClick={() => setJournalDetailsModal({ open: false })}>&times;</button>
              </div>
              <div className="db-card" style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-hover)' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                  <div><span className="db-text-muted">التاريخ: </span><strong className="db-text">{new Date(journalDetailsModal.data.date).toLocaleDateString()}</strong></div>
                  <div><span className="db-text-muted">المرجع: </span><strong>{journalDetailsModal.data.reference || '-'}</strong></div>
                  <div><span className="db-text-muted">الحالة: </span>{journalDetailsModal.data.isPosted ? <span className="db-badge db-badge--converted">مرحل</span> : <span className="db-badge db-badge--cold">غير مرحل</span>}</div>
                </div>
                <p className="db-text-muted" style={{ margin: 0 }}>{journalDetailsModal.data.description}</p>
              </div>
              <div className="db-table-wrap">
                <table className="db-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>الحساب</th>
                      <th>البيان الفرعي</th>
                      <th>مدين</th>
                      <th>دائن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalDetailsModal.data.lines.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 800 }}>{l.accountName}</td>
                        <td className="db-text-muted">{l.notes || '-'}</td>
                        <td style={{ color: 'var(--teal)', fontWeight: 'bold' }}>{l.debit?.toLocaleString()}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 'bold' }}>{l.credit?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'left', fontWeight: 800 }}>الإجمالي</td>
                      <td style={{ color: 'var(--teal)', fontWeight: 900 }}>{journalDetailsModal.data.lines.reduce((s, l) => s + l.debit, 0).toLocaleString()}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 900 }}>{journalDetailsModal.data.lines.reduce((s, l) => s + l.credit, 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}