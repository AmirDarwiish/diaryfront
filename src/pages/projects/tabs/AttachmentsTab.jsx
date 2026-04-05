/**
 * src/pages/projects/tabs/CommentsTab.jsx
 */
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Edit3, Trash2, Send, Loader2, Check } from 'lucide-react'
import { getComments, addComment, updateComment, deleteComment } from '../../../services/projectService'
import { S, focusGold, blurNorm } from './DetailsTab'

const fmtDateTime = (d) => {
  if (!d) return '—'
  const ds = typeof d === 'string' && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d
  try { return new Date(ds).toLocaleString('ar-EG', { timeZone:'Africa/Cairo', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
  catch { return d }
}

export default function CommentsTab({ taskId }) {
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText]   = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    getComments(taskId)
      .then((d) => { setComments(Array.isArray(d) ? d : d?.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [taskId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try { const res = await addComment(taskId, text); setComments((c) => [...c, res?.data || res]); setText('') }
    catch (e) { alert(e.message) }
    finally { setSending(false) }
  }

  const saveEdit = async (id) => {
    try { await updateComment(taskId, id, editText); setComments((c) => c.map((x) => x.id === id ? { ...x, content: editText } : x)); setEditingId(null) }
    catch (e) { alert(e.message) }
  }

  const remove = async (id) => {
    try { await deleteComment(taskId, id); setComments((c) => c.filter((x) => x.id !== id)) }
    catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#C9A96E' }}><Loader2 size={24} style={{ animation:'spin 1s linear infinite' }} /></div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ maxHeight:340, overflowY:'auto', paddingRight:4, marginBottom:16 }} className="custom-scroll">
        {comments.length === 0
          ? <div style={{ textAlign:'center', padding:'40px 0', color:'#6b7891', fontSize:13 }}>لا توجد تعليقات بعد. كن أول من يعلق!</div>
          : comments.map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.03 }}
              style={{ ...S.card, padding:'12px 14px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:'rgba(201,169,110,0.14)', display:'flex', alignItems:'center', justifyContent:'center', color:'#C9A96E', fontWeight:800, fontSize:12 }}>
                    {(c.authorName || c.author?.fullName || '؟')[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#e8edf5' }}>{c.authorName || c.author?.fullName || `مستخدم #${c.createdByUserId}`}</div>
                    <div style={{ fontSize:10, color:'#6b7891' }}>{fmtDateTime(c.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => { setEditingId(c.id); setEditText(c.content) }} style={{ ...S.btnGhost, height:26, padding:'0 7px' }}><Edit3 size={11} /></button>
                  <button onClick={() => remove(c.id)} style={{ ...S.btnGhost, height:26, padding:'0 7px', color:'#f8717170' }}><Trash2 size={11} /></button>
                </div>
              </div>
              {editingId === c.id ? (
                <div>
                  <textarea style={{ ...S.textarea, minHeight:60, marginBottom:8 }} value={editText} onChange={(e) => setEditText(e.target.value)} onFocus={focusGold} onBlur={blurNorm} />
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => saveEdit(c.id)} style={{ ...S.btnGold, height:30, fontSize:11 }}><Check size={11} /> حفظ</button>
                    <button onClick={() => setEditingId(null)} style={{ ...S.btnGhost, height:30 }}>إلغاء</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{c.content}</p>
              )}
            </motion.div>
          ))
        }
        <div ref={bottomRef} />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <textarea style={{ ...S.textarea, flex:1, minHeight:60, resize:'none' }} placeholder="اكتب تعليقاً..." value={text} onChange={(e) => setText(e.target.value)}
          onFocus={focusGold} onBlur={blurNorm} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send() }} />
        <button onClick={send} disabled={sending || !text.trim()} style={{ ...S.btnGold, height:60, flexShrink:0, opacity: !text.trim() ? 0.4 : 1 }}>
          {sending ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Send size={14} />}
        </button>
      </div>
      <div style={{ fontSize:10, color:'#6b7891', marginTop:6 }}>Ctrl + Enter للإرسال</div>
    </div>
  )
}