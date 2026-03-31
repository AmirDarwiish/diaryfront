// projectService.js — Complete API service for ZEIIA Project Management
// Base URL
const BASE = "https://aura-crm.runasp.net";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── helper: unwrap { success, data, errorCode, message } wrapper ────────────
function unwrapResponse(parsed, httpStatus) {
  // Backend wrapper pattern: { success: bool, data: any, errorCode, message }
  if (parsed && typeof parsed === "object" && "success" in parsed) {
    if (parsed.success === false) {
      const errMsg = parsed.message || parsed.errorCode || parsed.data || `HTTP ${httpStatus}`
      throw new Error(String(errMsg))
    }
    // success: true — but data might be an error string (e.g. "already have active session")
    // detect: if data is a string that looks like an error message, throw it
    if (typeof parsed.data === "string" && parsed.data.length > 0 && !parsed.message) {
      // Return as-is — let caller decide (some success responses have string data)
      return parsed.data
    }
    // Return the inner data (or full object if no data key)
    return parsed.data !== undefined ? parsed.data : parsed
  }
  return parsed
}

async function handleResponse(res) {
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : {} } catch { parsed = text || {} }

  if (!res.ok) {
    // HTTP error — extract message
    let msg = `HTTP ${res.status}`
    if (typeof parsed === "string") {
      msg = parsed || msg
    } else if (parsed && typeof parsed === "object") {
      msg = parsed.message || parsed.title || parsed.detail || parsed.data || msg
      if (typeof msg !== "string") msg = JSON.stringify(msg)
    }
    throw new Error(String(msg))
  }

  return unwrapResponse(parsed, res.status)
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects() {
  const res = await fetch(`${BASE}/api/projects`, {
    headers: headers(),
    credentials: "include",
  });
  const data = await handleResponse(res);
  // normalize: backend returns "title" but frontend uses "name"
  const arr = Array.isArray(data) ? data : data?.data || [];
  return arr.map(normalizeProject);
}

export async function getProject(id) {
  const res = await fetch(`${BASE}/api/projects/${id}`, { headers: headers() });
  const data = await handleResponse(res);
  const proj = data?.data || data;
  return normalizeProject(proj);
}

export async function createProject(body) {
  // body already uses { title, description, priority }
  const res = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await handleResponse(res);
  // backend returns { message, projectId } — fetch the full project
  const projectId = data?.projectId || data?.data?.projectId;
  if (projectId) {
    return getProject(projectId);
  }
  return data;
}

export async function updateProject(id, body) {
  const res = await fetch(`${BASE}/api/projects/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function updateProjectStatus(id, status) {
  // status is a string like "Planning","Active","OnHold","Done","Cancelled"
  // Try sending as string first (ASP.NET can deserialize enum from string name)
  // If your backend uses [JsonConverter(typeof(JsonStringEnumConverter))] this works directly
  // Otherwise map to int
  const statusIntMap = { Planning: 0, Active: 1, OnHold: 2, Done: 3, Cancelled: 4 };
  // Send BOTH so backend can pick whichever it prefers
  const statusValue = statusIntMap[status] ?? 0;
  const res = await fetch(`${BASE}/api/projects/${id}/status`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ status: statusValue }),
  });
  // If that fails, retry with string enum
  if (!res.ok) {
    const res2 = await fetch(`${BASE}/api/projects/${id}/status`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res2);
  }
  return handleResponse(res);
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE}/api/projects/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

export async function getProjectStats(id) {
  const res = await fetch(`${BASE}/api/projects/${id}/stats`, { headers: headers() });
  return handleResponse(res);
}

// normalize backend project shape → frontend shape
function normalizeProject(p) {
  if (!p) return p;
  return {
    ...p,
    name:   p.name   || p.title  || "",   // frontend uses "name"
    title:  p.title  || p.name   || "",
    status: normalizeStatus(p.status),
    priority: normalizePriority(p.priority),
    myRole: p.myRole || p.currentUserRole || inferRole(p),
  };
}

// backend may return int enums — convert to string
function normalizeStatus(s) {
  if (typeof s === "string") return s;
  const map = { 0: "Planning", 1: "Active", 2: "OnHold", 3: "Done", 4: "Cancelled" };
  return map[s] ?? "Planning";
}

function normalizePriority(p) {
  if (typeof p === "string") return p;
  const map = { 0: "Low", 1: "Medium", 2: "High", 3: "Critical" };
  return map[p] ?? "Medium";
}

function inferRole(p) {
  // if the current user is createdByUserId we can't know here — default Member
  return "Member";
}

// ─── Boards ──────────────────────────────────────────────────────────────────

export async function getBoards(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards`, { headers: headers() });
  return handleResponse(res);
}

export async function createBoard(projectId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await handleResponse(res);
  // backend returns { message, boardId } — build the board object
  const boardId = data?.boardId || data?.data?.boardId;
  if (boardId) {
    // re-fetch boards to get the new one with full data
    const boards = await getBoards(projectId);
    const arr = Array.isArray(boards) ? boards : boards?.data || [];
    const found = arr.find((b) => b.id === boardId);
    return found || { id: boardId, name: body.name, color: body.color };
  }
  return data;
}

export async function updateBoard(projectId, boardId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards/${boardId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function deleteBoard(projectId, boardId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards/${boardId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks`, { headers: headers() });
  const data = await handleResponse(res);
  const arr = Array.isArray(data) ? data : data?.data || [];
  return arr.map(normalizeTask);
}

export async function getTask(projectId, taskId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    headers: headers(),
  });
  const data = await handleResponse(res);
  return normalizeTask(data?.data || data);
}

export async function createTask(projectId, body) {
  // Ensure boardColumnId is int & priority is int enum
  const payload = {
    ...body,
    boardColumnId: parseInt(body.boardColumnId, 10),
    priority: typeof body.priority === "string"
      ? { Low: 0, Medium: 1, High: 2, Critical: 3 }[body.priority] ?? 1
      : (body.priority ?? 1),
  };
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  const taskId = data?.taskId || data?.data?.taskId;
  if (taskId) {
    return getTask(projectId, taskId);
  }
  return data;
}

export async function updateTask(projectId, taskId, body) {
  // map priority string → int if needed
  const payload = {
    ...body,
    priority: typeof body.priority === "string"
      ? { Low: 0, Medium: 1, High: 2, Critical: 3 }[body.priority] ?? 1
      : (body.priority ?? 1),
    status: typeof body.status === "string"
      ? { Todo: 0, InProgress: 1, InReview: 2, Done: 3 }[body.status] ?? 0
      : body.status,
  };
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function moveTask(projectId, taskId, targetBoardId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}/move`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ targetBoardId: parseInt(targetBoardId, 10), newOrder: 1 }),
  });
  return handleResponse(res);
}

export async function deleteTask(projectId, taskId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

function normalizeTask(t) {
  if (!t) return t;
  return {
    ...t,
    priority: normalizePriority(t.priority),
    status:   normalizeTaskStatus(t.status),
  };
}

function normalizeTaskStatus(s) {
  if (typeof s === "string") return s;
  const map = { 0: "Todo", 1: "InProgress", 2: "InReview", 3: "Done" };
  return map[s] ?? "Todo";
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getMembers(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/members`, { headers: headers() });
  const data = await handleResponse(res);
  const arr = Array.isArray(data) ? data : data?.data || [];
  return arr.map((m) => ({
    ...m,
    role: normalizeMemberRole(m.role),
  }));
}

export async function addMember(projectId, body) {
  // body = { email, role }  — backend needs { userId, role }
  // First resolve email → userId via search endpoint
  let userId = body.userId;
  if (!userId && body.email) {
    userId = await resolveUserIdByEmail(body.email);
  }
  const roleMap = { Viewer: 0, Member: 1, Manager: 2, Owner: 3 };
  const roleValue = typeof body.role === "string" ? (roleMap[body.role] ?? 1) : (body.role ?? 1);
  const res = await fetch(`${BASE}/api/projects/${projectId}/members`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, role: roleValue }),
  });
  return handleResponse(res);
}

export async function removeMember(projectId, memberId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

async function resolveUserIdByEmail(email) {
  // Try to find user by email — use search endpoint if available
  try {
    const res = await fetch(`${BASE}/api/users/search?email=${encodeURIComponent(email)}`, {
      headers: headers(),
    });
    if (res.ok) {
      const data = await res.json();
      const user = Array.isArray(data) ? data[0] : data?.data?.[0] || data;
      if (user?.id) return user.id;
    }
  } catch { /* fallback */ }
  // If no search endpoint, try direct lookup
  try {
    const res = await fetch(`${BASE}/api/users?email=${encodeURIComponent(email)}`, {
      headers: headers(),
    });
    if (res.ok) {
      const data = await res.json();
      const user = Array.isArray(data) ? data[0] : data?.data?.[0] || data;
      if (user?.id) return user.id;
    }
  } catch { /* ignore */ }
  throw new Error(`لم يتم العثور على مستخدم بهذا البريد: ${email}`);
}

function normalizeMemberRole(r) {
  if (typeof r === "string") return r;
  const map = { 0: "Viewer", 1: "Member", 2: "Manager", 3: "Owner" };
  return map[r] ?? "Member";
}

// ─── Sprints ─────────────────────────────────────────────────────────────────

export async function getSprints(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/sprints`, { headers: headers() });
  const data = await handleResponse(res);
  const arr = Array.isArray(data) ? data : data?.data || [];
  return arr.map((s) => ({
    ...s,
    status: normalizeSprintStatus(s.status),
  }));
}

export async function createSprint(projectId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/sprints`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name:      body.name,
      goal:      body.goal || null,
      startDate: body.startDate || null,
      endDate:   body.endDate   || null,
    }),
  });
  const data = await handleResponse(res);
  const sprintId = data?.sprintId || data?.data?.sprintId;
  if (sprintId) {
    const sprints = await getSprints(projectId);
    const arr = Array.isArray(sprints) ? sprints : sprints?.data || [];
    return arr.find((s) => s.id === sprintId) || { id: sprintId, ...body, status: "Planned" };
  }
  return data;
}

export async function startSprint(sprintId) {
  const res = await fetch(`${BASE}/api/sprints/${sprintId}/start`, {
    method: "PUT",
    headers: headers(),
  });
  return handleResponse(res);
}

export async function completeSprint(sprintId) {
  const res = await fetch(`${BASE}/api/sprints/${sprintId}/complete`, {
    method: "PUT",
    headers: headers(),
  });
  return handleResponse(res);
}

export async function deleteSprint(sprintId) {
  const res = await fetch(`${BASE}/api/sprints/${sprintId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

function normalizeSprintStatus(s) {
  if (typeof s === "string") {
    // backend uses Planning/Active/Completed, frontend uses Planned/Active/Completed
    if (s === "Planning") return "Planned";
    return s;
  }
  const map = { 0: "Planned", 1: "Active", 2: "Completed" };
  return map[s] ?? "Planned";
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getComments(taskId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/comments`, { headers: headers() });
  const data = await handleResponse(res);
  const arr = Array.isArray(data) ? data : data?.data || [];
  return arr.map((c) => ({
    ...c,
    // normalize author name from createdByUserId if fullName not present
    authorName: c.authorName || c.author?.fullName || c.createdByUserName || `مستخدم #${c.createdByUserId}`,
  }));
}

export async function addComment(taskId, content) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ content }),
  });
  const data = await handleResponse(res);
  const commentId = data?.commentId || data?.data?.commentId;
  if (commentId) {
    return { id: commentId, content, createdAt: new Date().toISOString() };
  }
  return data;
}

export async function updateComment(taskId, commentId, content) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/comments/${commentId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

export async function deleteComment(taskId, commentId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

// ─── Time Logs ───────────────────────────────────────────────────────────────

export async function getTimelogs(taskId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/timelogs`, { headers: headers() });
  const raw = await handleResponse(res);
  // after unwrap: raw might be { logs, totalMinutes } or plain array
  let arr = []
  if (Array.isArray(raw)) {
    arr = raw
  } else if (raw && Array.isArray(raw.logs)) {
    arr = raw.logs
  } else if (raw && Array.isArray(raw.data?.logs)) {
    arr = raw.data.logs
  } else if (raw && Array.isArray(raw.data)) {
    arr = raw.data
  }
  return arr.map((l) => ({
    ...l,
    startTime:       l.startTime       || l.startedAt,
    endTime:         l.endTime         || l.endedAt,
    durationMinutes: l.durationMinutes ?? l.duration ?? 0,
    isRunning:       l.isRunning || (!l.endedAt && !l.endTime && !!l.startedAt),
  }));
}

export async function startTimer(taskId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/timelogs/start`, {
    method: "POST",
    headers: headers(),
  });

  // Special case: 400 "already have active session" — fetch existing active log
  if (res.status === 400) {
    const text = await res.text()
    let errMsg = ""
    try {
      const parsed = JSON.parse(text)
      errMsg = parsed?.data || parsed?.message || ""
    } catch { errMsg = text }

    if (typeof errMsg === "string" && errMsg.toLowerCase().includes("active")) {
      // Fetch existing logs and return the running one
      const logs = await getTimelogs(taskId)
      const running = logs.find(l => l.isRunning)
      if (running) return running
    }
    throw new Error(String(errMsg || "Failed to start timer"))
  }

  const data = await handleResponse(res);
  // backend returns { message, logId } or wrapper { success, data: { logId } }
  const logId = data?.logId ?? data?.id
  const startedAt = new Date().toISOString();
  return {
    id:        logId,
    taskId,
    startTime: startedAt,
    startedAt: startedAt,
    isRunning: true,
    durationMinutes: 0,
  };
}

export async function stopTimer(taskId, logId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/timelogs/${logId}/stop`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ note: "" }),
  });
  const data = await handleResponse(res);
  // backend returns { message, durationMinutes }
  return {
    id: logId,
    durationMinutes: data?.durationMinutes || data?.data?.durationMinutes || 0,
    isRunning: false,
    endTime: new Date().toISOString(),
    endedAt: new Date().toISOString(),
  };
}

export async function addManualTime(taskId, body) {
  // body = { description, minutes }
  const now = new Date();
  const startedAt = new Date(now.getTime() - body.minutes * 60 * 1000).toISOString();
  const endedAt = now.toISOString();
  const res = await fetch(`${BASE}/api/tasks/${taskId}/timelogs/manual`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      startedAt,
      endedAt,
      durationMinutes: parseInt(body.minutes, 10),
      note: body.description || "",
    }),
  });
  const data = await handleResponse(res);
  const logId = data?.logId || data?.data?.logId;
  return {
    id: logId,
    description: body.description,
    durationMinutes: parseInt(body.minutes, 10),
    startTime: startedAt,
    isRunning: false,
  };
}

export async function deleteTimelog(taskId, logId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/timelogs/${logId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export async function getAttachments(taskId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/attachments`, { headers: headers() });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : data?.data || [];
}

export async function uploadAttachment(taskId, file) {
  // Backend expects { fileName, fileUrl, fileSize, mimeType }
  // We upload the file first to get a URL, OR if there's a direct upload endpoint:
  const formData = new FormData();
  formData.append("file", file);

  // Try multipart upload first
  const uploadRes = await fetch(`${BASE}/api/tasks/${taskId}/attachments/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: formData,
  });

  if (uploadRes.ok) {
    const data = await uploadRes.json();
    return data?.data || data;
  }

  // Fallback: use JSON endpoint with a placeholder URL
  // (In production you'd upload to S3/Cloudinary first)
  const fakeUrl = `${BASE}/files/${Date.now()}_${file.name}`;
  const res = await fetch(`${BASE}/api/tasks/${taskId}/attachments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      fileName: file.name,
      fileUrl:  fakeUrl,
      fileSize: file.size,
      mimeType: file.type,
    }),
  });
  const data = await handleResponse(res);
  return {
    id:         data?.attachmentId || data?.data?.attachmentId,
    fileName:   file.name,
    fileUrl:    fakeUrl,
    fileSize:   file.size,
    mimeType:   file.type,
    createdAt:  new Date().toISOString(),
  };
}

export async function deleteAttachment(taskId, attachmentId) {
  const res = await fetch(`${BASE}/api/tasks/${taskId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
}