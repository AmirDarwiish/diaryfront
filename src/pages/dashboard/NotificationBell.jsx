import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [mentions, setMentions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentions/unread-count`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data?.data?.unreadCount ?? data?.unreadCount ?? 0);
      }
    } catch (err) {}
  };

  const fetchMentions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentions/mine`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMentions(Array.isArray(data) ? data : (data?.data || data?.mentions || []));
      }
    } catch (err) {}
    finally { setLoading(false); }
  };

  const markAsRead = async (mentionId, leadId) => {
    try {
      await fetch(`${API_BASE_URL}/api/mentions/${mentionId}/read`, {
        method: "POST",
        headers: authHeaders(),
      });
      setMentions((prev) => prev.map((m) => (m.mentionId === mentionId ? { ...m, isRead: true } : m)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setIsOpen(false);
      navigate(`/dashboard/leads/${leadId}`);
    } catch (err) {}
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) fetchMentions();
    setIsOpen(!isOpen);
  };

  const timeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr + 'Z');
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return new Date(dateStr).toLocaleDateString("ar-EG");
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", direction: "rtl" }}>
      <button onClick={handleToggle} style={{
          height:36, width:36, borderRadius:8, border:'1px solid #334155',
          background:'rgba(255,255,255,.04)', color:'#e8edf5', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, transition:'all .15s', position: "relative"
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "#ef4444", color: "white", fontSize: "10px",
            fontWeight: "bold", width: "16px", height: "16px",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0,
          width: "320px", background: "#0d1420", border: "1px solid #334155",
          borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          zIndex: 1000, overflow: "hidden"
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#C9A96E", fontWeight: 700 }}>الإشعارات</h3>
            <span style={{ fontSize: "11px", color: "#6b7891", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px" }}>
              {unreadCount} جديد
            </span>
          </div>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#6b7891", fontSize: "12px" }}>جاري التحميل...</div>
            ) : mentions.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b7891", fontSize: "13px" }}>لا توجد إشعارات حالياً.</div>
            ) : (
              mentions.map((m) => (
                <div key={m.mentionId} onClick={() => markAsRead(m.mentionId, m.leadId)}
                  style={{
                    padding: "14px 16px", borderBottom: "1px solid #334155",
                    background: m.isRead ? "transparent" : "rgba(201,169,110,0.08)",
                    cursor: "pointer", display: "flex", gap: "10px"
                  }}>
                  <div style={{ width: "8px", paddingTop: "4px" }}>
                    {!m.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C9A96E" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: m.isRead ? "#94a3b8" : "#f1f5f9", marginBottom: "4px" }}>
                      تم عمل <b>منشن (@)</b> لك في ملاحظة.
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7891" }}>{timeAgo(m.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}