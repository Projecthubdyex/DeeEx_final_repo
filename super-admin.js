// ============================
// COURSE LIST
// ============================
const SA_COURSES = [
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

let allUsers = [];
let allQuestions = [];

// ============================
// SIDEBAR + MODALS
// ============================
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

function showSection(name, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + name).style.display = 'block';
    document.getElementById('sectionTitle').textContent =
        name.charAt(0).toUpperCase() + name.slice(1);
    document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    if (name === 'users') loadUsers();
    if (name === 'lecturers') loadLecturers();
    if (name === 'questions') saLoadQuestions();
    if (name === 'topics') loadTopics();
    if (name === 'universities') loadUniversities();
    if (name === 'analytics') loadAnalytics();
    if (name === 'sessions') loadAllSessions();
    if (name === 'announcements') loadAnnouncements();
}

function logout() {
    supabaseClient.auth.signOut().then(() => window.location.href = 'login.html');
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

    if (!profile || profile.role !== 'super_admin') {
        alert('Access denied.');
        window.location.href = 'login.html';
        return;
    }

    const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('saName').textContent = profile.full_name;
    document.getElementById('saAvatar').textContent = initials;

    populateCourseDropdowns();
    loadOverview();
});

// ============================
// POPULATE COURSE DROPDOWNS
// ============================
function populateCourseDropdowns() {
    const targets = ['saFilterCourse', 'topicCourseFilter', 'topicCourseId',
        'saQCourseId', 'lecturerCourseSelect', 'changeRoleCourse', 'sessionCourseFilter'];

    targets.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        SA_COURSES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.label;
            el.appendChild(opt);
        });
    });
}

// ============================
// OVERVIEW
// ============================
async function loadOverview() {
    const [
        { count: userCount },
        { count: questionCount },
        { count: sessionCount },
        { count: topicCount },
        { data: profiles },
        { data: sessions }
    ] = await Promise.all([
        supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabaseClient.from('questions').select('*', { count: 'exact', head: true }),
        supabaseClient.from('assessment_sessions').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabaseClient.from('topics').select('*', { count: 'exact', head: true }),
        supabaseClient.from('profiles').select('role'),
        supabaseClient.from('assessment_sessions').select('score, total_questions').eq('completed', true)
    ]);

    const admins = profiles?.filter(p => p.role === 'admin').length || 0;
    const lecturers = profiles?.filter(p => p.role === 'lecturer').length || 0;

    let passRate = '—';
    if (sessions && sessions.length > 0) {
        const passed = sessions.filter(s => (s.score / s.total_questions * 100) >= 50).length;
        passRate = Math.round((passed / sessions.length) * 100) + '%';
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('saStatUsers', userCount || 0);
    set('saStatQuestions', questionCount || 0);
    set('saStatSessions', sessionCount || 0);
    set('saStatTopics', topicCount || 0);
    set('saStatAdmins', admins);
    set('saStatLecturers', lecturers);
    set('saStatUnis', 4);
    set('saStatPassRate', passRate);

    // Recent signups
    const { data: recent } = await supabaseClient
        .from('profiles')
        .select('full_name, university, department, role, created_at')
        .order('created_at', { ascending: false })
        .limit(8);

    const tbody = document.getElementById('recentSignups');
    if (recent && recent.length > 0) {
        tbody.innerHTML = recent.map(u => `
            <tr>
                <td>${u.full_name}</td>
                <td style="font-size:12px;color:#666">${u.university}</td>
                <td style="font-size:12px;color:#666">${u.department}</td>
                <td><span class="role-${u.role}">${u.role}</span></td>
                <td style="font-size:12px;color:#666">${new Date(u.created_at).toLocaleDateString('en-GB')}</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No users yet.</td></tr>';
    }
}

// ============================
// ANALYTICS
// ============================
async function loadAnalytics() {
    const { data: progress } = await supabaseClient
        .from('progress')
        .select('course_id, average_score, sessions_taken, user_id');

    const courseMap = {};
    progress?.forEach(p => {
        if (!courseMap[p.course_id]) courseMap[p.course_id] = { total: 0, count: 0, sessions: 0 };
        courseMap[p.course_id].total += p.average_score;
        courseMap[p.course_id].count++;
        courseMap[p.course_id].sessions += p.sessions_taken;
    });

    const sorted = Object.entries(courseMap)
        .map(([id, v]) => ({ id, avg: Math.round(v.total / v.count), sessions: v.sessions }))
        .sort((a, b) => b.sessions - a.sessions);

    const el = document.getElementById('courseAnalytics');
    if (sorted.length === 0) {
        el.innerHTML = '<p class="empty-msg">No data yet.</p>';
        return;
    }

    el.innerHTML = sorted.map(c => {
        const color = c.avg >= 70 ? '#2e7d32' : c.avg >= 50 ? '#006DF2' : '#e65100';
        return `
            <div class="pg-course-row">
                <div class="pg-course-info">
                    <div class="pg-course-name">${c.id.toUpperCase().replace(/-/g, ' ')}</div>
                    <div class="pg-course-meta">${c.sessions} total sessions</div>
                </div>
                <div class="pg-course-bar-wrap">
                    <div class="progress-bar" style="width:100%;height:8px">
                        <div class="progress-fill" style="width:${c.avg}%;background:${color}"></div>
                    </div>
                    <div class="pg-pct">${c.avg}%</div>
                </div>
            </div>
        `;
    }).join('');

    // Most active users
    const userSessions = {};
    progress?.forEach(p => {
        if (!userSessions[p.user_id]) userSessions[p.user_id] = { sessions: 0, total: 0, count: 0 };
        userSessions[p.user_id].sessions += p.sessions_taken;
        userSessions[p.user_id].total += p.average_score;
        userSessions[p.user_id].count++;
    });

    const userIds = Object.keys(userSessions);
    if (userIds.length > 0) {
        const { data: profiles } = await supabaseClient
            .from('profiles').select('id, full_name, department').in('id', userIds);

        const activeUsers = profiles?.map(p => ({
            ...p,
            sessions: userSessions[p.id].sessions,
            avg: Math.round(userSessions[p.id].total / userSessions[p.id].count)
        })).sort((a, b) => b.sessions - a.sessions).slice(0, 10);

        document.getElementById('activeUsersTable').innerHTML = activeUsers?.map(u => `
            <tr>
                <td>${u.full_name}</td>
                <td style="font-size:12px;color:#666">${u.department}</td>
                <td>${u.sessions}</td>
                <td style="font-weight:600;color:#006DF2">${u.avg}%</td>
            </tr>
        `).join('') || '';
    }
}

// ============================
// USERS
// ============================
async function loadUsers() {
    const { data } = await supabaseClient
        .from('profiles').select('*').order('created_at', { ascending: false });
    allUsers = data || [];
    renderUsers(allUsers);

    // Populate lecturer user select
    const select = document.getElementById('lecturerUserSelect');
    if (select) {
        select.innerHTML = '<option value="">Select a user</option>';
        allUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.full_name} (${u.role})`;
            select.appendChild(opt);
        });
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('saUsersTable');
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No users found.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.full_name}</td>
            <td style="font-size:12px;color:#666">${u.university}</td>
            <td style="font-size:12px;color:#666">${u.department}</td>
            <td><span class="role-${u.role}">${u.role}</span></td>
            <td>
                <button class="action-btn action-edit" onclick="openChangeRole('${u.id}', '${u.full_name}', '${u.role}')">Change role</button>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const role = document.getElementById('userRoleFilter')?.value || '';
    const filtered = allUsers.filter(u =>
        (!search || u.full_name.toLowerCase().includes(search) || u.university?.toLowerCase().includes(search)) &&
        (!role || u.role === role)
    );
    renderUsers(filtered);
}

function openChangeRole(id, name, currentRole) {
    document.getElementById('changeRoleUserId').value = id;
    document.getElementById('changeRoleUserName').textContent = name;
    document.getElementById('newRoleSelect').value = currentRole;
    document.getElementById('assignCourseGroup').style.display = currentRole === 'lecturer' ? 'block' : 'none';
    showModal('changeRoleModal');
}

document.getElementById('newRoleSelect')?.addEventListener('change', function () {
    document.getElementById('assignCourseGroup').style.display =
        this.value === 'lecturer' ? 'block' : 'none';
});

async function saveRoleChange() {
    const id = document.getElementById('changeRoleUserId').value;
    const role = document.getElementById('newRoleSelect').value;
    const course = document.getElementById('changeRoleCourse').value;

    const updates = { role };
    if (role === 'lecturer' && course) updates.assigned_course = course;

    const { error } = await supabaseClient.from('profiles').update(updates).eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Role updated!');
    hideModal('changeRoleModal');
    loadUsers();
}

// ============================
// LECTURERS
// ============================
async function loadLecturers() {
    const { data: lecturers } = await supabaseClient
        .from('profiles').select('*').eq('role', 'lecturer');

    const tbody = document.getElementById('lecturersTable');
    if (!lecturers || lecturers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No lecturers yet.</td></tr>';
        return;
    }

    // Get question counts per lecturer
    const { data: questions } = await supabaseClient.from('questions').select('id');
    const qCount = questions?.length || 0;

    tbody.innerHTML = lecturers.map(l => `
        <tr>
            <td>${l.full_name}</td>
            <td style="font-size:12px;color:#666">${l.id}</td>
            <td>${l.assigned_course || '—'}</td>
            <td>${qCount}</td>
            <td>
                <button class="action-btn action-delete" onclick="removeLecturer('${l.id}')">Remove</button>
            </td>
        </tr>
    `).join('');
}

async function assignLecturer() {
    const userId = document.getElementById('lecturerUserSelect').value;
    const courseId = document.getElementById('lecturerCourseSelect').value;
    if (!userId || !courseId) { alert('Please select both a user and a course.'); return; }

    const { error } = await supabaseClient
        .from('profiles').update({ role: 'lecturer', assigned_course: courseId }).eq('id', userId);

    if (error) { alert('Error: ' + error.message); return; }
    alert('✓ Lecturer assigned!');
    hideModal('assignLecturerModal');
    loadLecturers();
}

async function removeLecturer(id) {
    if (!confirm('Remove lecturer role from this user?')) return;
    const { error } = await supabaseClient
        .from('profiles').update({ role: 'student', assigned_course: '' }).eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadLecturers();
}

// ============================
// QUESTIONS
// ============================
async function saLoadQuestions() {
    const course = document.getElementById('saFilterCourse')?.value;
    const topic = document.getElementById('saFilterTopic')?.value;
    const mode = document.getElementById('saFilterMode')?.value;

    let query = supabaseClient.from('questions').select('*')
        .order('created_at', { ascending: false }).limit(100);
    if (course) query = query.eq('course_id', course);
    if (topic) query = query.eq('topic_id', topic);
    if (mode) query = query.eq('mode', mode);

    const { data } = await query;
    allQuestions = data || [];

    const tbody = document.getElementById('saQuestionsTable');
    if (!allQuestions.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No questions found.</td></tr>';
        return;
    }

    tbody.innerHTML = allQuestions.map(q => `
        <tr>
            <td><input type="checkbox" class="q-checkbox" value="${q.id}"></td>
            <td class="q-text">${q.question_text}</td>
            <td style="font-size:12px">${q.course_code}</td>
            <td style="font-size:12px;color:#666">${q.topic_id ? '✓' : '—'}</td>
            <td><span class="mode-badge mode-${q.mode}">${q.mode}</span></td>
            <td>
                <button class="action-btn action-edit" onclick="openEditQuestion('${q.id}')">Edit</button>
                <button class="action-btn action-delete" onclick="saDeleteQuestion('${q.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function toggleSelectAll() {
    const checked = document.getElementById('selectAll').checked;
    document.querySelectorAll('.q-checkbox').forEach(cb => cb.checked = checked);
}

async function bulkDeleteConfirm() {
    const selected = [...document.querySelectorAll('.q-checkbox:checked')].map(cb => cb.value);
    if (selected.length === 0) { alert('Select at least one question.'); return; }
    if (!confirm(`Delete ${selected.length} question(s)?`)) return;

    const { error } = await supabaseClient.from('questions').delete().in('id', selected);
    if (error) { alert('Error: ' + error.message); return; }
    alert(`✓ ${selected.length} questions deleted.`);
    saLoadQuestions();
}

function openEditQuestion(id) {
    const q = allQuestions.find(q => q.id === id);
    if (!q) return;
    document.getElementById('editQId').value = q.id;
    document.getElementById('editQText').value = q.question_text;
    document.getElementById('editQA').value = q.option_a;
    document.getElementById('editQB').value = q.option_b;
    document.getElementById('editQC').value = q.option_c;
    document.getElementById('editQD').value = q.option_d;
    document.getElementById('editQAnswer').value = q.correct_answer;
    document.getElementById('editQExplanation').value = q.explanation || '';
    document.getElementById('editQYear').value = q.year || '';
    document.getElementById('editQMode').value = q.mode;
    showModal('editQuestionModal');
}

async function saveEditQuestion() {
    const id = document.getElementById('editQId').value;
    const { error } = await supabaseClient.from('questions').update({
        question_text: document.getElementById('editQText').value.trim(),
        option_a: document.getElementById('editQA').value.trim(),
        option_b: document.getElementById('editQB').value.trim(),
        option_c: document.getElementById('editQC').value.trim(),
        option_d: document.getElementById('editQD').value.trim(),
        correct_answer: document.getElementById('editQAnswer').value,
        explanation: document.getElementById('editQExplanation').value.trim() || null,
        year: document.getElementById('editQYear').value.trim() || null,
        mode: document.getElementById('editQMode').value,
    }).eq('id', id);

    if (error) { alert('Error: ' + error.message); return; }
    alert('✓ Question updated!');
    hideModal('editQuestionModal');
    saLoadQuestions();
}

async function saDeleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabaseClient.from('questions').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    saLoadQuestions();
}

async function saSubmitQuestion() {
    const courseSelect = document.getElementById('saQCourseId');
    const courseId = courseSelect.value;
    const parts = courseSelect.options[courseSelect.selectedIndex].text.split(' — ');
    const courseCode = parts[0].trim();
    const courseTitle = parts[1] ? parts[1].trim() : '';
    const topicId = document.getElementById('saQTopicId').value || null;

    const get = id => document.getElementById(id)?.value.trim();
    const questionText = get('saQText');
    const optionA = get('saQA'), optionB = get('saQB'),
          optionC = get('saQC'), optionD = get('saQD');

    if (!courseId || !questionText || !optionA || !optionB || !optionC || !optionD) {
        alert('Please fill in all required fields.'); return;
    }

    const { error } = await supabaseClient.from('questions').insert({
        course_id: courseId, course_code: courseCode, course_title: courseTitle,
        topic_id: topicId,
        question_text: questionText,
        option_a: optionA, option_b: optionB, option_c: optionC, option_d: optionD,
        correct_answer: get('saQAnswer'),
        explanation: get('saQExplanation') || null,
        year: get('saQYear') || null,
        mode: get('saQMode') || 'both',
        time_limit: parseInt(document.getElementById('saQTimeLimit')?.value) || 30,
        department: 'all'
    });

    if (error) { alert('Error: ' + error.message); return; }
    alert('✓ Question added!');
    hideModal('saAddQuestionModal');
    ['saQText','saQA','saQB','saQC','saQD','saQExplanation','saQYear'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
}

async function saUploadCSV() {
    const file = document.getElementById('saCsvFile')?.files[0];
    if (!file) { alert('Please select a CSV file.'); return; }

    const text = await file.text();
    const rows = text.trim().split('\n').slice(1);

    const questions = rows.map(row => {
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
            course_id: cols[0], course_code: cols[1], course_title: cols[2],
            question_text: cols[3],
            option_a: cols[4], option_b: cols[5], option_c: cols[6], option_d: cols[7],
            correct_answer: cols[8],
            explanation: cols[9] || null, year: cols[10] || null,
            mode: cols[11] || 'both',
            time_limit: parseInt(cols[12]) || 30,
            department: 'all'
        };
    }).filter(q => q.question_text);

    const { error } = await supabaseClient.from('questions').insert(questions);
    if (error) { alert('Upload failed: ' + error.message); return; }
    alert(`✓ ${questions.length} questions uploaded!`);
    hideModal('saCsvModal');
    document.getElementById('saCsvFile').value = '';
}

// ============================
// TOPICS
// ============================
async function loadTopics() {
    const courseFilter = document.getElementById('topicCourseFilter')?.value;
    let query = supabaseClient.from('topics').select('*').order('created_at', { ascending: false });
    if (courseFilter) query = query.eq('course_id', courseFilter);

    const { data: topics } = await query;
    const grid = document.getElementById('topicsGrid');

    if (!topics || topics.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No topics yet. Add one above.</p>';
        return;
    }

    grid.innerHTML = topics.map(t => `
        <div class="admin-grid-card">
            <h4>${t.title}</h4>
            <p>${t.course_id.toUpperCase().replace(/-/g, ' ')}</p>
            ${t.description ? `<p style="font-size:11px;color:#888;margin-top:4px">${t.description}</p>` : ''}
            <div class="card-actions" style="margin-top:12px">
                <button class="action-btn action-delete" onclick="deleteTopic('${t.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function loadTopicsForQuestion() {
    const courseId = document.getElementById('saQCourseId').value;
    const select = document.getElementById('saQTopicId');
    select.innerHTML = '<option value="">No topic</option>';
    if (!courseId) return;

    const { data: topics } = await supabaseClient
        .from('topics').select('*').eq('course_id', courseId);

    topics?.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.title;
        select.appendChild(opt);
    });

    // Also update topic filter in questions section
    const filterSelect = document.getElementById('saFilterTopic');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All topics</option>';
        topics?.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title;
            filterSelect.appendChild(opt);
        });
    }
}

async function submitTopic() {
    const courseId = document.getElementById('topicCourseId').value;
    const title = document.getElementById('topicTitle').value.trim();
    const desc = document.getElementById('topicDesc').value.trim();

    if (!courseId || !title) { alert('Please select a course and enter a title.'); return; }

    const { error } = await supabaseClient.from('topics').insert({
        course_id: courseId, title, description: desc || null
    });

    if (error) { alert('Error: ' + error.message); return; }
    alert('✓ Topic added!');
    hideModal('addTopicModal');
    document.getElementById('topicTitle').value = '';
    document.getElementById('topicDesc').value = '';
    loadTopics();
}

async function deleteTopic(id) {
    if (!confirm('Delete this topic? Questions under it will not be deleted but will lose their topic.')) return;
    const { error } = await supabaseClient.from('topics').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadTopics();
}

// ============================
// UNIVERSITIES
// ============================
const uniList = [
    { name: 'University of Nigeria, Nsukka', students: '1,200', departments: '32', location: 'Nsukka, Enugu' },
    { name: 'University of Ibadan', students: '850', departments: '28', location: 'Ibadan, Oyo' },
    { name: 'University of Lagos', students: '620', departments: '40', location: 'Lagos' },
    { name: 'Federal University of Owerri', students: '540', departments: '30', location: 'Owerri, Imo' },
];

function loadUniversities() {
    const grid = document.getElementById('saUnisGrid');
    grid.innerHTML = uniList.map(u => `
        <div class="admin-grid-card">
            <h4>${u.name}</h4>
            <p>${u.location}</p>
            <p style="margin-top:4px;font-size:12px">${u.students} students · ${u.departments} departments</p>
        </div>
    `).join('');
}

async function saSubmitUniversity() {
    const name = document.getElementById('saUniName')?.value.trim();
    const location = document.getElementById('saUniLocation')?.value.trim();
    const students = document.getElementById('saUniStudents')?.value;
    if (!name) { alert('University name is required.'); return; }
    uniList.push({ name, location: location || '—', students: students || '0', departments: '0' });
    alert(`✓ University added: ${name}`);
    hideModal('addUniModal');
    loadUniversities();
}

// ============================
// ANNOUNCEMENTS
// ============================
async function sendAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const msg = document.getElementById('announcementMsg').value.trim();
    if (!title || !msg) { alert('Please fill in title and message.'); return; }

    const { data: { session } } = await supabaseClient.auth.getSession();
    const { error } = await supabaseClient.from('announcements').insert({
        title, message: msg,
        created_by: session.user.id
    });

    if (error) {
        // Table may not exist yet — show instructions
        alert('To enable announcements, run this SQL in Supabase:\n\nCREATE TABLE announcements (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  title TEXT NOT NULL,\n  message TEXT NOT NULL,\n  created_by UUID REFERENCES auth.users(id),\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\nALTER TABLE announcements ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Anyone logged in can read announcements" ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);\nCREATE POLICY "Super admin can insert announcements" ON announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = \'super_admin\'));');
        return;
    }

    alert('✓ Announcement sent!');
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementMsg').value = '';
    loadAnnouncements();
}

async function loadAnnouncements() {
    const { data } = await supabaseClient
        .from('announcements').select('*').order('created_at', { ascending: false });

    const el = document.getElementById('announcementsList');
    if (!data || data.length === 0) {
        el.innerHTML = '<p class="empty-msg">No announcements yet.</p>';
        return;
    }

    el.innerHTML = data.map(a => `
        <div style="padding:14px 0;border-bottom:0.5px solid #d8eafc">
            <div style="font-size:14px;font-weight:500;color:#1a1a1a">${a.title}</div>
            <div style="font-size:13px;color:#444;margin-top:4px">${a.message}</div>
            <div style="font-size:11px;color:#888;margin-top:6px">${new Date(a.created_at).toLocaleDateString('en-GB')}</div>
        </div>
    `).join('');
}

// ============================
// ALL SESSIONS
// ============================
async function loadAllSessions() {
    const course = document.getElementById('sessionCourseFilter')?.value;
    const mode = document.getElementById('sessionModeFilter')?.value;

    let query = supabaseClient.from('assessment_sessions')
        .select('*, profiles(full_name)')
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(50);

    if (course) query = query.eq('course_id', course);
    if (mode) query = query.eq('mode', mode);

    const { data } = await query;
    const tbody = document.getElementById('allSessionsTable');

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No sessions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(s => {
        const pct = Math.round(s.score / s.total_questions * 100);
        const color = pct >= 70 ? '#2e7d32' : pct >= 50 ? '#006DF2' : '#a32d2d';
        const date = new Date(s.completed_at).toLocaleDateString('en-GB');
        return `
            <tr>
                <td>${s.profiles?.full_name || '—'}</td>
                <td style="font-size:12px">${s.course_id.toUpperCase().replace(/-/g, ' ')}</td>
                <td><span class="badge badge-${s.mode}">${s.mode}</span></td>
                <td style="font-weight:600;color:${color}">${pct}% (${s.score}/${s.total_questions})</td>
                <td style="font-size:12px;color:#666">${date}</td>
            </tr>
        `;
    }).join('');
}

// ============================
// EXPORT
// ============================
async function exportUsers() {
    const { data } = await supabaseClient.from('profiles').select('*');
    if (!data) { alert('No data to export.'); return; }

    const headers = 'full_name,email,university,faculty,department,level,role,created_at';
    const rows = data.map(u =>
        `"${u.full_name}","${u.university}","${u.faculty}","${u.department}","${u.level}","${u.role}","${u.created_at}"`
    );

    downloadCSV('deeex-users.csv', [headers, ...rows].join('\n'));
}

async function exportQuestions() {
    const { data } = await supabaseClient.from('questions').select('*');
    if (!data) { alert('No data to export.'); return; }

    const headers = 'course_id,course_code,course_title,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,year,mode,time_limit';
    const rows = data.map(q =>
        `"${q.course_id}","${q.course_code}","${q.course_title}","${q.question_text}","${q.option_a}","${q.option_b}","${q.option_c}","${q.option_d}","${q.correct_answer}","${q.explanation || ''}","${q.year || ''}","${q.mode}","${q.time_limit || 30}"`
    );

    downloadCSV('deeex-questions.csv', [headers, ...rows].join('\n'));
}

function downloadCSV(filename, content) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}