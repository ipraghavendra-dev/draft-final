const form = document.getElementById('verify-form');
const messageEl = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');
const formView = document.getElementById('form-view');
const successView = document.getElementById('success-view');
const welcomeText = document.getElementById('welcome-text');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageEl.className = 'message';
  messageEl.textContent = '';

  const email = document.getElementById('email').value.trim();
  const age = document.getElementById('age').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying…';

  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, age }),
    });
    const data = await res.json();

    if (!res.ok) {
      messageEl.className = 'message error';
      messageEl.textContent = data.error || 'Something went wrong. Try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify and continue';
      return;
    }

    welcomeText.textContent = `Welcome, ${email}. Your access has been confirmed.`;
    formView.classList.add('hidden');
    successView.classList.remove('hidden');
  } catch (err) {
    messageEl.className = 'message error';
    messageEl.textContent = 'Could not reach the server. Try again.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify and continue';
  }
});
