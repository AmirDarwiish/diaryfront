/**
 * src/pages/projects/tabs/SubtasksTab.jsx
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, Loader2 } from 'lucide-react'
import { createTask, deleteTask as deleteTaskAPI, updateTask } from '../../../services/projectService'
import { S, normPriority, normTaskStatus, focusGold, blurNorm } from './DetailsTab'

const PRIORITY_CFG = {
  Low: { label:'منخفضة', color:'#34d399' },
  Medium: { label:'متوسطة', color:'#fbbf24' },
  High: { label:'عالية', color:'#f87171' },
  Critical: { label:'حرجة', color:'#e879f9' },
}

export default function SubtasksTab({ task, projectId }) {
  const [subtasks, setSubtasks] = useState(task.subTasks || task.subtasks || [])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding]     = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await createTask(projectId, { title:newTitle, parentTaskId:task.id, boardColumnId:task.boardColumnId||task.boardId, priority:normPriority(task.priority)||'Medium' })
      setSubtasks((s) => [...s, res?.data||res])
      setNewTitle('')
    } catch(e) { alert(e.message) }
    finally { setAdding(false) }
  }

  const handleDelete = async (id) => {
    try { await deleteTaskAPI(projectId, id); setSubtasks((s) => s.filter((x) => x.id!==id)) }
    catch(e) { alert(e.message) }
  }

  const toggleDone = async (sub) => {
    const currentStatus = normTaskStatus(sub.status)
    const newStatus = currentStatus === 'Done' ? 'Todo' : 'Done'
    try {
      await updateTask(projectId, sub.id, { title:sub.title, priority:normPriority(sub.priority)||'Medium', status:newStatus })
      setSubtasks((s) => s.map((x) => x.id===sub.id ? {...x,status:newStatus} : x))
    } catch(e) { alert(e.message) }
  }

  const done  = subtasks.filter((s) => normTaskStatus(s.status) === 'Done').length
  const total = subtasks.length
  const pct   = total > 0 ? Math.round((done/total)*100) : 0

  return (
    <div>
      {total > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color:'#6b7891' }}>{done} / {total} مكتملة</span>
            <span style={{ fontSize:12, color:'#C9A96E', fontWeight:800 }}>{pct}%</span>
          </div>
          <div style={{ height:5, background:'#0a1020', borderRadius:3, overflow:'hidden' }}>
            <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.5 }}
              style={{ height:'100%', background: pct===100 ? '#34d399' : 'linear-gradient(90deg,#f0c98a,#C9A96E)', borderRadius:3 }} />
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input style={{ ...S.input, flex:1 }} placeholder="أضف مهمة فرعية..." value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key==='Enter' && handleAdd()}
          onFocus={focusGold} onBlur={blurNorm} />
        <button onClick={handleAdd} disabled={adding || !newTitle.trim()} style={{ ...S.btnGold, opacity: !newTitle.trim() ? 0.4 : 1 }}>
          {adding ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Plus size={13} />}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <AnimatePresence>
          {subtasks.length === 0
            ? <div style={{ textAlign:'center', padding:30, color:'#6b7891', fontSize:13 }}>لا توجد مهام فرعية بعد</div>
            : subtasks.map((s, i) => {
              const isDone = normTaskStatus(s.status) === 'Done'
              const pc = PRIORITY_CFG[normPriority(s.priority)]
              return (
                <motion.div key={s.id||i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:8 }} transition={{ delay: i*0.04 }}
                  style={{ ...S.card, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                  <button onClick={() => toggleDone(s)}
                    style={{ width:20, height:20, borderRadius:5, flexShrink:0, border:`1px solid ${isDone ? '#34d399' : 'rgba(255,255,255,0.2)'}`, background: isDone ? 'rgba(52,211,153,0.15)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                    {isDone && <Check size={12} color="#34d399" />}
                  </button>
                  <span style={{ flex:1, fontSize:13, color: isDone ? '#6b7891' : '#e8edf5', textDecoration: isDone ? 'line-through' : 'none', transition:'all .2s', wordBreak:'break-word' }}>
                    {s.title}
                  </span>
                  {pc && <span style={{ fontSize:10, color:pc.color, background:`${pc.color}14`, padding:'2px 7px', borderRadius:5, fontWeight:700, flexShrink:0 }}>{pc.label}</span>}
                  <button onClick={() => handleDelete(s.id)} style={{ ...S.btnGhost, height:26, padding:'0 7px', color:'#f8717160', flexShrink:0 }}><Trash2 size={11} /></button>
                </motion.div>
              )
            })
          }
        </AnimatePresence>
      </div>
    </div>
  )
}