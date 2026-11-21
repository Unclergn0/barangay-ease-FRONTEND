/* BarangayEase Analytics - live database-backed reporting */
(() => {
  'use strict';

  const SESSION_KEY = 'barangayease_user';
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
    catch (_) { return null; }
  })();

  let complaintsChart = null;
  let requestsChart = null;
  let criticalChart = null;
  let priorityChart = null;
  let trendChart = null;
  let ratingsChart = null;
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

  function createBarangayChart(canvasId, rows, valueKey, label, color, existingChart) {
    if (existingChart) existingChart.destroy();

    return new Chart(byId(canvasId), {
      type: 'bar',
      data: {
        labels: rows.map((row) => row.barangay),
        datasets: [{
          label,
          data: rows.map((row) => Number(row[valueKey] || 0)),
          backgroundColor: color,
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: (context) => `${label}: ${Number(context.raw || 0).toLocaleString()}`
          } }
        },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } },
          y: { ticks: { autoSkip: false } }
        }
      }
    });
  }

  function renderCharts(data) {
    const rows = data.barangays || [];

    // Three separate, full-width comparisons across every registered barangay.
    complaintsChart = createBarangayChart(
      'complaintsByBarangayChart', rows, 'complaints',
      'Complaints', '#f59e0b', complaintsChart
    );
    requestsChart = createBarangayChart(
      'requestsByBarangayChart', rows, 'requests',
      'Service Requests', '#1d4ed8', requestsChart
    );
    criticalChart = createBarangayChart(
      'criticalByBarangayChart', rows, 'criticalComplaints',
      'Critical & Immediate Complaints', '#dc2626', criticalChart
    );

    if (ratingsChart) ratingsChart.destroy();
    ratingsChart = new Chart(byId('ratingsByBarangayChart'), {
      type: 'bar',
      data: {
        labels: rows.map((row) => row.barangay),
        datasets: [{
          label: 'Average rating (out of 5)',
          data: rows.map((row) => Number(row.averageRating || 0)),
          backgroundColor: '#0f766e',
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: (context) => `${Number(context.raw || 0).toFixed(2)} / 5 · ${Number(rows[context.dataIndex]?.ratingCount || 0).toLocaleString()} ratings`
          } }
        },
        scales: { x: { min: 0, max: 5, ticks: { stepSize: 1 } }, y: { ticks: { autoSkip: false } } }
      }
    });

    if (priorityChart) priorityChart.destroy();
    const priorities = data.priorityDistribution || { mild: 0, immediate: 0, critical: 0 };
    priorityChart = new Chart(byId('priorityDoughnutChart'), {
      type: 'doughnut',
      data: {
        labels: ['Mild', 'Immediate', 'Critical'],
        datasets: [{
          label: 'Complaints',
          data: [
            Number(priorities.mild || 0),
            Number(priorities.immediate || 0),
            Number(priorities.critical || 0)
          ],
          backgroundColor: ['#059669', '#f59e0b', '#dc2626']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    const daily = data.daily || [];
    const dates = daily.map((row) => row.date);
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(byId('trendLineChart'), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Complaints',
            data: daily.map((row) => Number(row.complaints || 0)),
            borderColor: '#d97706',
            tension: 0.3
          },
          {
            label: 'Critical & Immediate',
            data: daily.map((row) => Number(row.criticalComplaints || 0)),
            borderColor: '#dc2626',
            tension: 0.3
          },
          {
            label: 'Service Requests',
            data: daily.map((row) => Number(row.requests || 0)),
            borderColor: '#1d4ed8',
            tension: 0.3
          },
          {
            label: 'Pending Requests',
            data: daily.map((row) => Number(row.pendingRequests || 0)),
            borderColor: '#7c3aed',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
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
        <td><strong>${Number(r.averageRating || 0).toFixed(2)} / 5</strong></td>
        <td>${Number(r.ratingCount || 0).toLocaleString()}</td>
        <td>${Number(r.rating1Star || 0).toLocaleString()}</td>
        <td>${Number(r.rating2Star || 0).toLocaleString()}</td>
        <td>${Number(r.rating3Star || 0).toLocaleString()}</td>
        <td>${Number(r.rating4Star || 0).toLocaleString()}</td>
        <td>${Number(r.rating5Star || 0).toLocaleString()}</td>
      </tr>`).join('') : '<tr><td colspan="13" class="empty-cell">No registered barangays found.</td></tr>';
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
      byId('kpiCritical').textContent = Number(data.totalCriticalComplaints || 0).toLocaleString();
      byId('kpiAverageRating').textContent = `${Number(data.averageRating || 0).toFixed(2)} / 5`;
      byId('kpiTotalRatings').textContent = Number(data.totalRatings || 0).toLocaleString();
      criticalRows = data.criticalComplaints || [];
      renderCharts(data);
      renderCriticalTable();
      renderBarangayTable(data.barangays || []);
      setMessage(`Live citywide database report · ${data.barangayCount || (data.barangays || []).length} barangays · ${startDate} to ${endDate}`);
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
    byId('userBadge').textContent = `${session.name || session.email} · All Barangays`;
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
