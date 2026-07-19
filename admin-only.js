// ============================
// ADMIN AUTH GUARD
// ============================
async function requireAdmin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return null; }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert('Access denied.');
        window.location.href = 'dashboard.html';
        return null;
    }

    const nameEl = document.getElementById('adminName');
    const avatarEl = document.getElementById('adminAvatar');
    if (nameEl) nameEl.textContent = profile.full_name;
    if (avatarEl) avatarEl.textContent = profile.full_name
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return session;
}

// ============================
// SIDEBAR
// ============================
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// ============================
// SECTION SWITCHING
// ============================
function showSection(name, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + name).style.display = 'block';
    document.getElementById('sectionTitle').textContent =
        name.charAt(0).toUpperCase() + name.slice(1);
    document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    if (name === 'questions') loadQuestions();
    if (name === 'users') loadUsers();
    if (name === 'universities') loadAdminUniversities();
    if (name === 'courses') loadAdminCourses();
}

// ============================
// MODALS
// ============================
function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function hideModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ============================
// STATS
// ============================
async function loadStats() {
    const [
        { count: userCount },
        { count: questionCount },
        { count: sessionCount }
    ] = await Promise.all([
        supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabaseClient.from('questions').select('*', { count: 'exact', head: true }),
        supabaseClient.from('assessment_sessions').select('*', { count: 'exact', head: true }).eq('completed', true)
    ]);

    const el = id => document.getElementById(id);
    if (el('statUsers')) el('statUsers').textContent = userCount || 0;
    if (el('statQuestions')) el('statQuestions').textContent = questionCount || 0;
    if (el('statSessions')) el('statSessions').textContent = sessionCount || 0;
    if (el('statUnis')) el('statUnis').textContent = 4; // update when unis table is live
}

// ============================
// COURSE LIST (shared)
// ============================
const COURSES = [
    { id: 'mth-101-111', label: 'MTH 101/111 — Elementary Mathematics I' },
    { id: 'mth-103-121', label: 'MTH 103/121 — Elementary Mathematics II' },
    { id: 'mth-113',     label: 'MTH 113 — Intermediate Mathematics' },
    { id: 'sta-111',     label: 'STA 111 — Descriptive Statistics' },
    { id: 'sta-113',     label: 'STA 113 — Probability I' },
    { id: 'phy-101',     label: 'PHY 101 — General Physics I' },
    { id: 'phy-107',     label: 'PHY 107 — General Practical Physics' },
    { id: 'phy-111',     label: 'PHY 111 — General Physics for Life Sciences' },
    { id: 'chm-101',     label: 'CHM 101 — Principles of Chemistry' },
    { id: 'chm-107',     label: 'CHM 107 — Principles of Inorganic Chemistry' },
    { id: 'chm-171',     label: 'CHM 171 — Basic Practical Chemistry' },
    { id: 'bio-103',     label: 'BIO 103 — Introduction to Genetics' },
    { id: 'bio-107',     label: 'BIO 107 — General Practical Biology I' },
    { id: 'bio-151',     label: 'BIO 151 — General Biology' },
    { id: 'cos-101',     label: 'COS 101 — Introduction to Computer Science' },
    { id: 'cos-141',     label: 'COS 141' },
    { id: 'gsp-111',     label: 'GSP 111 — Communication in English I' },
    { id: 'gsp-201',     label: 'GSP 201 — Peace and Conflict Studies I' },
    { id: 'gst-111',     label: 'GST 111 — Communication in English' },
];

function populateCourseDropdowns() {
    ['qCourseId', 'filterCourse'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        COURSES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.label;
            el.appendChild(opt);
        });
    });
}

// ============================
// QUESTIONS TABLE
// ============================
async function loadQuestions() {
    const courseFilter = document.getElementById('filterCourse')?.value;
    const modeFilter = document.getElementById('filterMode')?.value;

    let query = supabaseClient.from('questions').select('*')
        .order('created_at', { ascending: false }).limit(50);
    if (courseFilter) query = query.eq('course_id', courseFilter);
    if (modeFilter) query = query.eq('mode', modeFilter);

    const { data: questions } = await query;
    const tbody = document.getElementById('questionsTable');
    if (!tbody) return;

    if (!questions || questions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No questions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = questions.map(q => `
        <tr>
            <td class="q-text">${q.question_text}</td>
            <td>${q.course_code}</td>
            <td><span class="mode-badge mode-${q.mode}">${q.mode}</span></td>
            <td>${q.year || '—'}</td>
            <td>
                <button class="action-btn action-delete" onclick="deleteQuestion('${q.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ============================
// SUBMIT QUESTION
// ============================
async function submitQuestion() {
    const courseSelect = document.getElementById('qCourseId');
    const courseId = courseSelect.value;
    const parts = courseSelect.options[courseSelect.selectedIndex].text.split(' — ');
    const courseCode = parts[0].trim();
    const courseTitle = parts[1] ? parts[1].trim() : '';

    const get = id => document.getElementById(id)?.value.trim();
    const questionText = get('qText');
    const optionA = get('qA');
    const optionB = get('qB');
    const optionC = get('qC');
    const optionD = get('qD');
    const correctAnswer = get('qAnswer');
    const explanation = get('qExplanation');
    const year = get('qYear');
    const mode = get('qMode');

    if (!courseId || !questionText || !optionA || !optionB || !optionC || !optionD) {
        alert('Please fill in all required fields.');
        return;
    }
    

    const { error } = await supabaseClient.from('questions').insert({
        course_id: courseId, course_code: courseCode, course_title: courseTitle,
        question_text: questionText,
        option_a: optionA, option_b: optionB, option_c: optionC, option_d: optionD,
        correct_answer: correctAnswer,
        explanation: explanation || null,
        year: year || null,
        mode: mode || 'both',
        time_limit: parseInt(document.getElementById('qTimeLimit')?.value) || 30,
        department: 'all',
        
    });

    

    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Question added!');
    hideModal('addQuestionModal');

    // Clear form
    ['qText','qA','qB','qC','qD','qExplanation','qYear'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    loadQuestions();
    loadStats();
}

// ============================
// DELETE QUESTION
// ============================
async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabaseClient.from('questions').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadQuestions();
    loadStats();
}

// ============================
// CSV UPLOAD
// ============================
async function uploadCSV() {
    const file = document.getElementById('csvFile')?.files[0];
    if (!file) { alert('Please select a CSV file.'); return; }

    const text = await file.text();
    const lines = text.trim().split('\n');
    const rows = lines.slice(1);

    const questions = rows.map(row => {
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
            course_id: cols[0], course_code: cols[1], course_title: cols[2],
            question_text: cols[3],
            option_a: cols[4], option_b: cols[5], option_c: cols[6], option_d: cols[7],
            correct_answer: cols[8],
            explanation: cols[9] || null,
            year: cols[10] || null,
            mode: cols[11] || 'both',
            department: cols[12] || 'all'
        };
    }).filter(q => q.question_text);

    if (questions.length === 0) { alert('No valid questions found in CSV.'); return; }

    const { error } = await supabaseClient.from('questions').insert(questions);
    if (error) { alert('Upload failed: ' + error.message); return; }

    alert(`✓ ${questions.length} questions uploaded!`);
    hideModal('csvModal');
    document.getElementById('csvFile').value = '';
    loadQuestions();
    loadStats();
}

// ============================
// USERS TABLE
// ============================
async function loadUsers() {
    const { data: users } = await supabaseClient
        .from('profiles').select('*').order('created_at', { ascending: false });

    const tbody = document.getElementById('usersTable');
    if (!tbody || !users) return;

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.full_name}</td>
            <td>${u.university}</td>
            <td>${u.department}</td>
            <td>${u.level}</td>
            <td><span class="role-${u.role}">${u.role}</span></td>
        </tr>
    `).join('');
}

// ============================
// COURSES (from questions table)
// ============================
async function loadAdminCourses() {
    const { data } = await supabaseClient
        .from('questions').select('course_id, course_code, course_title');

    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (!data || data.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No courses with questions yet.</p>';
        return;
    }

    const seen = new Set();
    const courses = data.filter(q => {
        if (seen.has(q.course_id)) return false;
        seen.add(q.course_id); return true;
    });

    grid.innerHTML = courses.map(c => `
        <div class="admin-grid-card">
            <h4>${c.course_code}</h4>
            <p>${c.course_title}</p>
        </div>
    `).join('');
}

// ============================
// SUBMIT COURSE
// ============================
async function submitCourse() {
    const code = document.getElementById('cCode')?.value.trim();
    const title = document.getElementById('cTitle')?.value.trim();
    if (!code || !title) { alert('Course code and title are required.'); return; }
    alert(`Course noted: ${code} — ${title}. Add questions for this course to make it appear.`);
    hideModal('addCourseModal');
}

// ============================
// UNIVERSITIES
// ============================
const UNIS = [
    { name: 'University of Nigeria, Nsukka', students: '1,200', departments: '32' },
    { name: 'University of Ibadan', students: '850', departments: '28' },
    { name: 'University of Lagos', students: '620', departments: '40' },
    { name: 'Federal University of Owerri', students: '540', departments: '30' },
];

function loadAdminUniversities() {
    const grid = document.getElementById('universitiesGrid');
    if (!grid) return;
    grid.innerHTML = UNIS.map(u => `
        <div class="admin-grid-card">
            <h4>${u.name}</h4>
            <p>${u.students} students · ${u.departments} departments</p>
        </div>
    `).join('');
}

async function submitUniversity() {
    const name = document.getElementById('uName')?.value.trim();
    if (!name) { alert('University name is required.'); return; }
    alert(`University saved: ${name}`);
    hideModal('addUniModal');
}

// ============================
// LOGOUT
// ============================
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    const session = await requireAdmin();
    if (!session) return;

    populateCourseDropdowns();
    loadStats();
});