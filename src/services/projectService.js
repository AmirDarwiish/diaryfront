// projects.js  —  replace the contents of the file imported as n(961)
// Place this at:  src/api/projects.js  (or wherever your bundler resolves module 961)

const BASE = "https://aura-crm.runasp.net";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects() {
  const res = await fetch(`${BASE}/api/projects`, { headers: headers() 
    ,credentials: "include" // جرب ضيف السطر ده
  });
  if (!res.ok) throw new Error(`getProjects: ${res.status}`);
  return res.json();
}

export async function getProject(id) {
  const res = await fetch(`${BASE}/api/projects/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(`getProject: ${res.status}`);
  return res.json();
}

export async function createProject(body) {
  const res = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createProject: ${res.status}`);
  return res.json();
}

export async function updateProject(id, body) {
  const res = await fetch(`${BASE}/api/projects/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`updateProject: ${res.status}`);
  return res.json();
}

export async function updateProjectStatus(id, status) {
  const res = await fetch(`${BASE}/api/projects/${id}/status`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`updateProjectStatus: ${res.status}`);
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE}/api/projects/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`deleteProject: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function getProjectStats(id) {
  const res = await fetch(`${BASE}/api/projects/${id}/stats`, { headers: headers() });
  if (!res.ok) throw new Error(`getProjectStats: ${res.status}`);
  return res.json();
}

// ─── Boards ──────────────────────────────────────────────────────────────────

export async function getBoards(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards`, { headers: headers() });
  if (!res.ok) throw new Error(`getBoards: ${res.status}`);
  return res.json();
}

export async function createBoard(projectId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createBoard: ${res.status}`);
  return res.json();
}

export async function deleteBoard(projectId, boardId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/boards/${boardId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`deleteBoard: ${res.status}`);
  return res.json().catch(() => ({}));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks`, { headers: headers() });
  if (!res.ok) throw new Error(`getTasks: ${res.status}`);
  return res.json();
}

export async function createTask(projectId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createTask: ${res.status}`);
  return res.json();
}

export async function getTask(projectId, taskId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`getTask: ${res.status}`);
  return res.json();
}

export async function updateTask(projectId, taskId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`updateTask: ${res.status}`);
  return res.json();
}

export async function moveTask(projectId, taskId, boardId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}/move`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ boardId }),
  });
  if (!res.ok) throw new Error(`moveTask: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function deleteTask(projectId, taskId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`deleteTask: ${res.status}`);
  return res.json().catch(() => ({}));
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getMembers(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/members`, { headers: headers() });
  if (!res.ok) throw new Error(`getMembers: ${res.status}`);
  return res.json();
}

export async function addMember(projectId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/members`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`addMember: ${res.status}`);
  return res.json();
}

export async function removeMember(projectId, memberId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`removeMember: ${res.status}`);
  return res.json().catch(() => ({}));
}

// ─── Sprints ─────────────────────────────────────────────────────────────────

export async function getSprints(projectId) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/sprints`, { headers: headers() });
  if (!res.ok) throw new Error(`getSprints: ${res.status}`);
  return res.json();
}

export async function createSprint(projectId, body) {
  const res = await fetch(`${BASE}/api/projects/${projectId}/sprints`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createSprint: ${res.status}`);
  return res.json();
}

export async function startSprint(sprintId) {
  const res = await fetch(`${BASE}/api/sprints/${sprintId}/start`, {
    method: "PUT",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`startSprint: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function completeSprint(sprintId) {
  const res = await fetch(`${BASE}/api/sprints/${sprintId}/complete`, {
    method: "PUT",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`completeSprint: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function deleteSprint(sprintId) {
  const res = await fetch(`${BASE}/api/sprints/${sprintId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`deleteSprint: ${res.status}`);
  return res.json().catch(() => ({}));
}