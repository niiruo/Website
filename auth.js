/**
 * Hotel Tracker — Auth (connected to MySQL via PHP API)
 */

const STORAGE_KEYS = {
    USER:      'hotel_tracker_current_user',
    REVIEWS:   'hotel_reviews',
    FAVORITES: 'hotel_favorites',
    USERS:     'hotel_tracker_users'
};

const AUTH_API = 'api/auth.php';

// ── Helpers ─────────────────────────────────────────────────
function togglePassword(id) {
    const el = document.getElementById(id);
    if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function slide(index) {
    const slider = document.getElementById('slider');
    if (slider) slider.style.transform = `translateX(-${340 * index}px)`;
    clearMessages();
}

function clearMessages() {
    ['loginMsg', 'regMsg', 'forgotMsg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

function setMsg(id, text, isError = true) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = text;
    el.style.color = isError ? '#ff6b6b' : '#4CAF50';
}

function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ── Register ─────────────────────────────────────────────────
async function register() {
    const name    = document.getElementById('regName').value.trim();
    const email   = document.getElementById('regEmail').value.trim();
    const pass    = document.getElementById('regPass').value;
    const confirm = document.getElementById('confirmPass').value;
    const agree   = document.getElementById('agreeTerms').checked;

    if (!name || !email || !pass || !confirm) return setMsg('regMsg', 'All fields are required!');
    if (!isValidEmail(email))                  return setMsg('regMsg', 'Please enter a valid email!');
    if (pass.length < 6)                       return setMsg('regMsg', 'Password must be at least 6 characters!');
    if (pass !== confirm)                      return setMsg('regMsg', 'Passwords do not match!');
    if (!agree)                                return setMsg('regMsg', 'You must agree to the Terms & Conditions!');

    setMsg('regMsg', '⏳ Creating account...', false);

    try {
        const res  = await fetch(AUTH_API + '?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass })
        });
        const data = await res.json();

        if (data.error) {
            setMsg('regMsg', data.error);
        } else {
            setMsg('regMsg', '✓ Registered successfully! Please login.', false);
            ['regName','regEmail','regPass','confirmPass'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('agreeTerms').checked = false;
            setTimeout(() => slide(0), 1500);
        }
    } catch (e) {
        setMsg('regMsg', '❌ Cannot connect. Is XAMPP running?');
    }
}

// ── Login ─────────────────────────────────────────────────────
async function login() {
    const email    = document.getElementById('loginEmail').value.trim();
    const pass     = document.getElementById('loginPass').value;
    const remember = document.getElementById('rememberMe').checked;

    if (!email || !pass) return setMsg('loginMsg', 'Please enter your email and password!');

    setMsg('loginMsg', '⏳ Logging in...', false);

    try {
        const res  = await fetch(AUTH_API + '?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        const data = await res.json();

        if (data.error) {
            setMsg('loginMsg', data.error);
        } else {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
            setMsg('loginMsg', '✓ Login successful!', false);
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        }
    } catch (e) {
        setMsg('loginMsg', '❌ Cannot connect. Is XAMPP running?');
    }
}

// ── Reset Password ────────────────────────────────────────────
async function resetPassword() {
    const email   = document.getElementById('forgotEmail').value.trim();
    const newPass = document.getElementById('newPassword').value;

    if (!email || !newPass) return setMsg('forgotMsg', 'Please fill in all fields!');

    try {
        const res  = await fetch(AUTH_API + '?action=reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: newPass })
        });
        const data = await res.json();

        if (data.error) setMsg('forgotMsg', data.error);
        else {
            setMsg('forgotMsg', '✓ Password updated!', false);
            setTimeout(() => slide(0), 1500);
        }
    } catch (e) {
        setMsg('forgotMsg', '❌ Cannot connect. Is XAMPP running?');
    }
}

// ── Dashboard / Logout ────────────────────────────────────────
function showDashboard(user) {
    const authBox = document.getElementById('authBox');
    const dash    = document.getElementById('dash');
    if (authBox) authBox.style.display = 'none';
    if (dash) {
        dash.style.display = 'block';
        const nameEl   = document.getElementById('userName');
        const avatarEl = document.getElementById('avatar');
        if (nameEl)   nameEl.innerHTML   = user.name;
        if (avatarEl) avatarEl.innerHTML = user.name.charAt(0).toUpperCase();
    }
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = 'login.html';
}

// ── Auto-check on every page load ────────────────────────────
window.addEventListener('load', function () {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return;

    try {
        const user  = JSON.parse(userStr);
        showDashboard(user);
        const nameEl  = document.getElementById('display-name');
        const emailEl = document.getElementById('display-email');
        if (nameEl)  nameEl.innerText  = user.name;
        if (emailEl) emailEl.innerText = user.email;
    } catch (e) {}
});
