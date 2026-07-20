const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');
const tableWrap = document.getElementById('table-wrap');
const countPill = document.getElementById('count-pill');
const logoutBtn = document.getElementById('logout-btn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMessage.className = 'message';
  const password = document.getElementById('password').value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Unlocking…';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) {
      loginMessage.className = 'message error';
      loginMessage.textContent = data.error || 'Incorrect password.';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Unlock dashboard';
      return;
    }

    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loadSubmissions();
  } catch (err) {
    loginMessage.className = 'message error';
    loginMessage.textContent = 'Could not reach the server.';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Unlock dashboard';
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
  document.getElementById('password').value = '';
});

async function loadSubmissions() {
  const res = await fetch('/api/admin/submissions');
  if (!res.ok) {
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    return;
  }
  const { submissions } = await res.json();
  countPill.textContent = `${submissions.length} total`;

  if (submissions.length === 0) {
    tableWrap.innerHTML = '<div class="empty-state">No verifications yet.</div>';
    return;
  }

  const rows = submissions.map((s) => `
    <tr>
      <td>${escapeHtml(s.email)}</td>
      <td class="mono">${s.age}</td>
      <td class="mono">${new Date(s.verifiedAt).toLocaleString()}</td>
    </tr>
  `).join('');

  tableWrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Email</th><th>Age</th><th>Verified at</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// If already logged in (cookie still valid), skip straight to dashboard.
(async function checkSession() {
  const res = await fetch('/api/admin/submissions');
  if (res.ok) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loadSubmissions();
  }
})();
