/**
 * src/pages/projects/tabs/TimeTab.jsx
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Timer, Plus, Trash2, Loader2 } from 'lucide-react'
import { getTimelogs, startTimer, stopTimer, addManualTime, deleteTimelog } from '../../../services/projectService'
import { S, focusGold, blurNorm } from './DetailsTab'

const fmtMinutes = (m) => { if (!m) return '0 د'; const h = Math.floor(m/60); const min = m%60; if (h===0) return `${min} د`; if (min===0) return `${h} س`; return `${h}س ${min}د` }
const fmtDateTime = (d) => { if (!d) return '—'; const ds = typeof d==='string'&&!d.endsWith('Z')&&!d.includes('+') ? `${d}Z` : d; try { return new Date(ds).toLocaleString('ar-EG',{timeZone:'Africa/Cairo',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) } catch { return d } }
const fmtElapsed = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

export default function TimeTab({ taskId }) {
  const [logs, setLogs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeLog, setActiveLog]   = useState(null)
  const [elapsed, setElapsed]       = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual]         = useState({ description:'', minutes:'' })
  const [saving, setSaving]         = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    getTimelogs(taskId).then((d) => {
      const data = Array.isArray(d) ? d : d?.data || []
      setLogs(data)
      const running = data.find((l) => l.isRunning)
      if (running) {
        setActiveLog(running)
        const start = new Date(running.startTime.endsWith('Z') ? running.startTime : running.startTime + 'Z')
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [taskId])

  useEffect(() => {
    if (activeLog) { intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000) }
    else { clearInterval(intervalRef.current) }
    return () => clearInterval(intervalRef.current)
  }, [activeLog])

  const handleStart  = async () => { try { const res = await startTimer(taskId); const log = res?.data||res; setActiveLog(log); setElapsed(0); setLogs((l) => [log,...l]) } catch(e) { alert(e.message) } }
  const handleStop   = async () => { if (!activeLog) return; try { const res = await stopTimer(taskId, activeLog.id); const updated = res?.data||res; setLogs((l) => l.map((x) => x.id===activeLog.id ? {...x,...updated,isRunning:false} : x)); setActiveLog(null); setElapsed(0) } catch(e) { alert(e.message) } }
  const handleDelete = async (id) => { try { await deleteTimelog(taskId,id); setLogs((l) => l.filter((x) => x.id!==id)) } catch(e) { alert(e.message) } }
  const handleManual = async () => {
    if (!manual.minutes) return; setSaving(true)
    try { const res = await addManualTime(taskId,manual); setLogs((l) => [res?.data||res,...l]); setManual({description:'',minutes:''}); setManualOpen(false) }
    catch(e) { alert(e.message) } finally { setSaving(false) }
  }

  const totalMins = logs.reduce((acc,l) => acc+(l.durationMinutes||0), 0)

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#C9A96E' }}><Loader2 size={24} style={{ animation:'spin 1s linear infinite' }} /></div>

  return (
    <div>
      <div style={{ ...S.card, padding:'20px', marginBottom:16, textAlign:'center', borderTop:`2px solid ${activeLog ? '#34d399' : '#C9A96E'}` }}>
        <div style={{ fontSize:36, fontWeight:900, color: activeLog ? '#34d399' : '#e8edf5', fontVariantNumeric:'tabular-nums', letterSpacing:2, marginBottom:12 }}>
          {fmtElapsed(elapsed)}
        </div>
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:10 }}>
          {!activeLog
            ? <button onClick={handleStart} style={S.btnGold}><Play size={14} /> بدء التتبع</button>
            : <button onClick={handleStop} style={{ ...S.btnGold, background:'rgba(248,113,113,.2)', color:'#f87171' }}><Square size={14} /> إيقاف</button>
          }
          <button onClick={() => setManualOpen((v) => !v)} style={{ ...S.btnGhost, height:36 }}><Timer size={14} /> إضافة يدوي</button>
        </div>
        <div style={{ marginTop:14, fontSize:12, color:'#6b7891' }}>
          إجمالي الوقت المسجل: <span style={{ color:'#C9A96E', fontWeight:800 }}>{fmtMinutes(totalMins)}</span>
        </div>
      </div>

      <AnimatePresence>
        {manualOpen && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden', marginBottom:14 }}>
            <div style={{ ...S.card, padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:10, marginBottom:10 }}>
                <div><label style={S.lbl}>وصف الوقت (اختياري)</label><input style={S.input} placeholder="مثال: تصميم الـ UI" value={manual.description} onChange={(e) => setManual((m) => ({...m,description:e.target.value}))} onFocus={focusGold} onBlur={blurNorm} /></div>
                <div><label style={S.lbl}>الدقائق</label><input style={S.input} type="number" placeholder="30" value={manual.minutes} onChange={(e) => setManual((m) => ({...m,minutes:e.target.value}))} onFocus={focusGold} onBlur={blurNorm} /></div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleManual} disabled={saving} style={S.btnGold}>{saving ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> : <Plus size={12} />} إضافة</button>
                <button onClick={() => setManualOpen(false)} style={S.btnGhost}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {logs.filter((l) => !l.isRunning && l.durationMinutes > 0).map((log, i) => (
          <motion.div key={log.id||i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.04 }}
            style={{ ...S.card, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#e8edf5', marginBottom:2 }}>{log.description||log.note||'وقت عمل'}</div>
              <div style={{ fontSize:10, color:'#6b7891' }}>{fmtDateTime(log.startTime||log.createdAt)}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <span style={{ fontSize:13, color:'#C9A96E', fontWeight:800 }}>{fmtMinutes(log.durationMinutes)}</span>
              <button onClick={() => handleDelete(log.id)} style={{ ...S.btnGhost, height:28, padding:'0 7px', color:'#f8717160' }}><Trash2 size={11} /></button>
            </div>
          </motion.div>
        ))}
        {logs.filter((l) => !l.isRunning).length === 0 && <div style={{ textAlign:'center', padding:30, color:'#6b7891', fontSize:13 }}>لم يتم تسجيل أي وقت بعد</div>}
      </div>
    </div>
  )
}