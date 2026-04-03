/**
 * src/pages/dashboard/constants.js
 * كل الـ constants والـ helpers الخاصة بصفحة الـ Leads Dashboard
 */

export const PAGE_SIZE = 15

export const BADGES = {
  New:        { bg: 'rgba(56,189,248,.15)',   color: '#38bdf8', label: 'جديد'        },
  Contacted:  { bg: 'rgba(167,139,250,.15)',  color: '#a78bfa', label: 'تم التواصل'  },
  Interested: { bg: 'rgba(201,169,110,.18)',  color: '#C9A96E', label: 'مهتم'         },
  FollowUp:   { bg: 'rgba(251,191,36,.15)',   color: '#fbbf24', label: 'متابعة'       },
  Converted:  { bg: 'rgba(52,211,153,.15)',   color: '#34d399', label: 'تم التحويل'  },
  Lost:       { bg: 'rgba(248,113,113,.15)',  color: '#f87171', label: 'خسرنا'       },
  Cold:       { bg: 'rgba(148,163,184,.15)',  color: '#94a3b8', label: 'بارد'         },
}

export const STATUS_LIST = Object.entries(BADGES).map(([k, v]) => ({ value: k, label: v.label }))

export const STATUS_NUM_MAP = { 1:'New', 2:'Contacted', 3:'Interested', 4:'FollowUp', 5:'Converted', 6:'Lost', 7:'Cold' }

export const STATUS_OPTIONS = [
  { id:1, key:'New',        label:'جديد'         },
  { id:2, key:'Contacted',  label:'تم التواصل'   },
  { id:3, key:'Interested', label:'مهتم'          },
  { id:4, key:'FollowUp',   label:'متابعة'        },
  { id:5, key:'Converted',  label:'تم التحويل'   },
  { id:6, key:'Lost',       label:'خسرنا'        },
  { id:7, key:'Cold',       label:'بارد'          },
]

export const INTERACTION_TYPES = [
  { value:0, label:'ملاحظة عامة' },
  { value:1, label:'مكالمة'       },
  { value:2, label:'إيميل'        },
  { value:3, label:'واتساب'       },
  { value:4, label:'اجتماع'       },
  { value:5, label:'شكوى'         },
]

export const KANBAN_STATUSES = [
  { id:1, key:'New',        label:'جديد',       color:'#38bdf8', bg:'rgba(56,189,248,.12)'  },
  { id:2, key:'Contacted',  label:'تم التواصل', color:'#a78bfa', bg:'rgba(167,139,250,.12)' },
  { id:3, key:'Interested', label:'مهتم',       color:'#C9A96E', bg:'rgba(201,169,110,.15)' },
  { id:4, key:'FollowUp',   label:'متابعة',     color:'#fbbf24', bg:'rgba(251,191,36,.12)'  },
  { id:5, key:'Converted',  label:'تم التحويل', color:'#34d399', bg:'rgba(52,211,153,.12)'  },
  { id:6, key:'Lost',       label:'خسرنا',      color:'#f87171', bg:'rgba(248,113,113,.12)' },
  { id:7, key:'Cold',       label:'بارد',       color:'#94a3b8', bg:'rgba(148,163,184,.12)' },
]

// ── Helpers ────────────────────────────────────────────────
export const resolveStatus = s => {
  if (typeof s === 'number') return STATUS_NUM_MAP[s] || String(s)
  if (typeof s === 'string' && /^\d+$/.test(s)) return STATUS_NUM_MAP[parseInt(s)] || s
  return s
}

export const resolveStatusId = s => {
  if (typeof s === 'number') return s
  if (typeof s === 'string' && /^\d+$/.test(s)) return parseInt(s)
  const found = STATUS_OPTIONS.find(o => o.key === s)
  return found ? found.id : 1
}

export const fmt  = d => d ? new Date(d).toLocaleDateString('ar-EG') : '—'
export const fmtI = (d, t) => d ? fmt(d) + (t ? ' · ' + t : '') : '—'
export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${localStorage.getItem('token')}`,
})

// ── Shared inline style objects (للـ components القديمة) ──
export const S = {
  lbl:      { fontSize:12, color:'#94a3b8', fontWeight:600, display:'block', marginBottom:6 },
  inp:      { width:'100%', boxSizing:'border-box', height:38, background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none' },
  sel:      { width:'100%', boxSizing:'border-box', height:38, background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'0 11px', fontFamily:"'Cairo',sans-serif", outline:'none', cursor:'pointer' },
  btnPrim:  { height:38, padding:'0 20px', borderRadius:8, border:'none', background:'#C9A96E', color:'#0f172a', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo',sans-serif" },
  btnSec:   { height:38, padding:'0 16px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#94a3b8', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif" },
  btnDanger:{ height:38, padding:'0 16px', borderRadius:8, border:'1px solid rgba(248,113,113,.3)', background:'rgba(248,113,113,.08)', color:'#f87171', fontSize:13, cursor:'pointer', fontFamily:"'Cairo',sans-serif" },
}