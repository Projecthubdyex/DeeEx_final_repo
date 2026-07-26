// ============================
// STATE
// ============================
let lecturerProfile = null;
let selectedCourseId = null;

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

// ============================
// HELPERS
// ============================
function showSection(name, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + name).style.display = 'block';
    document.getElementById('sectionTitle').textContent =
        name === 'overview' ? 'Overview' :
        name === 'questions' ? 'Questions' :
        name === 'topics' ? 'Topics' :
        name === 'notes' ? 'Notes' :
        name === 'videos' ? 'Videos' : 'Students';
    document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    if (name === 'questions') loadMyQuestions();
    if (name === 'topics') loadMyTopics();
    if (name === 'notes') loadMyNotes();
    if (name === 'videos') loadMyVideos();
    if (name === 'students') loadMyStudents();
}

function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

function logout() {
    supabaseClient.auth.signOut().then(() => window.location.href = 'login.html');
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('deeex-dark') === 'true') {
        document.body.classList.add('dark-mode');
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'lecturer') {
        alert('Access denied.');
        window.location.href = 'login.html';
        return;
    }

    lecturerProfile = profile;

    const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('lecturerAvatar').textContent = initials;
    document.getElementById('lecturerName').textContent = profile.full_name;
    document.getElementById('lecturerCourse').textContent = 'All courses';
    document.getElementById('lecturerCourseMeta').textContent = 'Lecturer Panel';

    populateCourseDropdowns();
    loadOverview();
});

// ============================
// POPULATE COURSE DROPDOWNS
// ============================
function populateCourseDropdowns() {
    const selects = ['qCourseId', 'nCourseId', 'vCourseId', 'tCourseId',
                     'lFilterCourse', 'lNoteFilterCourse', 'lVideoFilterCourse',
                     'lStudentFilterCourse'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const isFilter = id.includes('Filter');
        el.innerHTML = isFilter
            ? '<option value="">All courses</option>'
            : '<option value="">Select course</option>';
        COURSES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.code} — ${c.title}`;
            el.appendChild(opt);
        });
    });
}

// ============================
// LOAD TOPIC DROPDOWN based on selected course
// ============================
async function loadTopicsForCourse(courseId, targetSelectIds) {
    if (!courseId) {
        targetSelectIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<option value="">Select course first</option>';
        });
        return;
    }

    const { data: topics } = await supabaseClient
        .from('topics')
        .select('id, title')
        .eq('course_id', courseId);

    targetSelectIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const isFilter = id.includes('Filter');
        el.innerHTML = isFilter ? '<option value="">All topics</option>' : '<option value="">No topic</option>';
        topics?.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title;
            el.appendChild(opt);
        });
    });
}

// ============================
// OVERVIEW
// ============================
async function loadOverview() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    const [
        { data: questions },
        { data: topics },
        { data: notes },
        { data: videos },
        { data: sessions }
    ] = await Promise.all([
        supabaseClient.from('questions').select('id').eq('added_by', session.user.id),
        supabaseClient.from('topics').select('id'),
        supabaseClient.from('notes').select('id').eq('added_by', session.user.id),
        supabaseClient.from('videos').select('id').eq('added_by', session.user.id),
        supabaseClient.from('assessment_sessions').select('score, total_questions').eq('completed', true)
    ]);

    document.getElementById('lStatQuestions').textContent = questions?.length || 0;
    document.getElementById('lStatTopics').textContent = topics?.length || 0;
    document.getElementById('lStatNotes').textContent = notes?.length || 0;
    document.getElementById('lStatVideos').textContent = videos?.length || 0;
    document.getElementById('lStatSessions').textContent = sessions?.length || 0;

    if (sessions && sessions.length > 0) {
        const avg = Math.round(
            sessions.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / sessions.length
        );
        document.getElementById('lStatAvg').textContent = avg + '%';
    } else {
        document.getElementById('lStatAvg').textContent = '—';
    }
}

// ============================
// QUESTIONS
// ============================
async function loadMyQuestions() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const courseFilter = document.getElementById('lFilterCourse')?.value;
    const modeFilter = document.getElementById('lFilterMode')?.value;

    let query = supabaseClient
        .from('questions')
        .select('*, topics(title)')
        .eq('added_by', session.user.id)
        .order('created_at', { ascending: false });

    if (courseFilter) query = query.eq('course_id', courseFilter);
    if (modeFilter) query = query.eq('mode', modeFilter);

    const { data: questions } = await query;
    const tbody = document.getElementById('myQuestionsTable');
    if (!tbody) return;

    if (!questions || questions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No questions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = questions.map(q => `
        <tr>
            <td class="q-text">${q.question_text}</td>
            <td style="font-size:12px">${q.course_code}</td>
            <td style="font-size:12px;color:#666">${q.topics?.title || '—'}</td>
            <td><span class="mode-badge mode-${q.mode}">${q.mode}</span></td>
            <td style="font-size:12px;color:#666">${q.year || '—'}</td>
            <td><button class="action-btn action-delete" onclick="deleteQuestion('${q.id}')">Delete</button></td>
        </tr>
    `).join('');
}

async function submitQuestion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const courseSelect = document.getElementById('qCourseId');
    const courseId = courseSelect.value;
    const parts = courseSelect.options[courseSelect.selectedIndex].text.split(' — ');
    const courseCode = parts[0].trim();
    const courseTitle = parts[1] ? parts[1].trim() : '';
    const topicId = document.getElementById('qTopicId')?.value || null;

    const get = id => document.getElementById(id)?.value.trim();
    const questionText = get('qText');
    const optionA = get('qA'), optionB = get('qB'), optionC = get('qC'), optionD = get('qD');

    if (!courseId || !questionText || !optionA || !optionB || !optionC || !optionD) {
        alert('Please fill in all required fields.'); return;
    }

    const { error } = await supabaseClient.from('questions').insert({
        course_id: courseId, course_code: courseCode, course_title: courseTitle,
        topic_id: topicId || null,
        question_text: questionText,
        option_a: optionA, option_b: optionB, option_c: optionC, option_d: optionD,
        correct_answer: get('qAnswer'),
        explanation: get('qExplanation') || null,
        year: get('qYear') || null,
        mode: get('qMode') || 'both',
        time_limit: parseInt(document.getElementById('qTimeLimit')?.value) || 30,
        department: 'all',
        added_by: session.user.id
    });

    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Question added!');
    hideModal('addQuestionModal');
    ['qText','qA','qB','qC','qD','qExplanation','qYear'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    loadMyQuestions();
    loadOverview();
}

async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabaseClient.from('questions').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadMyQuestions();
    loadOverview();
}

async function uploadCSV() {
    const { data: { session } } = await supabaseClient.auth.getSession();
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
            explanation: cols[9] || null, year: cols[10] || null,
            mode: cols[11] || 'both',
            time_limit: parseInt(cols[12]) || 30,
            department: 'all',
            added_by: session.user.id
        };
    }).filter(q => q.question_text);

    const { error } = await supabaseClient.from('questions').insert(questions);
    if (error) { alert('Upload failed: ' + error.message); return; }

    alert(`✓ ${questions.length} questions uploaded!`);
    hideModal('csvModal');
    loadMyQuestions();
    loadOverview();
}

// ============================
// TOPICS
// ============================
async function loadMyTopics() {
    const courseFilter = document.getElementById('lTopicFilterCourse')?.value;

    let query = supabaseClient.from('topics').select('*').order('created_at', { ascending: false });
    if (courseFilter) query = query.eq('course_id', courseFilter);

    const { data: topics } = await query;
    const grid = document.getElementById('myTopicsGrid');
    if (!grid) return;

    if (!topics || topics.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No topics yet.</p>';
        return;
    }

    grid.innerHTML = topics.map(t => `
        <div class="admin-grid-card">
            <h4>${t.title}</h4>
            <p>${t.course_id.toUpperCase().replace(/-/g, ' ')}</p>
            ${t.description ? `<p style="color:#888;font-size:11px;margin-top:4px">${t.description}</p>` : ''}
            <div class="card-actions" style="margin-top:12px">
                <button class="action-btn action-delete" onclick="deleteTopic('${t.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function submitTopic() {
    const courseId = document.getElementById('tCourseId')?.value;
    const title = document.getElementById('tTitle')?.value.trim();
    const desc = document.getElementById('tDesc')?.value.trim();

    if (!courseId || !title) { alert('Course and topic title are required.'); return; }

    const { error } = await supabaseClient.from('topics').insert({
        course_id: courseId, title, description: desc || null
    });

    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Topic added!');
    hideModal('addTopicModal');
    document.getElementById('tTitle').value = '';
    document.getElementById('tDesc').value = '';
    loadMyTopics();
    loadOverview();
}

async function deleteTopic(id) {
    if (!confirm('Delete this topic?')) return;
    const { error } = await supabaseClient.from('topics').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadMyTopics();
    loadOverview();
}

// ============================
// NOTES
// ============================
function toggleNoteType() {
    const type = document.getElementById('nType').value;
    document.getElementById('noteTextSection').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('noteFileSection').style.display = type === 'file' ? 'block' : 'none';
}

async function loadMyNotes() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const courseFilter = document.getElementById('lNoteFilterCourse')?.value;

    let query = supabaseClient.from('notes').select('*, topics(title)')
        .eq('added_by', session.user.id)
        .order('created_at', { ascending: false });

    if (courseFilter) query = query.eq('course_id', courseFilter);

    const { data: notes } = await query;
    const el = document.getElementById('myNotesList');

    if (!notes || notes.length === 0) {
        el.innerHTML = '<p class="empty-msg">No notes yet.</p>';
        return;
    }

    el.innerHTML = notes.map(n => `
        <div class="content-card">
            <div class="content-card-header">
                <div>
                    <div class="content-card-title">📝 ${n.title}</div>
                    <div class="content-card-meta">${n.course_id.toUpperCase().replace(/-/g,' ')} · ${n.topics?.title || 'No topic'}</div>
                </div>
                <button class="action-btn action-delete" onclick="deleteNote('${n.id}')">Delete</button>
            </div>
            ${n.content ? `<div class="content-card-body">${n.content.substring(0, 150)}${n.content.length > 150 ? '...' : ''}</div>` : ''}
            ${n.file_url ? `<a href="${n.file_url}" target="_blank" class="content-download-btn">⬇ Download ${n.file_type || 'file'}</a>` : ''}
        </div>
    `).join('');
}

async function submitNote() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const courseSelect = document.getElementById('nCourseId');
    const courseId = courseSelect?.value;
    const title = document.getElementById('nTitle')?.value.trim();
    const topicId = document.getElementById('nTopicId')?.value || null;
    const type = document.getElementById('nType')?.value;

    if (!courseId || !title) { alert('Course and title are required.'); return; }

    let content = null, fileUrl = null, fileType = null;

    if (type === 'text') {
        content = document.getElementById('nContent')?.value.trim();
        if (!content) { alert('Please enter note content.'); return; }
    } else {
        const file = document.getElementById('nFile')?.files[0];
        if (!file) { alert('Please select a file.'); return; }
        const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabaseClient.storage.from('notes').upload(filePath, file);
        if (error) { alert('Upload failed: ' + error.message); return; }
        const { data: urlData } = supabaseClient.storage.from('notes').getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
        fileType = file.name.split('.').pop().toUpperCase();
    }

    const { error } = await supabaseClient.from('notes').insert({
        course_id: courseId, topic_id: topicId || null,
        title, content: content || null,
        file_url: fileUrl || null, file_type: fileType || null,
        added_by: session.user.id
    });

    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Note added!');
    hideModal('addNoteModal');
    document.getElementById('nTitle').value = '';
    if (document.getElementById('nContent')) document.getElementById('nContent').value = '';
    loadMyNotes();
    loadOverview();
}

async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    const { error } = await supabaseClient.from('notes').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadMyNotes();
    loadOverview();
}

// ============================
// VIDEOS
// ============================
function toggleVideoType() {
    const type = document.getElementById('vType').value;
    document.getElementById('videoLinkSection').style.display = type !== 'upload' ? 'block' : 'none';
    document.getElementById('videoFileSection').style.display = type === 'upload' ? 'block' : 'none';
}

async function loadMyVideos() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const courseFilter = document.getElementById('lVideoFilterCourse')?.value;

    let query = supabaseClient.from('videos').select('*, topics(title)')
        .eq('added_by', session.user.id)
        .order('created_at', { ascending: false });

    if (courseFilter) query = query.eq('course_id', courseFilter);

    const { data: videos } = await query;
    const el = document.getElementById('myVideosList');

    if (!videos || videos.length === 0) {
        el.innerHTML = '<p class="empty-msg">No videos yet.</p>';
        return;
    }

    el.innerHTML = videos.map(v => `
        <div class="content-card">
            <div class="content-card-header">
                <div>
                    <div class="content-card-title">🎬 ${v.title}</div>
                    <div class="content-card-meta">${v.course_id.toUpperCase().replace(/-/g,' ')} · ${v.topics?.title || 'No topic'} · ${v.video_type}</div>
                </div>
                <button class="action-btn action-delete" onclick="deleteVideo('${v.id}')">Delete</button>
            </div>
            ${v.video_url ? `<a href="${v.video_url}" target="_blank" class="content-download-btn">▶ View video</a>` : ''}
        </div>
    `).join('');
}

async function submitVideo() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const courseSelect = document.getElementById('vCourseId');
    const courseId = courseSelect?.value;
    const title = document.getElementById('vTitle')?.value.trim();
    const topicId = document.getElementById('vTopicId')?.value || null;
    const type = document.getElementById('vType')?.value;

    if (!courseId || !title) { alert('Course and title are required.'); return; }

    let videoUrl = null;

    if (type === 'upload') {
        const file = document.getElementById('vFile')?.files[0];
        if (!file) { alert('Please select a video file.'); return; }
        const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabaseClient.storage.from('videos').upload(filePath, file);
        if (error) { alert('Upload failed: ' + error.message); return; }
        const { data: urlData } = supabaseClient.storage.from('videos').getPublicUrl(filePath);
        videoUrl = urlData.publicUrl;
    } else {
        videoUrl = document.getElementById('vUrl')?.value.trim();
        if (!videoUrl) { alert('Please enter a video URL.'); return; }
    }

    const { error } = await supabaseClient.from('videos').insert({
        course_id: courseId, topic_id: topicId || null,
        title, video_url: videoUrl, video_type: type,
        added_by: session.user.id
    });

    if (error) { alert('Error: ' + error.message); return; }

    alert('✓ Video added!');
    hideModal('addVideoModal');
    document.getElementById('vTitle').value = '';
    if (document.getElementById('vUrl')) document.getElementById('vUrl').value = '';
    loadMyVideos();
    loadOverview();
}

async function deleteVideo(id) {
    if (!confirm('Delete this video?')) return;
    const { error } = await supabaseClient.from('videos').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadMyVideos();
    loadOverview();
}

// ============================
// STUDENTS
// ============================
async function loadMyStudents() {
    const courseFilter = document.getElementById('lStudentFilterCourse')?.value;

    let query = supabaseClient.from('progress')
        .select('user_id, average_score, sessions_taken, course_id')
        .order('average_score', { ascending: false });

    if (courseFilter) query = query.eq('course_id', courseFilter);

    const { data: progress } = await query;
    const tbody = document.getElementById('myStudentsTable');

    if (!progress || progress.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No students yet.</td></tr>';
        return;
    }

    const userIds = [...new Set(progress.map(p => p.user_id))];
    const { data: profiles } = await supabaseClient
        .from('profiles').select('id, full_name, university').in('id', userIds);

    const profileMap = {};
    profiles?.forEach(p => { profileMap[p.id] = p; });

    tbody.innerHTML = progress.map((p, i) => {
        const profile = profileMap[p.user_id];
        const avg = Math.round(p.average_score);
        const color = avg >= 70 ? '#2e7d32' : avg >= 50 ? '#006DF2' : '#a32d2d';
        return `
            <tr>
                <td>#${i + 1} ${profile?.full_name || '—'}</td>
                <td style="font-size:12px;color:#666">${profile?.university || '—'}</td>
                <td style="font-size:12px">${p.course_id.toUpperCase().replace(/-/g,' ')}</td>
                <td style="font-weight:600;color:${color}">${avg}%</td>
                <td style="color:#666">${p.sessions_taken}</td>
            </tr>
        `;
    }).join('');
}