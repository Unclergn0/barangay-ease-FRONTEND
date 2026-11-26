/* =========================================================
   BARANGAYEASE - BARANGAY ADMIN DASHBOARD
   Uses the API routes already present in FRONTEND 2 DASHBOARD.
   Only Critical complaints appear under AI Complaints. Mild and Immediate stay in Complaints.
   ========================================================= */

const API_BASE_URL = (window.BE_API_BASE_URL ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8080/api"
        : "https://barangay-ease-backend.onrender.com/api"))
    .replace(/\/api\/?$/, "");
let loggedAdmin = null;
let currentBarangay = "";
let residentsCache = [];
let requestsCache = [];
let complaintsCache = [];
let feedbackSummaryCache = null;
let feedbackRowsCache = [];

const themes = {
    Alabang: {
        primary: "#0A369D",
        secondary: "#FF69B4"
    },

    "Ayala Alabang": {
        primary: "#003366",
        secondary: "#FFD700"
    },

    Bayanan: {
        primary: "#9ACD32",
        secondary: "#FFFFFF"
    },

    Buli: {
        primary: "#FF8800",
        secondary: "#265ee0"
    },

    Cupang: {
        primary: "#C1121F",
        secondary: "#0A369D"
    },

    Poblacion: {
        primary: "#0A369D",
        secondary: "#FFD60A"
    },

    Putatan: {
        primary: "#C1121F",
        secondary: "#FFFFFF"
    },

    Tunasan: {
        primary: "#FF8800",
        secondary: "#FFFFFF"
    },

    Sucat: {
        primary: "#0A369D",
        secondary: "#FFFFFF"
    }
};
const logos = {
  "Alabang": "webAdminlogo/BRGY.ALABANG.png",
  "Ayala Alabang": "webAdminlogo/BRGY.AYALA-ALABANG.jfif",
  "Bayanan": "webAdminlogo/BRGY.BAYANAN.png",
  "Buli": "webAdminlogo/BRGY.BULI.png",
  "Cupang": "webAdminlogo/BRGY.CUPANG.png",
  "Poblacion": "webAdminlogo/BRGY.POBLACION.png",
  "Putatan": "webAdminlogo/BRGY.PUTATAN.png",
  "Sucat": "webAdminlogo/BRGY.SUCAT.png",
  "Tunasan": "webAdminlogo/BRGY.TUNASAN.png"
};

const $ = id => document.getElementById(id);
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const idOf = item => item?.requestId ?? item?.id ?? item?.complaintId;
const normalize = value => String(value ?? "").trim().toLowerCase();

async function api(path, options = {}) {
  const token = loggedAdmin?.token || (() => {
    try { return JSON.parse(localStorage.getItem("loggedAdmin") || "null")?.token || ""; }
    catch { return ""; }
  })();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}
function setText(id, value) { const el = $(id); if (el) el.textContent = value ?? ""; }
function belongsToBarangay(resident) { return normalize(resident?.barangay) === normalize(currentBarangay); }
function residentOf(item) { return item?.resident || item?.residentDetails || null; }

document.addEventListener("DOMContentLoaded", initializeAdminDashboard);
async function initializeAdminDashboard() {
  try { loggedAdmin = JSON.parse(localStorage.getItem("loggedAdmin") || "null"); }
  catch { loggedAdmin = null; }
  if (!loggedAdmin || !loggedAdmin.barangay || loggedAdmin.barangayId == null) {
    alert("Access denied. Please log in first.");
    location.replace("loginAdmin.html");
    return;
  }
  currentBarangay = loggedAdmin.barangay;
  const theme = themes[currentBarangay];
  if (!theme || !logos[currentBarangay]) {
    alert("The barangay assigned to this admin is not configured. Please contact the system administrator.");
    logout(); return;
  }
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--secondary", theme.secondary);
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.style.backgroundColor = theme.primary;
  if ($("barangayLogo")) { $("barangayLogo").src = logos[currentBarangay]; $("barangayLogo").alt = `${currentBarangay} Barangay Logo`; }
  setText("barangayName", `Barangay ${currentBarangay}`);
  setText("adminName", loggedAdmin.fullname || "Administrator");
  setText("profileName", loggedAdmin.fullname || "--");
  setText("profileEmail", loggedAdmin.email || "--");
  setText("profileRole", `${loggedAdmin.role || "Admin"} - Barangay ${currentBarangay}`);
  await refreshDashboard();
  showSection(localStorage.getItem("activeSection") || "dashboard");
  startNotificationPolling();
}

async function refreshDashboard() {
  await Promise.allSettled([loadResidents(), loadRequests(), loadComplaints(), loadAdminNotifications(), loadDashboardFeedback()]);
  renderAnalytics();
}
async function loadResidents() {
  const table = $("residentsTable"); if (!table) return;
  try {
    const data = await api("/api/residents");
    residentsCache = Array.isArray(data) ? data : [];
    const header = `<tr><th>First Name</th><th>Last Name</th><th>Mobile Number</th><th>Address</th><th>Barangay</th><th>Email</th></tr>`;
    table.innerHTML = header + (residentsCache.length ? residentsCache.map(r => `<tr><td>${safe(r.firstName)}</td><td>${safe(r.lastName)}</td><td>${safe(r.contactNumber || "N/A")}</td><td>${safe(r.houseStreet || "")}</td><td>${safe(r.barangay)}</td><td>${safe(r.email)}</td></tr>`).join("") : `<tr><td colspan="6" class="empty-row">No residents found in this barangay.</td></tr>`);
    setText("dashTotalResidents", residentsCache.length);
  } catch (e) { showTableError(table, 6, e); }
}

function attachmentButtons(files, kind) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return "No attachment";
  return list.map(f => {
    const id = Number(f.fileId);
    if (!Number.isFinite(id)) return safe(f.fileName || f.name || "Attachment");
    const action = kind === "complaint" ? `downloadComplaintFile(${id})` : `downloadRequestFile(${id})`;
    return `<button class="admin-action" type="button" onclick="${action}">${safe(f.fileName || f.name || "View file")}</button>`;
  }).join("<br>");
}
async function downloadProtectedFile(path) {
  const token = loggedAdmin?.token || (() => { try { return JSON.parse(localStorage.getItem("loggedAdmin") || "null")?.token || ""; } catch { return ""; } })();
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`Unable to open attachment (${response.status}).`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  if (["application/pdf", "image/jpeg", "image/png"].includes(blob.type)) {
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    const a = document.createElement("a"); a.href = url; a.download = "attachment";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
async function downloadRequestFile(fileId) {
  try { await downloadProtectedFile(`/api/services/files/${encodeURIComponent(fileId)}`); }
  catch (e) { console.error(e); alert(e.message); }
}
async function downloadComplaintFile(fileId) {
  try { await downloadProtectedFile(`/api/complaints/files/${encodeURIComponent(fileId)}`); }
  catch (e) { console.error(e); alert(e.message); }
}
function requestActionButtons(id, currentStatus) {
  const current = normalize(currentStatus || "Pending");
  const allowed = {
    "pending": ["Under Review", "Approved", "Rejected"],
    "under review": ["Approved", "Rejected"],
    "approved": ["Ready for Pickup", "Under Review"],
    "ready for pickup": ["Completed"],
    "rejected": ["Under Review"]
  };
  const next = allowed[current] || [];
  if (!next.length) return '<span class="section-note">No further actions</span>';
  const buttons = next.map(status => {
    const cls = status === "Approved" || status === "Completed" ? "admin-action approve"
      : status === "Rejected" ? "admin-action reject" : "admin-action";
    const label = status === "Under Review" ? "Review" :
      status === "Ready for Pickup" ? "Ready" : status;
    return `<button class="${cls}" onclick="changeRequestStatus(${id},'${status}')">${label}</button>`;
  });
  if (["pending", "under review", "approved", "rejected"].includes(current)) {
    buttons.push(`<button class="admin-action" onclick="requestMoreDocuments(${id})">Need Docs</button>`);
  }
  return buttons.join(" ");
}
async function loadRequests() {
  const table = $("requestsTable"); if (!table) return;
  try {
    const data = await api("/api/services/admin/all");
    const all = Array.isArray(data) ? data : [];
    requestsCache = all;
    const header = `<tr><th>Request ID</th><th>Resident</th><th>Service Type</th><th>Purpose</th><th>Uploaded Files</th><th>Pickup</th><th>Status</th><th>Actions</th></tr>`;
    table.innerHTML = header + (requestsCache.length ? requestsCache.map(req => {
      const rid = Number(idOf(req)); const r = residentOf(req);
      const name = `${r?.firstName || ""} ${r?.lastName || ""}`.trim() || "Resident";
      const status = req.status || "Pending";
      const pickup = [req.pickupDate, req.pickupTime].filter(Boolean).join(" ") || "N/A";
      const attachments = Array.isArray(req.files) ? req.files : [];
      const fileHtml = attachments.length ? attachments.map(f =>
        `<button class="admin-action" type="button" onclick="downloadRequestFile(${Number(f.fileId)})">${safe(f.fileName || f.name || "View file")}</button>`
      ).join("<br>") : "No attachment";
      return `<tr><td>#${safe(rid)}</td><td>${safe(name)}</td><td>${safe(req.serviceType || req.requestType || req.title || "N/A")}</td><td>${safe(req.purpose || "N/A")}</td><td>${fileHtml}</td><td>${safe(pickup)}</td><td>${safe(status)}</td><td>${requestActionButtons(rid, status)}</td></tr>`;
    }).join("") : `<tr><td colspan="8" class="empty-row">No document requests found for this barangay.</td></tr>`);
    setText("dashPendingRequests", requestsCache.filter(r => normalize(r.status || "Pending") === "pending").length);
  } catch (e) { showTableError(table, 8, e); }
}
async function changeRequestStatus(id, status, presetNote) {
  if (!Number.isFinite(id)) return;
  let note = presetNote || "";
  if (!presetNote) {
    if (!confirm(`Change request #${id} status to ${status}?`)) return;
    if (status === "Rejected") {
      const reason = prompt("Reason for rejection (shown to the resident, optional):");
      if (reason === null) return;
      note = reason.trim();
    }
  }
  try {
    const noteParam = note ? `&note=${encodeURIComponent(note)}` : "";
    await api(`/api/services/admin/status/${id}?status=${encodeURIComponent(status)}${noteParam}`, { method: "PUT" });
    await refreshDashboard(); alert(`Request #${id} updated to ${status}. The resident was notified.`);
  } catch (e) { console.error(e); alert(`Unable to update request: ${e.message}`); }
}
async function requestMoreDocuments(id) {
  const note = (prompt(`What must the resident submit for request #${id}? (this message is sent to the resident)`) || "").trim();
  if (!note) return;
  await changeRequestStatus(id, "Under Review", note);
}

async function loadComplaints() {
  const normalTable = $("complaintsTable");
  const aiTable = $("aiComplaintsTable");

  if (!normalTable && !aiTable) return;

  const header = `<tr>
    <th>Complaint ID</th>
    <th>Resident</th>
    <th>Complaint Title</th>
    <th>Details</th>
    <th>Evidence Files</th>
    <th>Classification</th>
    <th>Status</th>
    <th>Actions</th>
  </tr>`;

  const aiHeader = `<tr>
    <th>Complaint ID</th>
    <th>Resident</th>
    <th>Complaint Title</th>
    <th>Details</th>
    <th>Evidence Files</th>
    <th>AI Classification</th>
    <th>AI Review</th>
    <th>Status</th>
    <th>Actions</th>
  </tr>`;

  try {
    const data = await api("/api/complaints");
    complaintsCache = Array.isArray(data) ? data : [];

    // AI COMPLAINTS:
    // All Critical complaints stay here, regardless of review status.
    const critical = complaintsCache.filter(c =>
      normalize(c.classificationType) === "critical"
    );

    // NORMAL COMPLAINTS:
    // Only Mild and Immediate complaints appear here.
    // Critical complaints NEVER appear in this table.
    const regular = complaintsCache.filter(c => {
      const classification = normalize(c.classificationType);
      return classification === "mild" || classification === "immediate";
    });

    // Render AI Complaints
    const aiRows = critical.length
      ? critical.map(c => {
          const id = Number(c.complaintId ?? c.id);
          const r = residentOf(c);

          const resident =
            c.complainantName ||
            `${r?.firstName || ""} ${r?.lastName || ""}`.trim() ||
            "Resident";

          const reviewStatus = String(
            c.aiReviewStatus || "PENDING"
          ).trim().toUpperCase();

          const note = c.aiReviewNote
            ? `<br><small>Note: ${safe(c.aiReviewNote)}</small>`
            : "";

          const evidence = attachmentButtons(c.files, "complaint");

          const status = normalize(c.status);
          const isFinal = status === "resolved" || status === "dismissed";
          const disabled = isFinal ? "disabled" : "";

          const actions = `
            <button class="admin-action" ${disabled}
              onclick="changeComplaintStatus(${id},'Investigating')">
              Investigate
            </button>

            <button class="admin-action approve" ${disabled}
              onclick="reviewAiComplaint(${id},'ACCEPT')">
              Resolve
            </button>

            <button class="admin-action reject" ${disabled}
              onclick="reviewAiComplaint(${id},'REJECT')">
              Dismiss
            </button>
          `;

          return `
            <tr>
              <td>#${safe(id)}</td>
              <td>${safe(resident)}</td>
              <td>${safe(c.title || c.complaintTitle || "Untitled complaint")}</td>
              <td>${safe(c.complaintDetails || c.description || "")}</td>
              <td>${evidence}</td>
              <td>
                ${safe((c.classificationType || "critical").toUpperCase())}
                <br>
                <small>${safe(c.aiMessage || "")}</small>
              </td>
              <td>${safe(reviewStatus)}${note}</td>
              <td>${safe(c.status || "Pending")}</td>
              <td>${actions}</td>
            </tr>
          `;
        }).join("")
      : `
        <tr>
          <td colspan="9" class="empty-row">
            No Critical AI complaints found.
          </td>
        </tr>
      `;

    // Render Normal Complaints: Mild and Immediate ONLY
    const normalRows = regular.length
      ? regular.map(c => {
          const id = Number(c.complaintId ?? c.id);
          const r = residentOf(c);

          const resident =
            c.complainantName ||
            `${r?.firstName || ""} ${r?.lastName || ""}`.trim() ||
            "Resident";

          const evidence = attachmentButtons(c.files, "complaint");

          const classification = normalize(c.classificationType)
            .toUpperCase();

          const status = normalize(c.status);
          const isFinal = status === "resolved" || status === "dismissed";
          const disabled = isFinal ? "disabled" : "";

          const actions = `
            <button class="admin-action" ${disabled}
              onclick="changeComplaintStatus(${id},'Investigating')">
              Investigate
            </button>

            <button class="admin-action approve" ${disabled}
              onclick="changeComplaintStatus(${id},'Resolved')">
              Resolve
            </button>

            <button class="admin-action reject" ${disabled}
              onclick="changeComplaintStatus(${id},'Dismissed')">
              Dismiss
            </button>
          `;

          return `
            <tr>
              <td>#${safe(id)}</td>
              <td>${safe(resident)}</td>
              <td>${safe(c.title || c.complaintTitle || "Untitled complaint")}</td>
              <td>${safe(c.complaintDetails || c.description || "")}</td>
              <td>${evidence}</td>
              <td>${safe(classification)}</td>
              <td>${safe(c.status || "Pending")}</td>
              <td>${actions}</td>
            </tr>
          `;
        }).join("")
      : `
        <tr>
          <td colspan="8" class="empty-row">
            No Mild or Immediate complaints found.
          </td>
        </tr>
      `;

    if (normalTable) {
      normalTable.innerHTML = header + normalRows;
    }

    if (aiTable) {
      aiTable.innerHTML = aiHeader + aiRows;
    }

    setText("dashTotalComplaints", complaintsCache.length);
    setText("dashCriticalComplaints", critical.length);

  } catch (e) {
    if (normalTable) showTableError(normalTable, 8, e);
    if (aiTable) showTableError(aiTable, 9, e);
  }
}


function viewAiComplaint(id) {
  const complaint = complaintsCache.find(
    c => Number(c.complaintId ?? c.id) === Number(id)
  );

  if (!complaint) {
    alert("Complaint details are not available. Refresh the list and try again.");
    return;
  }

  const resident = complaint.complainantName || "Resident";
  const title = complaint.title || complaint.complaintTitle || "Untitled complaint";
  const details = complaint.complaintDetails || complaint.description || "No description provided.";
  const review = complaint.aiReviewStatus || "PENDING";
  const note = complaint.aiReviewNote || "No admin review note.";

  alert(`COMPLAINT #${id}

Title: ${title}
Resident: ${resident}
Classification: ${(complaint.classificationType || "critical").toUpperCase()}
AI Review: ${review}
Status: ${complaint.status || "Pending"}

Details:
${details}

AI Message:
${complaint.aiMessage || "No AI message."}

Admin Note:
${note}`);
}


async function reviewAiComplaint(id, action) {
  if (!Number.isFinite(Number(id))) return;

  const body = { action };
  const actionLabel = action === "ACCEPT" ? "resolve" : "dismiss";

  if (!confirm(
    `Are you sure you want to ${actionLabel} AI complaint #${id}? This is a final decision.`
  )) {
    return;
  }

  const note = prompt("Optional note for this review (you can leave it empty):");

  if (note === null) return;

  if (note.trim()) {
    body.note = note.trim();
  }

  try {
    await api(`/api/complaints/admin/ai-review/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    await loadComplaints();
    renderAnalytics();

    alert(
      `AI complaint #${id} was marked ${actionLabel === "resolve" ? "Resolved" : "Dismissed"}.`
    );

  } catch (e) {
    console.error(e);
    alert(`Unable to save AI review: ${e.message}`);
  }
}

async function changeComplaintStatus(id, status) {
  if (!Number.isFinite(id) || !confirm(`Change complaint #${id} status to ${status}?`)) return;
  try {
    await api(`/api/complaints/admin/status/${id}?status=${encodeURIComponent(status)}`, { method: "PUT" });
    await loadComplaints(); renderAnalytics(); alert(`Complaint #${id} updated to ${status}.`);
  } catch (e) { console.error(e); alert(`Unable to update complaint: ${e.message}`); }
}
async function loadDashboardFeedback() {
  try {
    const summary = await api("/api/admin/feedback/summary");
    feedbackSummaryCache = summary || null;
    renderDashboardFeedback(summary);
  } catch (error) {
    console.error("Assigned barangay feedback summary error:", error);
    setText("dashAverageRating", "N/A");
    setText("dashTotalRatings", "Unavailable");
    const stars = $("dashRatingStars");
    if (stars) stars.textContent = "Ratings API unavailable";
  }
}

function renderDashboardFeedback(summary) {
  if (!summary) return;
  const average = Number(summary.averageRating || 0);
  setText("dashAverageRating", Number.isFinite(average) && Number(summary.totalRatings) > 0 ? average.toFixed(2) : "0.00");
  setText("dashTotalRatings", Number(summary.totalRatings || 0).toLocaleString());
  const stars = $("dashRatingStars");
  if (stars) stars.textContent = "★".repeat(Math.round(average)) + "☆".repeat(5 - Math.round(average));
}

function reportDateQuery() {
  const from = $("reportDateFrom")?.value || "";
  const to = $("reportDateTo")?.value || "";
  if (from && to && from > to) throw new Error("The From date cannot be later than the To date.");
  if (Boolean(from) !== Boolean(to)) throw new Error("Select both From and To dates to filter resident ratings.");
  return from ? `?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}` : "";
}

async function loadReportFeedback() {
  const table = $("reportRatingsTable");
  const query = reportDateQuery();
  setText("ratingReportBarangay", currentBarangay);
  if (table) table.innerHTML = '<tr><td>Loading resident ratings...</td></tr>';
  try {
    const [summary, rows] = await Promise.all([
      api(`/api/admin/feedback/summary${query}`),
      api(`/api/admin/feedback${query}`)
    ]);
    feedbackSummaryCache = summary || null;
    feedbackRowsCache = Array.isArray(rows) ? rows : [];
    renderDashboardFeedback(summary);
    setText("reportAverageRating", Number(summary?.totalRatings || 0) ? `${Number(summary.averageRating || 0).toFixed(2)} / 5` : "0.00 / 5");
    setText("reportTotalRatings", Number(summary?.totalRatings || 0).toLocaleString());
    setText("reportCommentCount", Number(summary?.commentCount || 0).toLocaleString());
    const distribution = summary?.ratingDistribution || {};
    renderBarChart("reportRatingDistribution", {
      "5 Stars": Number(distribution["5Star"] || 0),
      "4 Stars": Number(distribution["4Star"] || 0),
      "3 Stars": Number(distribution["3Star"] || 0),
      "2 Stars": Number(distribution["2Star"] || 0),
      "1 Star": Number(distribution["1Star"] || 0)
    });
    renderFeedbackRows(feedbackRowsCache);
    renderRecentFeedback(summary?.recentFeedback || feedbackRowsCache.slice(0, 10));
  } catch (error) {
    console.error("Assigned barangay report feedback error:", error);
    setText("reportAverageRating", "Unavailable");
    setText("reportTotalRatings", "--");
    setText("reportCommentCount", "--");
    const chart = $("reportRatingDistribution");
    if (chart) chart.innerHTML = `<p class="chart-empty">${safe(error.message || "Unable to load ratings.")}</p>`;
    const recent = $("reportRecentFeedback");
    if (recent) recent.innerHTML = `<p class="chart-empty">Resident feedback could not be loaded. Confirm that the updated backend is deployed.</p>`;
    if (table) table.innerHTML = `<tr><td class="empty-row">Unable to load assigned barangay ratings.</td></tr>`;
  }
}

function renderFeedbackRows(rows) {
  const table = $("reportRatingsTable");
  if (!table) return;
  table.innerHTML = `<tr><th>Resident</th><th>Rating</th><th>Comment</th><th>Date Submitted</th></tr>` +
    (rows.length ? rows.map(row => `<tr><td>${safe(row.residentName || `Resident #${row.residentId ?? "N/A"}`)}</td><td><span class="rating-stars">${"★".repeat(Math.max(0, Math.min(5, Number(row.rating) || 0)))}${"☆".repeat(5 - Math.max(0, Math.min(5, Number(row.rating) || 0)))}</span> (${safe(row.rating)}/5)</td><td>${safe(row.comment || "No comment")}</td><td>${safe(formatFeedbackDate(row.createdAt))}</td></tr>`).join("") : `<tr><td colspan="4" class="empty-row">No resident ratings found for this barangay and date range.</td></tr>`);
}

function renderRecentFeedback(rows) {
  const host = $("reportRecentFeedback");
  if (!host) return;
  host.innerHTML = rows.length ? rows.slice(0, 10).map(row => {
    const rating = Math.max(0, Math.min(5, Number(row.rating) || 0));
    return `<article class="feedback-item"><div class="feedback-item-top"><strong>${safe(row.residentName || `Resident #${row.residentId ?? "N/A"}`)}</strong><span class="rating-stars">${"★".repeat(rating)}${"☆".repeat(5-rating)}</span></div><p>${safe(row.comment || "No written feedback provided.")}</p><small>${safe(formatFeedbackDate(row.createdAt))}</small></article>`;
  }).join("") : '<p class="chart-empty">No resident feedback comments yet.</p>';
}

function formatFeedbackDate(value) {
  if (!value) return "Date unavailable";
  const date = Array.isArray(value) ? new Date(value[0], (value[1] || 1)-1, value[2] || 1, value[3] || 0, value[4] || 0) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function renderAnalytics() {
  const pending = requestsCache.filter(r => normalize(r.status || "Pending") === "pending").length;
  const resolved = complaintsCache.filter(c => normalize(c.status) === "resolved").length;
  const critical = complaintsCache.filter(c => normalize(c.classificationType) === "critical").length;
  setText("analyticsResidents", residentsCache.length);
  setText("analyticsRequests", requestsCache.length);
  setText("analyticsComplaints", complaintsCache.length);
  setText("analyticsPending", pending);
  setText("analyticsResolved", resolved);
  setText("analyticsCritical", critical);
  renderBarChart("analyticsRequestChart", countBy(requestsCache, r => r.status || "Pending"));
  renderBarChart("analyticsComplaintChart", countBy(complaintsCache, c => c.classificationType || "Unclassified"));
  setText("reportBarangayName", currentBarangay);
  renderReports();
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = String(getter(item) || "Unknown").trim() || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
function renderBarChart(elementId, values) {
  const host = $(elementId);
  if (!host) return;
  const entries = Object.entries(values || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) { host.innerHTML = '<p class="chart-empty">No records available.</p>'; return; }
  const max = Math.max(1, ...entries.map(([, value]) => value));
  host.innerHTML = entries.map(([label, value]) => {
    const width = Math.max(2, Math.round(value / max * 100));
    return `<div class="bar-row"><div class="bar-label">${safe(label)}</div><div class="bar-track"><span class="bar-fill" style="width:${width}%"></span></div><strong>${value}</strong></div>`;
  }).join("");
}
function recordDate(item) {
  const raw = item?.createdAt || item?.dateCreated || item?.submittedAt || item?.requestDate;
  if (!raw) return null;
  const date = Array.isArray(raw)
    ? new Date(raw[0], (raw[1] || 1) - 1, raw[2] || 1, raw[3] || 0, raw[4] || 0)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
function isWithinReportDates(item, from, to) {
  const date = recordDate(item);
  if (!date) return !from && !to;
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (date > end) return false;
  }
  return true;
}
function getReportData() {
  const from = $("reportDateFrom")?.value || "";
  const to = $("reportDateTo")?.value || "";
  const type = $("reportType")?.value || "all";
  if (from && to && from > to) throw new Error("The From date cannot be later than the To date.");
  const requests = requestsCache.filter(r => isWithinReportDates(r, from, to));
  const complaints = complaintsCache.filter(c => isWithinReportDates(c, from, to));
  return {
    requests: type === "complaints" ? [] : requests,
    complaints: type === "requests" ? [] : complaints,
    allRequests: requests,
    allComplaints: complaints
  };
}
function renderReports() {
  loadReportFeedback();
  let data;
  try { data = getReportData(); }
  catch (error) {
    setText("reportsSummary", error.message);
    return;
  }
  const req = data.requests, comp = data.complaints;
  const status = key => req.filter(r => normalize(r.status || "Pending") === normalize(key)).length;
  setText("reportRequestTotal", req.length);
  setText("reportPendingTotal", status("Pending"));
  setText("reportApprovedTotal", status("Approved"));
  setText("reportCompletedTotal", status("Completed"));
  setText("reportComplaintTotal", comp.length);
  setText("reportResolvedTotal", comp.filter(c => normalize(c.status) === "resolved").length);
  setText("reportCriticalTotal", comp.filter(c => normalize(c.classificationType) === "critical").length);
  setText("reportsSummary", `Barangay ${currentBarangay} report: ${req.length} service requests and ${comp.length} complaints in the selected period. ${residentsCache.length} registered residents are currently on record.`);
  renderBarChart("reportRequestChart", countBy(req, r => r.status || "Pending"));
  renderBarChart("reportComplaintChart", countBy(comp, c => c.classificationType || "Unclassified"));
  renderBarChart("reportServiceChart", countBy(req, r => r.serviceType || r.requestType || r.title || "Other"));
  const months = countBy([...req, ...comp], item => {
    const d = recordDate(item);
    return d ? d.toLocaleString(undefined, { month: "short", year: "numeric" }) : "Date unavailable";
  });
  renderBarChart("reportMonthlyChart", months);
  const requestTable = $("reportRequestsTable"), complaintTable = $("reportComplaintsTable");
  if (requestTable) {
    requestTable.innerHTML = `<tr><th>ID</th><th>Resident</th><th>Service</th><th>Status</th><th>Date</th></tr>` +
      (req.length ? req.map(r => {
        const resident = residentOf(r);
        return `<tr><td>#${safe(idOf(r) ?? "N/A")}</td><td>${safe(`${resident?.firstName || ""} ${resident?.lastName || ""}`.trim() || "Resident")}</td><td>${safe(r.serviceType || r.requestType || r.title || "N/A")}</td><td>${safe(r.status || "Pending")}</td><td>${safe(recordDate(r)?.toLocaleDateString() || "N/A")}</td></tr>`;
      }).join("") : `<tr><td colspan="5" class="empty-row">No service requests match the selected filters.</td></tr>`);
  }
  if (complaintTable) {
    complaintTable.innerHTML = `<tr><th>ID</th><th>Resident</th><th>Complaint Title</th><th>Classification</th><th>Status</th><th>Date</th></tr>` +
      (comp.length ? comp.map(c => {
        const resident = residentOf(c);
        return `<tr><td>#${safe(c.complaintId ?? c.id ?? "N/A")}</td><td>${safe(c.complainantName || `${resident?.firstName || ""} ${resident?.lastName || ""}`.trim() || "Resident")}</td><td>${safe(c.title || c.complaintTitle || "Untitled complaint")}</td><td>${safe(c.classificationType || "Unclassified")}</td><td>${safe(c.status || "Pending")}</td><td>${safe(recordDate(c)?.toLocaleDateString() || "N/A")}</td></tr>`;
      }).join("") : `<tr><td colspan="6" class="empty-row">No complaints match the selected filters.</td></tr>`);
  }
}
function applyReportFilters() { renderReports(); }
function resetReportFilters() {
  if ($("reportDateFrom")) $("reportDateFrom").value = "";
  if ($("reportDateTo")) $("reportDateTo").value = "";
  if ($("reportType")) $("reportType").value = "all";
  renderReports();
}
function exportAnalyticsReport() {
  let data;
  try { data = getReportData(); } catch (e) { alert(e.message); return; }
  const rows = [["Record Type", "ID", "Resident", "Service / Details", "Classification", "Status", "Date"]];
  data.requests.forEach(r => {
    const resident = residentOf(r);
    rows.push(["Service Request", idOf(r) ?? "", `${resident?.firstName || ""} ${resident?.lastName || ""}`.trim(),
      r.serviceType || r.requestType || r.title || "", "", r.status || "Pending", recordDate(r)?.toISOString() || ""]);
  });
  data.complaints.forEach(c => {
    const resident = residentOf(c);
    rows.push(["Complaint", c.complaintId ?? c.id ?? "", c.complainantName || `${resident?.firstName || ""} ${resident?.lastName || ""}`.trim(),
      c.complaintDetails || c.description || "", c.classificationType || "", c.status || "Pending", recordDate(c)?.toISOString() || ""]);
  });
  feedbackRowsCache.forEach(f => rows.push(["Resident Rating", f.feedbackId ?? "", f.residentName || `Resident #${f.residentId ?? ""}`, `${f.rating || ""}/5 - ${f.comment || ""}`, "", "Submitted", formatFeedbackDate(f.createdAt)]));
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `BarangayEase-${currentBarangay.replace(/\s+/g, "-")}-Report.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function printAnalyticsReport() {
  renderReports();
  window.print();
}
function showTableError(table, columns, error) {
  console.error("Admin dashboard data error:", error);
  table.innerHTML = `<tr><td colspan="${columns}" class="empty-row">Unable to load data. Check that the backend is running and the API endpoint is available.</td></tr>`;
}
function showSection(sectionId, element) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.add("hidden"));
  const section = $(sectionId); if (section) section.classList.remove("hidden");
  document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));
  if (element) element.classList.add("active");
  else document.querySelector(`.sidebar-menu li[onclick*="'${sectionId}'"]`)?.classList.add("active");
  localStorage.setItem("activeSection", sectionId);
  const dropdown = $("profileDropdown"); if (dropdown) dropdown.classList.add("hidden");
}
function toggleProfileDropdown() { $("profileDropdown")?.classList.toggle("hidden"); }
function logout() {
  localStorage.removeItem("loggedAdmin"); localStorage.removeItem("activeSection");
  location.href = "loginAdmin.html";
}
function refreshCurrentData() { refreshDashboard(); }


/* ===== Notifications: bell, unread badge, and live EMERGENCY / CRITICAL alerts ===== */
let notificationsCache = [];
let seenNotificationIds = null;
let notificationTimer = null;
const isAlertTitle = title => /^(EMERGENCY|CRITICAL)/i.test(String(title || ""));

function notifTime(value) {
  if (!value) return "";
  const d = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] || 0, value[4] || 0)
    : new Date(value);
  return isNaN(d) ? "" : d.toLocaleString();
}

async function loadAdminNotifications() {
  try {
    const data = await api("/api/notifications");
    notificationsCache = (Array.isArray(data) ? data : [])
      .slice().sort((a, b) => Number(b.notificationId) - Number(a.notificationId));
    const unreadAlerts = notificationsCache.filter(n => !n.isRead && isAlertTitle(n.title));
    if (seenNotificationIds === null) {
      seenNotificationIds = new Set(notificationsCache.map(n => n.notificationId));
      if (unreadAlerts.length) showEmergencyToast(unreadAlerts[0], unreadAlerts.length);
    } else {
      const fresh = unreadAlerts.filter(n => !seenNotificationIds.has(n.notificationId));
      notificationsCache.forEach(n => seenNotificationIds.add(n.notificationId));
      if (fresh.length) { showEmergencyToast(fresh[0], fresh.length); loadComplaints(); }
    }
    renderNotifications();
  } catch (e) { console.error("Notification load error:", e); }
}

function renderNotifications() {
  const unread = notificationsCache.filter(n => !n.isRead).length;
  const badge = $("notifBadge");
  if (badge) { badge.textContent = unread > 99 ? "99+" : String(unread); badge.classList.toggle("hidden", unread === 0); }
  const list = $("notificationList"); if (!list) return;
  if (!notificationsCache.length) { list.innerHTML = `<div class="notification-item read"><p>No notifications yet.</p></div>`; return; }
  list.innerHTML = notificationsCache.map(n => {
    const cls = `${n.isRead ? "read" : "unread"}${isAlertTitle(n.title) ? " alert" : ""}`;
    return `<div class="notification-item ${cls}" onclick="openAdminNotification(${Number(n.notificationId)})"><strong>${safe(n.title)}</strong><p>${safe(n.description || n.message)}</p><small>${safe(notifTime(n.createdAt))}</small></div>`;
  }).join("");
}

function toggleNotifications(force) {
  const panel = $("notificationPanel"); if (!panel) return;
  const open = typeof force === "boolean" ? force : panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !open);
  if (open) { $("profileDropdown")?.classList.add("hidden"); loadAdminNotifications(); }
}

async function openAdminNotification(id) {
  const n = notificationsCache.find(x => Number(x.notificationId) === id); if (!n) return;
  if (!n.isRead) {
    try { await api(`/api/notifications/${id}/read`, { method: "PUT" }); n.isRead = true; }
    catch (e) { console.error(e); }
  }
  toggleNotifications(false);
  if (/^critical/i.test(String(n.title))) showSection("ai-complaints");
  else if (`${n.title} ${n.description || ""}`.toLowerCase().includes("complaint")) showSection("complaints");
  renderNotifications();
}

async function markAllNotificationsRead() {
  const unread = notificationsCache.filter(n => !n.isRead);
  await Promise.allSettled(unread.map(n => api(`/api/notifications/${Number(n.notificationId)}/read`, { method: "PUT" })));
  await loadAdminNotifications();
}

function showEmergencyToast(n, count) {
  $("emergencyToast")?.remove();
  const el = document.createElement("div");
  el.id = "emergencyToast"; el.className = "emergency-toast"; el.setAttribute("role", "alert");
  el.innerHTML = `<strong>${safe(n.title)}</strong><br>${safe(String(n.description || "").slice(0, 160))}`
    + `${count > 1 ? `<br><small>+${count - 1} more unread alert(s)</small>` : ""}<br><small>Click to view</small>`;
  el.onclick = () => { el.remove(); openAdminNotification(Number(n.notificationId)); };
  document.body.appendChild(el);
}

function startNotificationPolling() {
  clearInterval(notificationTimer);
  notificationTimer = setInterval(() => { if (!document.hidden) loadAdminNotifications(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loadAdminNotifications(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") toggleNotifications(false); });
}

document.addEventListener("DOMContentLoaded", () => {
  ["reportDateFrom", "reportDateTo", "reportType"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", renderReports);
  });
});