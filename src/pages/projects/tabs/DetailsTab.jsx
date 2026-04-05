/**
 * src/pages/projects/tabs/DetailsTab.jsx
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit3, Check, Loader2, Calendar } from 'lucide-react'
import { updateTask } from '../../../services/projectService'

const PRIORITY_CFG = {
  Low: { label: 'منخفضة', color: '#34d399' },
  Medium: { label: 'متوسطة', color: '#fbbf24' },
  High: { label: 'عالية', color: '#f87171' },
  Critical: { label: 'حرجة', color: '#e879f9' },
}
const STATUS_CFG = {
  Todo: { label: 'للتنفيذ', color: '#94a3b8' },
  InProgress: { label: 'قيد التنفيذ', color: '#6ea8fe' },
  InReview: { label: 'مراجعة', color: '#fbbf24' },
  Done: { label: 'مكتمل', color: '#34d399' },
}
const PRIORITY_MAP = { 0:'Low',1:'Low',2:'Medium',3:'Medium',4:'High',5:'High',6:'Critical',7:'Critical',low:'Low',medium:'Medium',high:'High',critical:'Critical' }
const STATUS_MAP = { 0:'Todo',1:'Todo',2:'InProgress',3:'InProgress',4:'InReview',5:'InReview',6:'Done',7:'Done',todo:'Todo',inprogress:'InProgress',inreview:'InReview',done:'Done' }
export const normPriority = (v) => { if (!v && v !== 0) return 'Medium'; if (typeof v === 'string' && PRIORITY_CFG[v]) return v; const k = typeof v === 'string' ? v.toLowerCase() : v; return PRIORITY_MAP[k] || 'Medium' }
export const normTaskStatus = (v) => { if (!v && v !== 0) return 'Todo'; if (typeof v === 'string' && STATUS_CFG[v]) return v; const k = typeof v === 'string' ? v.toLowerCase().replace(/[_\s]/g,'') : v; return STATUS_MAP[k] || 'Todo' }

export const S = {
  input:   { width:'100%', boxSizing:'border-box', height:40, background:'#0a1020', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#e8edf5', fontSize:13, padding:'0 12px', fontFamily:"'Cairo',sans-serif", outline:'none', transition:'border-color .2s' },
  textarea:{ width:'100%', boxSizing:'border-box', background:'#0a1020', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#e8edf5', fontSize:13, padding:'10px 12px', fontFamily:"'Cairo',sans-serif", outline:'none', resize:'vertical', minHeight:80, transition:'border-color .2s' },
  select:  { width:'100%', boxSizing:'border-box', height:38, background:'#0a1020', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#e8edf5', fontSize:12, padding:'0 10px', fontFamily:"'Cairo',sans-serif", outline:'none', cursor:'pointer', appearance:'none' },
  lbl:     { fontSize:10, color:'#6b7891', fontWeight:700, display:'block', marginBottom:5, letterSpacing:'0.5px' },
  card:    { background:'#0a1020', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 },
  btnGold: { height:36, padding:'0 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#d4a855,#C9A96E)', color:'#080d16', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:"'Cairo',sans-serif", display:'flex', alignItems:'center', gap:6, transition:'opacity .2s', whiteSpace:'nowrap' },
  btnGhost:{ height:32, padding:'0 12px', borderRadius:7, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#6b7891', fontSize:11, cursor:'pointer', fontFamily:"'Cairo',sans-serif", display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' },
}
export const focusGold = (e) => (e.target.style.borderColor = 'rgba(201,169,110,0.45)')
export const blurNorm  = (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')

export default function DetailsTab({ task, projectId, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: task.title || '', description: task.description || '',
    priority: normPriority(task.priority) || 'Medium',
    status: normTaskStatus(task.status) || 'Todo',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try { await updateTask(projectId, task.id, form); onUpdated({ ...task, ...form }); setEditing(false) }
    catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const p = PRIORITY_CFG[normPriority(task.priority)]
  const s = STATUS_CFG[normTaskStatus(task.status)]

  return (
    <div>
      {!editing ? (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {p && <span style={{ fontSize:11, background:`${p.color}14`, color:p.color, padding:'3px 10px', borderRadius:6, fontWeight:700 }}>{p.label}</span>}
              {s && <span style={{ fontSize:11, background:`${s.color}14`, color:s.color, padding:'3px 10px', borderRadius:6, fontWeight:700 }}>{s.label}</span>}
              {task.dueDate && <span style={{ fontSize:11, color:'#6b7891', display:'flex', alignItems:'center', gap:5 }}><Calendar size={11} color="#C9A96E" />{new Date(task.dueDate).toLocaleDateString('ar-EG')}</span>}
            </div>
            <button onClick={() => setEditing(true)} style={{ ...S.btnGhost, color:'#C9A96E', borderColor:'rgba(201,169,110,0.25)' }}><Edit3 size={12} /> تعديل</button>
          </div>
          {task.description
            ? <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{task.description}</p>
            : <p style={{ fontSize:13, color:'#6b7891', fontStyle:'italic' }}>لا يوجد وصف للمهمة.</p>
          }
        </>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={S.lbl}>عنوان المهمة</label><input style={S.input} value={form.title} onChange={(e) => set('title', e.target.value)} onFocus={focusGold} onBlur={blurNorm} /></div>
          <div><label style={S.lbl}>الوصف</label><textarea style={{ ...S.textarea, minHeight:100 }} value={form.description} onChange={(e) => set('description', e.target.value)} onFocus={focusGold} onBlur={blurNorm} /></div>
          <div className="responsive-grid">
            <div><label style={S.lbl}>الأولوية</label><select style={S.select} value={form.priority} onChange={(e) => set('priority', e.target.value)}>{Object.entries(PRIORITY_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label style={S.lbl}>الحالة</label><select style={S.select} value={form.status} onChange={(e) => set('status', e.target.value)}>{Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label style={S.lbl}>تاريخ الانتهاء</label><input type="date" style={{ ...S.input, height:38, fontSize:12 }} value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving} style={{ ...S.btnGold, opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Check size={13} />} حفظ التعديلات
            </button>
            <button onClick={() => setEditing(false)} style={S.btnGhost}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}