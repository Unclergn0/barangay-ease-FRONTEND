/* BarangayEase Analytics administrator sign-in */
(() => {
  'use strict';

  const TOKEN_KEY = 'barangayease_user';
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const loginButton = document.getElementById('loginBtn');

  function apiBase() {
    if (!window.BE_API_BASE_URL) {
      throw new Error('API configuration is missing. Check webAdminjs/api-config.js.');
    }
    return window.BE_API_BASE_URL.replace(/\/+$/, '');
  }

  function showError(message) {
    errorBox.textContent = message || 'Unable to sign in. Please try again.';
    errorBox.style.display = 'block';
  }

  document.querySelectorAll('.toggle-password').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      toggle.classList.toggle('fa-eye', !reveal);
      toggle.classList.toggle('fa-eye-slash', reveal);
    });
  });

  // A valid existing administrator session can go straight to the report page.
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    if (saved && saved.token && saved.barangayId) {
      window.location.replace('AnalyticsReport.html');
      return;
    }
  } catch (_) {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
      showError('Enter your work email and password.');
      return;
    }

    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

    try {
      const response = await fetch(`${apiBase()}/admins/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Login failed (${response.status}).`);
      if (!data.token || !data.adminId || !data.barangayId || !data.barangay) {
        throw new Error('The server returned an incomplete administrator account. Contact the system administrator.');
      }

      sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
        token: data.token,
        adminId: data.adminId,
        name: data.fullname || data.username || data.email,
        email: data.email,
        role: data.role,
        assignedBarangay: data.barangay,
        barangayId: data.barangayId
      }));
      window.location.href = 'AnalyticsReport.html';
    } catch (error) {
      showError(error.message || 'Unable to connect to the BarangayEase server.');
    } finally {
      loginButton.disabled = false;
      loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
    }
  });
})();
