import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, MessageSquare, Clock, Paperclip, CheckSquare,
  Plus, Trash2, Edit3, Send, Play, Square, Timer,
  Upload, Download, File, Image, Calendar,
  Loader2, Check, Flag,
} from "lucide-react"
import {
  getTask, updateTask,
  getComments, addComment, updateComment, deleteComment,
  getTimelogs, startTimer, stopTimer, addManualTime, deleteTimelog,
  getAttachments, uploadAttachment, deleteAttachment,
  createTask, deleteTask as deleteTaskAPI,
} from "../../services/projectService"

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const PRIORITY_CFG = {
  Low:      { label: "منخفضة", color: "#34d399" },
  Medium:   { label: "متوسطة", color: "#fbbf24" },
  High:     { label: "عالية",  color: "#f87171" },
  Critical: { label: "حرجة",   color: "#e879f9" },
}

const STATUS_CFG = {
  Todo:       { label: "للتنفيذ",     color: "#94a3b8" },
  InProgress: { label: "قيد التنفيذ", color: "#6ea8fe" },
  InReview:   { label: "مراجعة",      color: "#fbbf24" },
  Done:       { label: "مكتمل",       color: "#34d399" },
}

const TABS = [
  { key: "details",     label: "التفاصيل",       Icon: Flag          },
  { key: "comments",    label: "التعليقات",       Icon: MessageSquare },
  { key: "time",        label: "الوقت",           Icon: Clock         },
  { key: "attachments", label: "المرفقات",        Icon: Paperclip     },
  { key: "subtasks",    label: "المهام الفرعية",  Icon: CheckSquare   },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmtMinutes = (mins) => {
  if (!mins) return "0 د"
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} د`
  if (m === 0) return `${h} س`
  return `${h}س ${m}د`
}

const fmtDateTime = (d) => {
  if (!d) return "—"
  const dateStr = typeof d === "string" && !d.endsWith("Z") && !d.includes("+") ? `${d}Z` : d
  try {
    return new Date(dateStr).toLocaleString("ar-EG", {
      timeZone: "Africa/Cairo", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return d }
}

const getFileIcon = (name) => {
  const ext = name?.split(".").pop()?.toLowerCase()
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return <Image size={16} color="#6ea8fe" />
  return <File size={16} color="#C9A96E" />
}

// ─────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────
const S = {
  input: {
    width: "100%", boxSizing: "border-box", height: 40,
    background: "#0a1020", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#e8edf5", fontSize: 13,
    padding: "0 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none", transition: "border-color .2s",
  },
  textarea: {
    width: "100%", boxSizing: "border-box",
    background: "#0a1020", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#e8edf5", fontSize: 13,
    padding: "10px 12px", fontFamily: "'Cairo',sans-serif",
    outline: "none", resize: "vertical", minHeight: 80,
    transition: "border-color .2s",
  },
  select: {
    width: "100%", boxSizing: "border-box", height: 38,
    background: "#0a1020", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#e8edf5", fontSize: 12,
    padding: "0 10px", fontFamily: "'Cairo',sans-serif",
    outline: "none", cursor: "pointer", appearance: "none",
  },
  lbl: { fontSize: 10, color: "#6b7891", fontWeight: 700, display: "block", marginBottom: 5, letterSpacing: "0.5px" },
  card: { background: "#0a1020", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 },
  btnGold: {
    height: 36, padding: "0 16px", borderRadius: 8, border: "none",
    background: "linear-gradient(135deg,#d4a855,#C9A96E)",
    color: "#080d16", fontSize: 12, fontWeight: 800,
    cursor: "pointer", fontFamily: "'Cairo',sans-serif",
    display: "flex", alignItems: "center", gap: 6,
    transition: "opacity .2s", whiteSpace: "nowrap",
  },
  btnGhost: {
    height: 32, padding: "0 12px", borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
    color: "#6b7891", fontSize: 11, cursor: "pointer",
    fontFamily: "'Cairo',sans-serif",
    display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
  },
}

const focusGold = (e) => (e.target.style.borderColor = "rgba(201,169,110,0.45)")
const blurNorm  = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")

// ─────────────────────────────────────────────
// Details Tab
// ─────────────────────────────────────────────
function DetailsTab({ task, projectId, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title:       task.title       || "",
    description: task.description || "",
    priority:    task.priority    || "Medium",
    status:      task.status      || "Todo",
    dueDate:     task.dueDate ? task.dueDate.split("T")[0] : "",
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await updateTask(projectId, task.id, form)
      onUpdated({ ...task, ...form })
      setEditing(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const p = PRIORITY_CFG[task.priority]
  const s = STATUS_CFG[task.status]

  return (
    <div>
      {!editing ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {p && (
                <span style={{ fontSize: 11, background: `${p.color}14`, color: p.color, padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>
                  {p.label}
                </span>
              )}
              {s && (
                <span style={{ fontSize: 11, background: `${s.color}14`, color: s.color, padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>
                  {s.label}
                </span>
              )}
              {task.dueDate && (
                <span style={{ fontSize: 11, color: "#6b7891", display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={11} color="#C9A96E" />
                  {new Date(task.dueDate).toLocaleDateString("ar-EG")}
                </span>
              )}
            </div>
            <button onClick={() => setEditing(true)} style={{ ...S.btnGhost, color: "#C9A96E", borderColor: "rgba(201,169,110,0.25)" }}>
              <Edit3 size={12} /> تعديل
            </button>
          </div>
          {task.description ? (
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{task.description}</p>
          ) : (
            <p style={{ fontSize: 13, color: "#6b7891", fontStyle: "italic" }}>لا يوجد وصف للمهمة.</p>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.lbl}>عنوان المهمة</label>
            <input style={S.input} value={form.title} onChange={(e) => set("title", e.target.value)} onFocus={focusGold} onBlur={blurNorm} />
          </div>
          <div>
            <label style={S.lbl}>الوصف</label>
            <textarea style={{ ...S.textarea, minHeight: 100 }} value={form.description} onChange={(e) => set("description", e.target.value)} onFocus={focusGold} onBlur={blurNorm} />
          </div>
          <div className="responsive-grid">
            <div>
              <label style={S.lbl}>الأولوية</label>
              <select style={S.select} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>الحالة</label>
              <select style={S.select} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>تاريخ الانتهاء</label>
              <input type="date" style={{ ...S.input, height: 38, fontSize: 12 }} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ ...S.btnGold, opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
              حفظ التعديلات
            </button>
            <button onClick={() => setEditing(false)} style={S.btnGhost}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Comments Tab
// ─────────────────────────────────────────────
function CommentsTab({ taskId }) {
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState("")
  const [sending, setSending]     = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText]   = useState("")
  const bottomRef = useRef(null)

  useEffect(() => {
    getComments(taskId).then((d) => {
      setComments(Array.isArray(d) ? d : d?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [comments])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await addComment(taskId, text)
      setComments((c) => [...c, res?.data || res])
      setText("")
    } catch (e) { alert(e.message) }
    finally { setSending(false) }
  }

  const saveEdit = async (id) => {
    try {
      await updateComment(taskId, id, editText)
      setComments((c) => c.map((x) => x.id === id ? { ...x, content: editText } : x))
      setEditingId(null)
    } catch (e) { alert(e.message) }
  }

  const remove = async (id) => {
    try {
      await deleteComment(taskId, id)
      setComments((c) => c.filter((x) => x.id !== id))
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#C9A96E" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /></div>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4, marginBottom: 16 }} className="custom-scroll">
        {comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7891", fontSize: 13 }}>
            لا توجد تعليقات بعد. كن أول من يعلق!
          </div>
        ) : comments.map((c, i) => (
          <motion.div
            key={c.id || i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{ ...S.card, padding: "12px 14px", marginBottom: 10 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(201,169,110,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#C9A96E", fontWeight: 800, fontSize: 12,
                }}>
                  {(c.authorName || c.author?.fullName || "؟")[0]}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#e8edf5" }}>
                    {c.authorName || c.author?.fullName || `مستخدم #${c.createdByUserId}`}
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7891" }}>{fmtDateTime(c.createdAt)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { setEditingId(c.id); setEditText(c.content) }} style={{ ...S.btnGhost, height: 26, padding: "0 7px" }}>
                  <Edit3 size={11} />
                </button>
                <button onClick={() => remove(c.id)} style={{ ...S.btnGhost, height: 26, padding: "0 7px", color: "#f8717170" }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {editingId === c.id ? (
              <div>
                <textarea
                  style={{ ...S.textarea, minHeight: 60, marginBottom: 8 }}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onFocus={focusGold} onBlur={blurNorm}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => saveEdit(c.id)} style={{ ...S.btnGold, height: 30, fontSize: 11 }}>
                    <Check size={11} /> حفظ
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ ...S.btnGhost, height: 30 }}>إلغاء</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {c.content}
              </p>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          style={{ ...S.textarea, flex: 1, minHeight: 60, resize: "none" }}
          placeholder="اكتب تعليقاً..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={focusGold} onBlur={blurNorm}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send() }}
        />
        <button onClick={send} disabled={sending || !text.trim()} style={{ ...S.btnGold, height: 60, flexShrink: 0, opacity: !text.trim() ? 0.4 : 1 }}>
          {sending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
        </button>
      </div>
      <div style={{ fontSize: 10, color: "#6b7891", marginTop: 6 }}>Ctrl + Enter للإرسال</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Time Tab
// ─────────────────────────────────────────────
function TimeTab({ taskId }) {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeLog, setActiveLog] = useState(null)
  const [elapsed, setElapsed]     = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual]       = useState({ description: "", minutes: "" })
  const [saving, setSaving]       = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    getTimelogs(taskId).then((d) => {
      const data = Array.isArray(d) ? d : d?.data || []
      setLogs(data)
      const running = data.find((l) => l.isRunning)
      if (running) {
        setActiveLog(running)
        const start = new Date(running.startTime.endsWith("Z") ? running.startTime : running.startTime + "Z")
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [taskId])

  useEffect(() => {
    if (activeLog) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [activeLog])

  const fmtElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
  }

  const handleStart = async () => {
    try {
      const res = await startTimer(taskId)
      const log = res?.data || res
      setActiveLog(log); setElapsed(0)
      setLogs((l) => [log, ...l])
    } catch (e) { alert(e.message) }
  }

  const handleStop = async () => {
    if (!activeLog) return
    try {
      const res = await stopTimer(taskId, activeLog.id)
      const updated = res?.data || res
      setLogs((l) => l.map((x) => x.id === activeLog.id ? { ...x, ...updated, isRunning: false } : x))
      setActiveLog(null); setElapsed(0)
    } catch (e) { alert(e.message) }
  }

  const handleManual = async () => {
    if (!manual.minutes) return
    setSaving(true)
    try {
      const res = await addManualTime(taskId, manual)
      setLogs((l) => [res?.data || res, ...l])
      setManual({ description: "", minutes: "" }); setManualOpen(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (logId) => {
    try {
      await deleteTimelog(taskId, logId)
      setLogs((l) => l.filter((x) => x.id !== logId))
    } catch (e) { alert(e.message) }
  }

  const totalMins = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#C9A96E" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /></div>

  return (
    <div>
      <div style={{ ...S.card, padding: "20px", marginBottom: 16, textAlign: "center", borderTop: `2px solid ${activeLog ? "#34d399" : "#C9A96E"}` }}>
        <div style={{
          fontSize: 36, fontWeight: 900, color: activeLog ? "#34d399" : "#e8edf5",
          fontVariantNumeric: "tabular-nums", letterSpacing: 2, marginBottom: 12,
        }}>
          {fmtElapsed(elapsed)}
        </div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
          {!activeLog ? (
            <button onClick={handleStart} style={S.btnGold}>
              <Play size={14} /> بدء التتبع
            </button>
          ) : (
            <button onClick={handleStop} style={{ ...S.btnGold, background: "rgba(248,113,113,.2)", color: "#f87171" }}>
              <Square size={14} /> إيقاف
            </button>
          )}
          <button onClick={() => setManualOpen((v) => !v)} style={{ ...S.btnGhost, height: 36 }}>
            <Timer size={14} /> إضافة يدوي
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "#6b7891" }}>
          إجمالي الوقت المسجل: <span style={{ color: "#C9A96E", fontWeight: 800 }}>{fmtMinutes(totalMins)}</span>
        </div>
      </div>

      <AnimatePresence>
        {manualOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 14 }}
          >
            <div style={{ ...S.card, padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={S.lbl}>وصف الوقت (اختياري)</label>
                  <input
                    style={S.input} placeholder="مثال: تصميم الـ UI"
                    value={manual.description}
                    onChange={(e) => setManual((m) => ({ ...m, description: e.target.value }))}
                    onFocus={focusGold} onBlur={blurNorm}
                  />
                </div>
                <div>
                  <label style={S.lbl}>الدقائق</label>
                  <input
                    style={S.input} type="number" placeholder="30"
                    value={manual.minutes}
                    onChange={(e) => setManual((m) => ({ ...m, minutes: e.target.value }))}
                    onFocus={focusGold} onBlur={blurNorm}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleManual} disabled={saving} style={S.btnGold}>
                  {saving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />}
                  إضافة
                </button>
                <button onClick={() => setManualOpen(false)} style={S.btnGhost}>إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {logs.filter((l) => !l.isRunning && l.durationMinutes > 0).map((log, i) => (
          <motion.div
            key={log.id || i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            style={{ ...S.card, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e8edf5", marginBottom: 2 }}>
                {log.description || log.note || "وقت عمل"}
              </div>
              <div style={{ fontSize: 10, color: "#6b7891" }}>{fmtDateTime(log.startTime || log.createdAt)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: "#C9A96E", fontWeight: 800 }}>{fmtMinutes(log.durationMinutes)}</span>
              <button onClick={() => handleDelete(log.id)} style={{ ...S.btnGhost, height: 28, padding: "0 7px", color: "#f8717160" }}>
                <Trash2 size={11} />
              </button>
            </div>
          </motion.div>
        ))}
        {logs.filter((l) => !l.isRunning).length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: "#6b7891", fontSize: 13 }}>
            لم يتم تسجيل أي وقت بعد
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Attachments Tab
// ─────────────────────────────────────────────
function AttachmentsTab({ taskId }) {
  const [files, setFiles]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    getAttachments(taskId).then((d) => {
      setFiles(Array.isArray(d) ? d : d?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [taskId])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { alert("الحد الأقصى 20 ميجابايت"); return }
    setUploading(true)
    try {
      const res = await uploadAttachment(taskId, file)
      setFiles((f) => [...f, res?.data || res])
    } catch (err) { alert(err.message) }
    finally { setUploading(false); e.target.value = "" }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("حذف المرفق؟")) return
    try {
      await deleteAttachment(taskId, id)
      setFiles((f) => f.filter((x) => x.id !== id))
    } catch (e) { alert(e.message) }
  }

  const fmtSize = (bytes) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#C9A96E" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /></div>

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: "1px dashed rgba(201,169,110,0.3)", borderRadius: 12, padding: "24px 20px",
          textAlign: "center", cursor: uploading ? "wait" : "pointer",
          background: "rgba(201,169,110,0.03)", marginBottom: 16, transition: "border-color .2s, background .2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.6)"; e.currentTarget.style.background = "rgba(201,169,110,0.06)" }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)"; e.currentTarget.style.background = "rgba(201,169,110,0.03)" }}
      >
        <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
        {uploading ? (
          <div style={{ color: "#C9A96E", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>جاري الرفع...</span>
          </div>
        ) : (
          <>
            <Upload size={22} color="#C9A96E" style={{ margin: "0 auto 8px", display: "block" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5", marginBottom: 4 }}>اضغط لرفع ملف</div>
            <div style={{ fontSize: 11, color: "#6b7891" }}>الحد الأقصى 20 ميجابايت</div>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {files.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#6b7891", fontSize: 13 }}>لا توجد مرفقات بعد</div>
        ) : files.map((f, i) => (
          <motion.div
            key={f.id || i}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ ...S.card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {getFileIcon(f.fileName || f.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.fileName || f.name}
              </div>
              <div style={{ fontSize: 10, color: "#6b7891", marginTop: 2 }}>
                {fmtSize(f.fileSize || f.size)} · {fmtDateTime(f.uploadedAt || f.createdAt)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {(f.url || f.fileUrl) && (
                <a href={f.url || f.fileUrl} target="_blank" rel="noreferrer"
                  style={{ ...S.btnGhost, height: 30, padding: "0 8px", textDecoration: "none" }}>
                  <Download size={12} />
                </a>
              )}
              <button onClick={() => handleDelete(f.id)} style={{ ...S.btnGhost, height: 30, padding: "0 8px", color: "#f8717160" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Subtasks Tab
// ─────────────────────────────────────────────
function SubtasksTab({ task, projectId }) {
  const [subtasks, setSubtasks] = useState(task.subTasks || task.subtasks || [])
  const [newTitle, setNewTitle] = useState("")
  const [adding, setAdding]     = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await createTask(projectId, {
        title:        newTitle,
        parentTaskId: task.id,
        boardColumnId: task.boardColumnId || task.boardId,
        priority:     task.priority || "Medium",
      })
      setSubtasks((s) => [...s, res?.data || res])
      setNewTitle("")
    } catch (e) { alert(e.message) }
    finally { setAdding(false) }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTaskAPI(projectId, id)
      setSubtasks((s) => s.filter((x) => x.id !== id))
    } catch (e) { alert(e.message) }
  }

  const toggleDone = async (sub) => {
    const newStatus = sub.status === "Done" ? "Todo" : "Done"
    try {
      await updateTask(projectId, sub.id, {
        title:    sub.title,
        priority: sub.priority || "Medium",
        status:   newStatus,
      })
      setSubtasks((s) => s.map((x) => x.id === sub.id ? { ...x, status: newStatus } : x))
    } catch (e) { alert(e.message) }
  }

  const done  = subtasks.filter((s) => s.status === "Done").length
  const total = subtasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div>
      {total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7891" }}>{done} / {total} مكتملة</span>
            <span style={{ fontSize: 12, color: "#C9A96E", fontWeight: 800 }}>{pct}%</span>
          </div>
          <div style={{ height: 5, background: "#0a1020", borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
              style={{ height: "100%", background: pct === 100 ? "#34d399" : "linear-gradient(90deg,#f0c98a,#C9A96E)", borderRadius: 3 }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="أضف مهمة فرعية..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          onFocus={focusGold} onBlur={blurNorm}
        />
        <button onClick={handleAdd} disabled={adding || !newTitle.trim()} style={{ ...S.btnGold, opacity: !newTitle.trim() ? 0.4 : 1 }}>
          {adding ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <AnimatePresence>
          {subtasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#6b7891", fontSize: 13 }}>
              لا توجد مهام فرعية بعد
            </div>
          ) : subtasks.map((s, i) => (
            <motion.div
              key={s.id || i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.04 }}
              style={{ ...S.card, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
            >
              <button
                onClick={() => toggleDone(s)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: `1px solid ${s.status === "Done" ? "#34d399" : "rgba(255,255,255,0.2)"}`,
                  background: s.status === "Done" ? "rgba(52,211,153,0.15)" : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                }}
              >
                {s.status === "Done" && <Check size={12} color="#34d399" />}
              </button>
              <span style={{
                flex: 1, fontSize: 13, color: s.status === "Done" ? "#6b7891" : "#e8edf5",
                textDecoration: s.status === "Done" ? "line-through" : "none",
                transition: "all .2s", wordBreak: "break-word",
              }}>
                {s.title}
              </span>
              {s.priority && PRIORITY_CFG[s.priority] && (
                <span style={{
                  fontSize: 10, color: PRIORITY_CFG[s.priority].color,
                  background: `${PRIORITY_CFG[s.priority].color}14`,
                  padding: "2px 7px", borderRadius: 5, fontWeight: 700, flexShrink: 0,
                }}>
                  {PRIORITY_CFG[s.priority].label}
                </span>
              )}
              <button onClick={() => handleDelete(s.id)} style={{ ...S.btnGhost, height: 26, padding: "0 7px", color: "#f8717160", flexShrink: 0 }}>
                <Trash2 size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
export default function TaskModal({ taskId, projectId, onClose, onUpdated }) {
  const [task, setTask]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    getTask(projectId, taskId).then((d) => {
      setTask(d?.data || d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [taskId, projectId])

  const handleUpdated = (updated) => {
    setTask((t) => ({ ...t, ...updated }))
    onUpdated?.(updated)
  }

  const commentCount    = task?.commentsCount    ?? task?.comments?.length    ?? 0
  const attachmentCount = task?.attachmentsCount ?? task?.attachments?.length ?? 0
  const subtaskCount    = (task?.subTasks || task?.subtasks)?.length ?? 0

  const tabLabel = (tab) => {
    if (tab.key === "comments"    && commentCount)    return `${tab.label} (${commentCount})`
    if (tab.key === "attachments" && attachmentCount) return `${tab.label} (${attachmentCount})`
    if (tab.key === "subtasks"    && subtaskCount)    return `${tab.label} (${subtaskCount})`
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
        ::-webkit-calendar-picker-indicator { filter: invert(0.8); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .responsive-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 600px) {
          .modal-overlay { padding: 0 !important; }
          .modal-content {
            width: 100% !important; max-height: 100dvh !important;
            height: 100dvh !important; border-radius: 0 !important; border: none !important;
          }
          .responsive-grid { grid-template-columns: 1fr !important; gap: 14px; }
        }
      `}</style>

      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, direction: "rtl",
        }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, y: 24 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 24 }} transition={{ type: "spring", damping: 22 }}
          style={{
            background: "#0d1420", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "92vh",
            display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            position: "absolute", top: 0, right: 0, left: 0, height: 3,
            background: "linear-gradient(90deg,#C9A96E,#d4a855,transparent)",
          }} />

          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
              <Loader2 size={32} color="#C9A96E" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : !task ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: 14 }}>
              التاسك مش موجود
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "22px 24px 0", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, color: "#6b7891", marginBottom: 6 }}>تاسك #{task.id}</div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: "#e8edf5", margin: 0, lineHeight: 1.4, wordBreak: "break-word" }}>
                      {task.title}
                    </h2>
                  </div>
                  <button onClick={onClose} style={{ ...S.btnGhost, height: 34, padding: "0 10px", flexShrink: 0 }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="hide-scrollbar" style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 1 }}>
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                        padding: "10px 14px", borderRadius: "8px 8px 0 0",
                        border: "none", cursor: "pointer", whiteSpace: "nowrap",
                        background: activeTab === tab.key ? "#080d16" : "transparent",
                        color: activeTab === tab.key ? "#C9A96E" : "#6b7891",
                        fontSize: 12, fontWeight: 700, fontFamily: "'Cairo',sans-serif",
                        borderBottom: activeTab === tab.key ? "2px solid #C9A96E" : "2px solid transparent",
                        transition: "all .18s",
                      }}
                    >
                      <tab.Icon size={13} /> {tabLabel(tab)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px", background: "#080d16" }} className="custom-scroll">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  >
                    {activeTab === "details"     && <DetailsTab     task={task} projectId={projectId} onUpdated={handleUpdated} />}
                    {activeTab === "comments"    && <CommentsTab    taskId={task.id} />}
                    {activeTab === "time"        && <TimeTab        taskId={task.id} />}
                    {activeTab === "attachments" && <AttachmentsTab taskId={task.id} />}
                    {activeTab === "subtasks"    && <SubtasksTab    task={task} projectId={projectId} />}
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