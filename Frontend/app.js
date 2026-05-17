const BACKEND_BASE_URL = 'https://complaints-registration-platform-full-4lxq.onrender.com';
const API_URL = `${BACKEND_BASE_URL}/api`;

// State
let currentUser = null;
let currentView = 'login';
let currentComplaint = {
    text: '',
    aiQuestion: '',
    aiAnswer: ''
};

// DOM Elements
const views = {
    login: document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    myComplaints: document.getElementById('view-my-complaints'),
    submitComplaint: document.getElementById('view-submit-complaint'),
    adminDashboard: document.getElementById('view-admin-dashboard')
};

const header = document.getElementById('app-header');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// Helper: Show View
function showView(viewName) {
    Object.keys(views).forEach(key => {
        if (key === viewName) {
            views[key].classList.remove('hidden');
        } else {
            views[key].classList.add('hidden');
        }
    });
    currentView = viewName;

    // Show/hide header based on auth
    if (viewName === 'login' || viewName === 'register') {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        if (currentUser) {
            userDisplay.textContent = `Hello, ${currentUser.name}`;
        }
    }

    // Load data for specific views
    if (viewName === 'myComplaints') {
        loadMyComplaints();
    } else if (viewName === 'adminDashboard') {
        loadAdminComplaints();
    }
}

// Helper: API Fetch with credentials
async function apiFetch(endpoint, options = {}) {
    options.credentials = 'include'; // Send cookies
    options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API call failed');
    }

    return data;
}

// Session Check
async function checkSession() {
    try {
        const data = await apiFetch('/auth/me');
        currentUser = data;
        if (currentUser.role === 'admin') {
            showView('adminDashboard');
        } else {
            showView('myComplaints');
        }
    } catch (error) {
        console.log('Not logged in or session expired');
        showView('login');
    }
}

// Auth Flows
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        errorEl.classList.add('hidden');
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        currentUser = data;
        if (currentUser.role === 'admin') {
            showView('adminDashboard');
        } else {
            showView('myComplaints');
        }
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
});

// Navigation Links
document.getElementById('go-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showView('register');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showView('login');
});

document.getElementById('nav-submit-complaint').addEventListener('click', () => {
    showView('submitComplaint');
});

logoutBtn.addEventListener('click', async () => {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
        currentUser = null;
        showView('login');
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

// Registration Flow
let registrationEmail = '';

document.getElementById('send-otp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const errorEl = document.getElementById('register-error');

    try {
        errorEl.classList.add('hidden');
        await apiFetch('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ name, email })
        });
        registrationEmail = email;
        document.getElementById('reg-step-1').classList.add('hidden');
        document.getElementById('reg-step-2').classList.remove('hidden');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
});

document.getElementById('verify-otp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('reg-otp').value;
    const errorEl = document.getElementById('register-error');

    // Proceed to password setup
    document.getElementById('reg-step-2').classList.add('hidden');
    document.getElementById('reg-step-3').classList.remove('hidden');
});

document.getElementById('setup-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const errorEl = document.getElementById('register-error');

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
    }

    const otp = document.getElementById('reg-otp').value;

    try {
        errorEl.classList.add('hidden');
        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: registrationEmail, otp, password })
        });
        alert('Registration successful! Please login.');
        showView('login');
        // Reset forms
        document.getElementById('send-otp-form').reset();
        document.getElementById('verify-otp-form').reset();
        document.getElementById('setup-password-form').reset();
        document.getElementById('reg-step-1').classList.remove('hidden');
        document.getElementById('reg-step-2').classList.add('hidden');
        document.getElementById('reg-step-3').classList.add('hidden');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
});

// Complaint Submission Flow
document.getElementById('get-ai-question-btn').addEventListener('click', async () => {
    const text = document.getElementById('complaint-text').value;
    const errorEl = document.getElementById('complaint-error');

    if (!text) {
        alert('Please enter complaint text');
        return;
    }

    try {
        errorEl.classList.add('hidden');
        const data = await apiFetch('/ai/question', {
            method: 'POST',
            body: JSON.stringify({ complaint_text: text })
        });
        currentComplaint.text = text;
        currentComplaint.aiQuestion = data.question;

        document.getElementById('ai-question-text').textContent = data.question;
        document.getElementById('ai-follow-up-section').classList.remove('hidden');
        document.getElementById('get-ai-question-btn').classList.add('hidden');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
});

document.getElementById('complaint-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const answer = document.getElementById('ai-answer').value;
    const errorEl = document.getElementById('complaint-error');

    try {
        errorEl.classList.add('hidden');
        await apiFetch('/complaints', {
            method: 'POST',
            body: JSON.stringify({
                complaint_text: currentComplaint.text,
                ai_question: currentComplaint.aiQuestion,
                ai_answer: answer
            })
        });
        alert('Complaint submitted successfully!');
        showView('myComplaints');
        // Reset form
        document.getElementById('complaint-form').reset();
        document.getElementById('ai-follow-up-section').classList.add('hidden');
        document.getElementById('get-ai-question-btn').classList.remove('hidden');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
});

// Load Complaints
async function loadMyComplaints() {
    const listEl = document.getElementById('complaints-list');
    try {
        const complaints = await apiFetch('/complaints/my');
        if (complaints.length === 0) {
            listEl.innerHTML = '<p class="no-data">No complaints submitted yet.</p>';
            return;
        }

        listEl.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <h3>Complaint</h3>
                <p>${c.complaint_text}</p>
                ${c.ai_question ? `
                    <h3>AI Question</h3>
                    <p>${c.ai_question}</p>
                    <h3>Your Answer</h3>
                    <p>${c.user_answer}</p>
                ` : ''}
                <div class="date">${new Date(c.created_at).toLocaleString()}</div>
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = `<p class="error-message">Failed to load complaints: ${error.message}</p>`;
    }
}

async function loadAdminComplaints() {
    const listEl = document.getElementById('admin-complaints-list');
    try {
        const complaints = await apiFetch('/admin/complaints');
        if (complaints.length === 0) {
            listEl.innerHTML = '<p class="no-data">No complaints found.</p>';
            return;
        }

        listEl.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <h3>User: ${c.userName} (${c.userEmail})</h3>
                <h3>Complaint</h3>
                <p>${c.complaint_text}</p>
                ${c.ai_question ? `
                    <h3>AI Question</h3>
                    <p>${c.ai_question}</p>
                    <h3>Answer</h3>
                    <p>${c.user_answer}</p>
                ` : ''}
                <div class="date">${new Date(c.created_at).toLocaleString()}</div>
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = `<p class="error-message">Failed to load complaints: ${error.message}</p>`;
    }
}

// Init
checkSession();
