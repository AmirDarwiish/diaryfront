/**
 * src/pages/projects/TaskModal.jsx
 * الـ shell فقط — كل tab في ملف منفصل في tabs/
 * ~130 سطر
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, MessageSquare, Clock, Paperclip, CheckSquare, Loader2 } from 'lucide-react'
import { getTask } from '../../services/projectService'
import '../../styles/dashboard.css'

import DetailsTab    from './tabs/DetailsTab'
import CommentsTab   from './tabs/CommentsTab'
import TimeTab       from './tabs/TimeTab'
import AttachmentsTab from './tabs/AttachmentsTab'
import SubtasksTab   from './tabs/SubtasksTab'

const TABS = [
  { key: 'details',     label: 'التفاصيل',       Icon: Flag          },
  { key: 'comments',    label: 'التعليقات',       Icon: MessageSquare },
  { key: 'time',        label: 'الوقت',           Icon: Clock         },
  { key: 'attachments', label: 'المرفقات',        Icon: Paperclip     },
  { key: 'subtasks',    label: 'المهام الفرعية',  Icon: CheckSquare   },
]

const btnGhost = { height:32, padding:'0 12px', borderRadius:7, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#6b7891', fontSize:11, cursor:'pointer', fontFamily:"'Cairo',sans-serif", display:'flex', alignItems:'center', gap:5 }

export default function TaskModal({ taskId, projectId, onClose, onUpdated }) {
  const [task, setTask]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    getTask(projectId, taskId)
      .then((d) => { setTask(d?.data || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [taskId, projectId])

  const handleUpdated = (updated) => { setTask((t) => ({ ...t, ...updated })); onUpdated?.(updated) }

  const commentCount    = task?.commentsCount    ?? task?.comments?.length    ?? 0
  const attachmentCount = task?.attachmentsCount ?? task?.attachments?.length ?? 0
  const subtaskCount    = (task?.subTasks || task?.subtasks)?.length ?? 0

  const tabLabel = (tab) => {
    if (tab.key === 'comments'    && commentCount)    return `${tab.label} (${commentCount})`
    if (tab.key === 'attachments' && attachmentCount) return `${tab.label} (${attachmentCount})`
    if (tab.key === 'subtasks'    && subtaskCount)    return `${tab.label} (${subtaskCount})`
    return tab.label
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.02); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(201,169,110,.2); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,169,110,.5); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .responsive-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        @media (max-width: 600px) {
          .modal-overlay { padding: 0 !important; }
          .modal-content { width:100%!important; max-height:100dvh!important; height:100dvh!important; border-radius:0!important; border:none!important; }
          .responsive-grid { grid-template-columns: 1fr !important; gap: 14px; }
        }
      `}</style>

      <motion.div
        className="modal-overlay"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, direction:'rtl' }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale:0.9, y:24 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:24 }}
          transition={{ type:'spring', damping:22 }}
          style={{ background:'#0d1420', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, width:'100%', maxWidth:700, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gold accent */}
          <div style={{ position:'absolute', top:0, right:0, left:0, height:3, background:'linear-gradient(90deg,#C9A96E,#d4a855,transparent)' }} />

          {loading ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:60 }}>
              <Loader2 size={32} color="#C9A96E" style={{ animation:'spin 1s linear infinite' }} />
            </div>
          ) : !task ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#f87171', fontSize:14 }}>التاسك مش موجود</div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding:'22px 24px 0', flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ flex:1, minWidth:0, paddingLeft:12 }}>
                    <div style={{ fontSize:11, color:'#6b7891', marginBottom:6 }}>تاسك #{task.id}</div>
                    <h2 style={{ fontSize:18, fontWeight:900, color:'#e8edf5', margin:0, lineHeight:1.4, wordBreak:'break-word' }}>{task.title}</h2>
                  </div>
                  <button onClick={onClose} style={{ ...btnGhost, height:34, padding:'0 10px', flexShrink:0 }}><X size={16} /></button>
                </div>

                {/* Tabs */}
                <div className="hide-scrollbar" style={{ display:'flex', gap:2, overflowX:'auto', paddingBottom:1 }}>
                  {TABS.map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, padding:'10px 14px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', whiteSpace:'nowrap', background: activeTab===tab.key ? '#080d16' : 'transparent', color: activeTab===tab.key ? '#C9A96E' : '#6b7891', fontSize:12, fontWeight:700, fontFamily:"'Cairo',sans-serif", borderBottom: activeTab===tab.key ? '2px solid #C9A96E' : '2px solid transparent', transition:'all .18s' }}>
                      <tab.Icon size={13} /> {tabLabel(tab)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 24px', background:'#080d16' }} className="custom-scroll">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
                    {activeTab === 'details'     && <DetailsTab     task={task} projectId={projectId} onUpdated={handleUpdated} />}
                    {activeTab === 'comments'    && <CommentsTab    taskId={task.id} />}
                    {activeTab === 'time'        && <TimeTab        taskId={task.id} />}
                    {activeTab === 'attachments' && <AttachmentsTab taskId={task.id} />}
                    {activeTab === 'subtasks'    && <SubtasksTab    task={task} projectId={projectId} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}