const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

// Change this before deploying, or set ADMIN_PASSWORD as an environment variable.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// In-memory session store: token -> expiry timestamp
const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60; // 1 hour

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- helpers ----------

function loadSubmissions() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSubmissions(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  const expiry = token && sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// ---------- public verification endpoint ----------

app.post('/api/verify', (req, res) => {
  const { email, age } = req.body || {};
  const ageNum = Number(age);

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
    return res.status(400).json({ error: 'Enter a valid age.' });
  }
  if (ageNum < 18) {
    return res.status(403).json({ error: 'You must be 18 or older to continue.' });
  }

  const submissions = loadSubmissions();
  submissions.push({
    id: crypto.randomUUID(),
    email,
    age: ageNum,
    verifiedAt: new Date().toISOString(),
  });
  saveSubmissions(submissions);

  res.json({ ok: true });
});

// ---------- admin auth ----------

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: SESSION_TTL_MS,
  });
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) sessions.delete(token);
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const submissions = loadSubmissions().sort(
    (a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt)
  );
  res.json({ submissions });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD} (set ADMIN_PASSWORD env var to change it)`);
});
