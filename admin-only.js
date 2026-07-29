// ============================
// COURSES
// ============================
const COURSES = [
    { id: 'mth-101-111', code: 'MTH 101/111', title: 'Elementary Mathematics I' },
    { id: 'mth-103-121', code: 'MTH 103/121', title: 'Elementary Mathematics II' },
    { id: 'mth-113',     code: 'MTH 113',     title: 'Intermediate Mathematics' },
    { id: 'sta-111',     code: 'STA 111',     title: 'Descriptive Statistics' },
    { id: 'sta-113',     code: 'STA 113',     title: 'Probability I' },
    { id: 'phy-101',     code: 'PHY 101',     title: 'General Physics I' },
    { id: 'phy-107',     code: 'PHY 107',     title: 'General Practical Physics' },
    { id: 'phy-111',     code: 'PHY 111',     title: 'General Physics for Life Sciences' },
    { id: 'chm-101',     code: 'CHM 101',     title: 'Principles of Chemistry' },
    { id: 'chm-107',     code: 'CHM 107',     title: 'Principles of Inorganic Chemistry' },
    { id: 'chm-171',     code: 'CHM 171',     title: 'Basic Practical Chemistry' },
    { id: 'bio-103',     code: 'BIO 103',     title: 'Introduction to Genetics' },
    { id: 'bio-107',     code: 'BIO 107',     title: 'General Practical Biology I' },
    { id: 'bio-151',     code: 'BIO 151',     title: 'General Biology' },
    { id: 'cos-101',     code: 'COS 101',     title: 'Introduction to Computer Science' },
    { id: 'cos-141',     code: 'COS 141',     title: 'COS 141' },
    { id: 'gsp-111',     code: 'GSP 111',     title: 'Communication in English I' },
    { id: 'gsp-201',     code: 'GSP 201',     title: 'Peace and Conflict Studies I' },
    { id: 'gst-111',     code: 'GST 111',     title: 'Communication in English' },
];

let allUsers = [];

// ============================
// HELPERS
// ============================
function showSection(name, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + name).style.display = 'block';
    document.getElementById('sectionTitle').textContent =
        name.charAt(0).toUpperCase() + name.slice(1);
    document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    if (name === 'users') loadUsers();
    if (name === 'questions') loadAdminQuestions();
    if (name === 'sessions') loadAdminSessions();
    if (name === 'courses') loadAdminCourses();
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

function logout() {
    supabaseClient.auth.signOut().then(() => window.location.href = 'login.html');
}

function populateCourseDropdowns() {
    ['adminFilterCourse', 'adminSessFilterCourse'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        COURSES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.code} — ${c.title}`;
            el.appendChild(opt);
        });
    });
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert('Access denied.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminName').textContent = profile.full_name;
    document.getElementById('adminAvatar').textContent = profile.full_name
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    populateCourseDropdowns();
    loadStats();
});

// ============================
// STATS
// ============================
async function loadStats() {
    const [
        { count: userCount },
        { count: questionCount },
        { count: sessionCount },
        { data: sessions },
        { data: profiles }
    ] = await Promise.all([
        supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabaseClient.from('questions').select('*', { count: 'exact', head: true }),
        supabaseClient.from('assessment_sessions').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabaseClient.from('assessment_sessions').select('score, total_questions').eq('completed', true),
        supabaseClient.from('profiles').select('full_name, university, department, role, created_at')
            .order('created_at', { ascending: false }).limit(10)
    ]);

    const el = id => document.getElementById(id);
    if (el('statUsers')) el('statUsers').textContent = userCount || 0;
    if (el('statQuestions')) el('statQuestions').textContent = questionCount || 0;
    if (el('statSessions')) el('statSessions').textContent = sessionCount || 0;

    if (sessions && sessions.length > 0) {
        const passed = sessions.filter(s => (s.score / s.total_questions) >= 0.5).length;
        const passRate = Math.round((passed / sessions.length) * 100);
        if (el('statPassRate')) el('statPassRate').textContent = passRate + '%';
    }

    // Recent signups
    const tbody = document.getElementById('recentSignups');
    if (profiles && tbody) {
        tbody.innerHTML = profiles.map(p => `
            <tr>
                <td>${p.full_name}</td>
                <td style="font-size:12px;color:#666">${p.university || '—'}</td>
                <td style="font-size:12px;color:#666">${p.department || '—'}</td>
                <td><span class="role-${p.role}">${p.role}</span></td>
                <td style="font-size:12px;color:#666">${new Date(p.created_at).toLocaleDateString('en-GB')}</td>
            </tr>
        `).join('');
    }
}

// ============================
// USERS (read-only)
// ============================
async function loadUsers() {
    const { data: users } = await supabaseClient
        .from('profiles').select('*').order('created_at', { ascending: false });
    allUsers = users || [];
    renderUsers(allUsers);
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTable');
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No users found.</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.full_name}</td>
            <td style="font-size:12px;color:#666">${u.university || '—'}</td>
            <td style="font-size:12px;color:#666">${u.department || '—'}</td>
            <td style="font-size:12px;color:#666">${u.level || '—'}</td>
            <td><span class="role-${u.role}">${u.role}</span></td>
        </tr>
    `).join('');
}

function filterUsers() {
    const search = document.getElementById('userSearch')?.value.toLowerCase().trim() || '';
    const role = document.getElementById('userRoleFilter')?.value || '';
    const filtered = allUsers.filter(u => {
        const matchSearch = u.full_name?.toLowerCase().includes(search) ||
                            u.university?.toLowerCase().includes(search);
        const matchRole = !role || u.role === role;
        return matchSearch && matchRole;
    });
    renderUsers(filtered);
}

// ============================
// QUESTIONS (read-only)
// ============================
async function loadAdminQuestions() {
    const courseFilter = document.getElementById('adminFilterCourse')?.value;
    const modeFilter = document.getElementById('adminFilterMode')?.value;

    let query = supabaseClient.from('questions').select('*')
        .order('created_at', { ascending: false }).limit(100);
    if (courseFilter) query = query.eq('course_id', courseFilter);
    if (modeFilter) query = query.eq('mode', modeFilter);

    const { data: questions } = await query;
    const tbody = document.getElementById('adminQuestionsTable');
    if (!tbody) return;

    if (!questions || questions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No questions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = questions.map(q => `
        <tr>
            <td class="q-text">${q.question_text}</td>
            <td style="font-size:12px">${q.course_code}</td>
            <td><span class="mode-badge mode-${q.mode}">${q.mode}</span></td>
            <td style="font-size:12px;color:#666">${q.year || '—'}</td>
        </tr>
    `).join('');
}

// ============================
// SESSIONS (read-only)
// ============================
async function loadAdminSessions() {
    const courseFilter = document.getElementById('adminSessFilterCourse')?.value;

    let query = supabaseClient
        .from('assessment_sessions')
        .select('*, profiles(full_name)')
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(100);

    if (courseFilter) query = query.eq('course_id', courseFilter);

    const { data: sessions } = await query;
    const tbody = document.getElementById('adminSessionsTable');
    if (!tbody) return;

    if (!sessions || sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No sessions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = sessions.map(s => {
        const pct = Math.round(s.score / s.total_questions * 100);
        const color = pct >= 70 ? '#2e7d32' : pct >= 50 ? '#006DF2' : '#a32d2d';
        return `
            <tr>
                <td>${s.profiles?.full_name || '—'}</td>
                <td style="font-size:12px">${s.course_id.toUpperCase().replace(/-/g, ' ')}</td>
                <td><span class="badge badge-${s.mode}">${s.mode}</span></td>
                <td style="font-weight:600;color:${color}">${pct}% (${s.score}/${s.total_questions})</td>
                <td style="font-size:12px;color:#666">${new Date(s.completed_at).toLocaleDateString('en-GB')}</td>
            </tr>
        `;
    }).join('');
}

// ============================
// COURSES
// ============================
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

async function loadAdminCourses() {
    const { data: courses } = await supabaseClient
        .from('courses')
        .select('*')
        .order('code');

    const grid = document.getElementById('adminCoursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No courses yet.</p>';
        return;
    }

    grid.innerHTML = courses.map(c => `
        <div class="admin-grid-card">
            <h4>${c.code}</h4>
            <p>${c.title}</p>
            <p style="font-size:11px;color:#888">${c.department || '—'}</p>
            <div class="card-actions">
                <button class="action-btn action-delete" onclick="deleteCourse('${c.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function submitCourse() {
    const id = document.getElementById('cId')?.value.trim().toLowerCase().replace(/\s+/g, '-');
    const code = document.getElementById('cCode')?.value.trim();
    const title = document.getElementById('cTitle')?.value.trim();
    const dept = document.getElementById('cDept')?.value.trim();
    const desc = document.getElementById('cDesc')?.value.trim();

    if (!id || !code || !title) {
        alert('Course ID, code and title are required.');
        return;
    }

    const { error } = await supabaseClient.from('courses').insert({
        id, code, title,
        department: dept || 'all',
        description: desc || null
    });

    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Course added!');
    hideModal('addCourseModal');
    ['cId', 'cCode', 'cTitle', 'cDept', 'cDesc'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.value = '';
    });
    loadAdminCourses();
}

async function deleteCourse(id) {
    if (!confirm('Delete this course? This will not delete its questions or topics.')) return;
    const { error } = await supabaseClient.from('courses').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadAdminCourses();
}