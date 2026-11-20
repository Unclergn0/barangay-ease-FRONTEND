/* BarangayEase Analytics - live database-backed reporting */
(() => {
  'use strict';

  const SESSION_KEY = 'barangayease_user';
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
    catch (_) { return null; }
  })();

  let barChart = null;
  let residentsChart = null;
  let trendChart = null;
  let criticalRows = [];

  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function apiBase() {
    if (!window.BE_API_BASE_URL) throw new Error('API configuration is missing.');
    return window.BE_API_BASE_URL.replace(/\/+$/, '');
  }

  function setMessage(message, isError = false) {
    const el = byId('analyticsMessage');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('is-error', isError);
    el.style.display = message ? 'block' : 'none';
  }

  function localDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function applyPreset(preset) {
    const end = new Date();
    const start = new Date(end);
    if (preset === 'today') start.setDate(end.getDate());
    else if (preset === '7d') start.setDate(end.getDate() - 6);
    else if (preset === '30d') start.setDate(end.getDate() - 29);
    else if (preset === '90d') start.setDate(end.getDate() - 89);
    byId('startDate').value = localDate(start);
    byId('endDate').value = localDate(end);
  }

  async function apiGet(path) {
    const response = await fetch(`${apiBase()}${path}`, {
      headers: { 'Authorization': `Bearer ${session.token}`, 'Accept': 'application/json' }
    });
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace('AnalyticsLogin.html');
      throw new Error('Your session has expired or is not authorized. Please sign in again.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Unable to load analytics (${response.status}).`);
    return data;
  }

  function renderCharts(data) {
    const rows = data.barangays || [];
    const labels = rows.map((r) => r.barangay);
    if (barChart) barChart.destroy();
    barChart = new Chart(byId('barangayBarChart'), {
      type: 'bar',
      data: { labels, datasets: [
        { label: 'Complaints', data: rows.map((r) => r.complaints), backgroundColor: '#f59e0b' },
        { label: 'Service Requests', data: rows.map((r) => r.requests), backgroundColor: '#1d4ed8' },
        { label: 'Pending Requests', data: rows.map((r) => r.pendingRequests), backgroundColor: '#dc2626' }
      ] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    if (residentsChart) residentsChart.destroy();
    const priorities = data.priorityDistribution || { mild: 0, immediate: 0, critical: 0 };
    residentsChart = new Chart(byId('residentsDoughnutChart'), {
      type: 'doughnut',
      data: { labels: ['Mild', 'Immediate', 'Critical'], datasets: [{ label: 'Complaints', data: [priorities.mild || 0, priorities.immediate || 0, priorities.critical || 0], backgroundColor: ['#059669', '#f59e0b', '#dc2626'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });

    const daily = data.daily || [];
    const dates = [...new Set(daily.map((r) => r.date))].sort();
    const totals = dates.map((date) => daily.filter((r) => r.date === date).reduce((acc, r) => ({
      complaints: acc.complaints + Number(r.complaints || 0),
      requests: acc.requests + Number(r.requests || 0),
      pending: acc.pending + Number(r.pendingRequests || 0)
    }), { complaints: 0, requests: 0, pending: 0 }));
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(byId('trendLineChart'), {
      type: 'line',
      data: { labels: dates, datasets: [
        { label: 'Service Requests', data: totals.map((x) => x.requests), borderColor: '#1d4ed8', tension: 0.3 },
        { label: 'Complaints', data: totals.map((x) => x.complaints), borderColor: '#d97706', tension: 0.3 },
        { label: 'Pending Requests', data: totals.map((x) => x.pending), borderColor: '#dc2626', tension: 0.3 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }

  function renderCriticalTable() {
    const query = (byId('criticalSearch').value || '').trim().toLowerCase();
    const rows = criticalRows.filter((row) => !query ||
      [row.caseId, row.barangay, row.category, row.summary, row.status, row.severity]
        .some((value) => String(value || '').toLowerCase().includes(query)));
    byId('criticalTbody').innerHTML = rows.length ? rows.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.caseId)}</strong></td>
        <td>${escapeHtml(r.barangay)}</td>
        <td>${escapeHtml(r.category)}</td>
        <td>${escapeHtml(r.summary)}</td>
        <td>${escapeHtml(r.date)}</td>
        <td><span class="badge ${r.severity === 'Critical' ? 'badge-critical' : 'badge-high'}">${escapeHtml(r.severity)}</span></td>
        <td><span class="badge ${/resolved|completed|closed/i.test(r.status) ? 'badge-resolved' : 'badge-pending'}">${escapeHtml(r.status)}</span></td>
      </tr>`).join('') :
      '<tr><td colspan="7" class="empty-cell">No critical or immediate complaints found for this date range.</td></tr>';
  }

  function renderBarangayTable(rows) {
    byId('barangayTbody').innerHTML = rows.length ? rows.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.barangay)}</strong></td>
        <td>${Number(r.residents || 0).toLocaleString()}</td>
        <td>${Number(r.complaints || 0).toLocaleString()}</td>
        <td><span class="badge badge-critical">${Number(r.criticalComplaints || 0).toLocaleString()}</span></td>
        <td>${Number(r.requests || 0).toLocaleString()}</td>
        <td>${Number(r.pendingRequests || 0).toLocaleString()}</td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty-cell">No records for this barangay.</td></tr>';
  }

  async function loadAnalytics() {
    const startDate = byId('startDate').value;
    const endDate = byId('endDate').value;
    if (!startDate || !endDate || startDate > endDate) {
      setMessage('Please select a valid date range.', true);
      return;
    }
    byId('applyFilterBtn').disabled = true;
    setMessage('Loading live analytics from the BarangayEase database...');
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const data = await apiGet(`/analytics/report?${params.toString()}`);
      byId('kpiResidents').textContent = Number(data.totalResidents || 0).toLocaleString();
      byId('kpiComplaints').textContent = Number(data.totalComplaints || 0).toLocaleString();
      byId('kpiRequests').textContent = Number(data.totalRequests || 0).toLocaleString();
      byId('kpiPending').textContent = Number(data.pendingRequests || 0).toLocaleString();
      criticalRows = data.criticalComplaints || [];
      renderCharts(data);
      renderCriticalTable();
      renderBarangayTable(data.barangays || []);
      setMessage(`Live database report: ${data.barangay || session.assignedBarangay} · ${startDate} to ${endDate}`);
    } catch (error) {
      setMessage(error.message || 'Unable to load analytics.', true);
    } finally {
      byId('applyFilterBtn').disabled = false;
    }
  }

  function downloadCriticalCsv() {
    if (!criticalRows.length) {
      setMessage('There are no critical or immediate complaints to export for this date range.');
      return;
    }
    const headers = ['Case ID', 'Barangay', 'Category', 'Summary', 'Date Filed', 'Severity', 'Status'];
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(quote).join(','), ...criticalRows.map((r) =>
      [r.caseId, r.barangay, r.category, r.summary, r.date, r.severity, r.status].map(quote).join(',')
    )].join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `barangayease-critical-complaints-${byId('startDate').value}-to-${byId('endDate').value}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!session || !session.token || !session.barangayId) {
      window.location.replace('AnalyticsLogin.html');
      return;
    }
    byId('userBadge').textContent = `${session.name || session.email} · ${session.assignedBarangay}`;
    byId('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace('AnalyticsLogin.html');
    });
    byId('datePreset').addEventListener('change', (event) => {
      if (event.target.value !== 'custom') {
        applyPreset(event.target.value);
        loadAnalytics();
      }
    });
    byId('applyFilterBtn').addEventListener('click', loadAnalytics);
    byId('criticalSearch').addEventListener('input', renderCriticalTable);
    byId('downloadCriticalBtn').addEventListener('click', downloadCriticalCsv);
    applyPreset('30d');
    loadAnalytics();
  });
})();
