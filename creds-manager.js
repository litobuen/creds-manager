const myUrl = 'http://127.0.0.1:3000/creds';

// ── Toast ──────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 2800);
}

// ── Render list ────────────────────────────────────────
function renderList(items) {
  const list = document.getElementById('creds-list');
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">No credentials found.</div>';
    return;
  }
  list.innerHTML = items.map(item => `
    <div class="cred-item" id="item-${CSS.escape(item.email)}">
      <div class="cred-avatar">${getInitials(item.first_name, item.last_name)}</div>
      <div class="cred-info">
        <div class="cred-name">${esc(item.first_name)} ${esc(item.last_name)}</div>
        <div class="cred-email">${esc(item.email)}</div>
      </div>
      <button class="btn-delete" title="Remove" onclick="deleteItem('${esc(item.email)}')">✕</button>
    </div>
  `).join('');
}

function getInitials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Fetch & display all creds ──────────────────────────
async function loadCreds() {
  try {
    const res = await fetch(myUrl, {
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    if (res.ok) {
      const data = await res.json();
      renderList(data);
    }
  } catch (e) {
    // silently fail on load — server may not be running yet
  }
}

// ── Add ────────────────────────────────────────────────
async function addCreds() {
  const first = document.getElementById('firstName').value.trim();
  const last  = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!first || !last || !email) {
    showToast('Please fill out all fields.', 'error');
    return;
  }

  try {
    const res = await fetch(myUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({ first_name: first, last_name: last, email })
    });
    if (res.ok) {
      showToast(`Added: ${first} ${last}`);
      clearInputs();
      loadCreds();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Email might already exist.', 'error');
    }
  } catch (e) {
    showToast('Cannot connect to PostgREST.', 'error');
  }
}

// ── Remove by email input field ────────────────────────
async function removeCredsByInput() {
  const email = document.getElementById('email').value.trim();
  if (!email) {
    showToast('Enter an email to remove.', 'error');
    return;
  }
  await deleteItem(email);
  clearInputs();
}

// ── Delete a specific item ─────────────────────────────
async function deleteItem(email) {
  const deleteUrl = `${myUrl}?email=eq.${encodeURIComponent(email)}`;
  try {
    const res = await fetch(deleteUrl, { method: 'DELETE', mode: 'cors' });
    if (res.ok) {
      showToast(`Removed: ${email}`);
      loadCreds();
    } else {
      showToast('Error removing entry.', 'error');
    }
  } catch (e) {
    showToast('Network error during deletion.', 'error');
  }
}

// ── Helpers ────────────────────────────────────────────
function clearInputs() {
  ['firstName', 'lastName', 'email'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// Load on start
loadCreds();
