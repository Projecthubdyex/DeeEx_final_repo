// ============================
// STATE
// ============================
let currentStudyCourse = null;
let currentTopicFilter = '';
let currentStudyTab = 'notes';
let allTopics = [];

const STUDY_COURSES = [
    { id: 'mth-101-111', code: 'MTH 101/111', title: 'Elementary Mathematics I',       subject: 'mth' },
    { id: 'mth-103-121', code: 'MTH 103/121', title: 'Elementary Mathematics II',      subject: 'mth' },
    { id: 'mth-113',     code: 'MTH 113',     title: 'Intermediate Mathematics',       subject: 'mth' },
    { id: 'sta-111',     code: 'STA 111',     title: 'Descriptive Statistics',         subject: 'sta' },
    { id: 'sta-113',     code: 'STA 113',     title: 'Probability I',                  subject: 'sta' },
    { id: 'phy-101',     code: 'PHY 101',     title: 'General Physics I',              subject: 'phy' },
    { id: 'phy-107',     code: 'PHY 107',     title: 'General Practical Physics',      subject: 'phy' },
    { id: 'phy-111',     code: 'PHY 111',     title: 'General Physics for Life Sciences', subject: 'phy' },
    { id: 'chm-101',     code: 'CHM 101',     title: 'Principles of Chemistry',        subject: 'chm' },
    { id: 'chm-107',     code: 'CHM 107',     title: 'Principles of Inorganic Chemistry', subject: 'chm' },
    { id: 'chm-171',     code: 'CHM 171',     title: 'Basic Practical Chemistry',      subject: 'chm' },
    { id: 'bio-103',     code: 'BIO 103',     title: 'Introduction to Genetics',       subject: 'bio' },
    { id: 'bio-107',     code: 'BIO 107',     title: 'General Practical Biology I',    subject: 'bio' },
    { id: 'bio-151',     code: 'BIO 151',     title: 'General Biology',                subject: 'bio' },
    { id: 'cos-101',     code: 'COS 101',     title: 'Introduction to Computer Science', subject: 'cos' },
    { id: 'cos-141',     code: 'COS 141',     title: 'COS 141',                        subject: 'cos' },
    { id: 'gsp-111',     code: 'GSP 111',     title: 'Communication in English I',     subject: 'gsp' },
    { id: 'gsp-201',     code: 'GSP 201',     title: 'Peace and Conflict Studies I',   subject: 'gsp' },
    { id: 'gst-111',     code: 'GST 111',     title: 'Communication in English',       subject: 'gsp' },
];

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('deeex-dark') === 'true') {
        document.body.classList.add('dark-mode');
    }

    const session = await requireAuth();
    if (!session) return;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name, department, level')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('sidebarName').textContent = profile.full_name;
        document.getElementById('sidebarDept').textContent = `${profile.department} · ${profile.level}`;
        document.getElementById('sidebarAvatar').textContent = initials;
    }

    // Check if coming from a direct course link
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('course');
    if (preselect) {
        const course = STUDY_COURSES.find(c => c.id === preselect);
        if (course) { openCourseMaterials(course); return; }
    }

    renderStudyCourses();
});

// ============================
// RENDER COURSE GRID
// ============================
async function renderStudyCourses() {
    // Check which courses have content
    const { data: noteCourses } = await supabaseClient.from('notes').select('course_id');
    const { data: videoCourses } = await supabaseClient.from('videos').select('course_id');

    const coursesWithContent = new Set([
        ...(noteCourses?.map(n => n.course_id) || []),
        ...(videoCourses?.map(v => v.course_id) || [])
    ]);

    const grid = document.getElementById('studyCourseGrid');
    grid.innerHTML = STUDY_COURSES.map(c => {
        const hasContent = coursesWithContent.has(c.id);
        return `
            <div class="card assessment-card" style="opacity:${hasContent ? '1' : '0.6'}">
                <span class="subject-badge subject-${c.subject}">${c.code}</span>
                <h3>${c.title}</h3>
                ${hasContent
                    ? `<p style="font-size:12px;color:#2e7d32;margin-bottom:12px">✓ Materials available</p>`
                    : `<p style="font-size:12px;color:#888;margin-bottom:12px">No materials yet</p>`
                }
                <button class="primary-btn" onclick="openCourseMaterials(${JSON.stringify(c).replace(/"/g, '&quot;')})"
                    ${hasContent ? '' : 'style="background:#aaa;cursor:not-allowed"'}
                    ${hasContent ? '' : 'disabled'}>
                    ${hasContent ? 'View materials' : 'Coming soon'}
                </button>
            </div>
        `;
    }).join('');
}

function filterStudyCourses() {
    const search = document.getElementById('studySearch')?.value.toLowerCase().trim() || '';
    document.querySelectorAll('#studyCourseGrid .assessment-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(search) ? '' : 'none';
    });
}

// ============================
// OPEN COURSE MATERIALS
// ============================
async function openCourseMaterials(course) {
    currentStudyCourse = course;
    currentTopicFilter = '';
    currentStudyTab = 'notes';

    document.getElementById('view-courses').style.display = 'none';
    document.getElementById('view-course-detail').style.display = 'block';
    document.getElementById('detailCourseMeta').textContent = course.code;
    document.getElementById('detailCourseTitle').textContent = course.title;

    // Reset tabs
    document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.study-tab')[0].classList.add('active');
    document.getElementById('study-notes-section').style.display = 'block';
    document.getElementById('study-videos-section').style.display = 'none';

    // Load topics for filter
    const { data: topics } = await supabaseClient
        .from('topics')
        .select('id, title')
        .eq('course_id', course.id);

    allTopics = topics || [];
    renderTopicFilters();
    loadStudyNotes();
}

function backToCourses() {
    document.getElementById('view-courses').style.display = 'block';
    document.getElementById('view-course-detail').style.display = 'none';
    currentStudyCourse = null;
}

// ============================
// TOPIC FILTERS
// ============================
function renderTopicFilters() {
    const tabs = document.getElementById('topicFilterTabs');
    tabs.innerHTML = `<button class="filter-tab active" data-topic="" onclick="setTopicFilter(this)">All topics</button>`;

    allTopics.forEach(t => {
        tabs.innerHTML += `
            <button class="filter-tab" data-topic="${t.id}" onclick="setTopicFilter(this)">${t.title}</button>
        `;
    });
}

function setTopicFilter(btn) {
    document.querySelectorAll('#topicFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentTopicFilter = btn.dataset.topic;

    if (currentStudyTab === 'notes') loadStudyNotes();
    else loadStudyVideos();
}

// ============================
// TABS
// ============================
function setStudyTab(tab, btn) {
    currentStudyTab = tab;
    document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('study-notes-section').style.display = tab === 'notes' ? 'block' : 'none';
    document.getElementById('study-videos-section').style.display = tab === 'videos' ? 'block' : 'none';

    if (tab === 'notes') loadStudyNotes();
    else loadStudyVideos();
}

// ============================
// LOAD NOTES
// ============================
async function loadStudyNotes() {
    let query = supabaseClient
        .from('notes')
        .select('*, topics(title)')
        .eq('course_id', currentStudyCourse.id)
        .order('created_at', { ascending: false });

    if (currentTopicFilter) query = query.eq('topic_id', currentTopicFilter);

    const { data: notes } = await query;
    const el = document.getElementById('studyNotesList');

    if (!notes || notes.length === 0) {
        el.innerHTML = '<p class="empty-msg">No notes available for this course yet.</p>';
        return;
    }

    el.innerHTML = notes.map(n => `
        <div class="content-card">
            <div class="content-card-header">
                <div>
                    <div class="content-card-title">📝 ${n.title}</div>
                    <div class="content-card-meta">${n.topics?.title || 'General'}</div>
                </div>
                ${n.content
                    ? `<button class="primary-btn" style="padding:6px 16px;font-size:12px" onclick="readNote('${n.id}', \`${n.title}\`, \`${n.content?.replace(/`/g, "'")}\`)">Read</button>`
                    : `<a href="${n.file_url}" target="_blank" class="primary-btn" style="padding:6px 16px;font-size:12px;text-decoration:none">⬇ Download ${n.file_type || ''}</a>`
                }
            </div>
        </div>
    `).join('');
}

function readNote(id, title, content) {
    document.getElementById('noteReaderTitle').textContent = title;
    document.getElementById('noteReaderContent').innerHTML = content.replace(/\n/g, '<br>');
    showModal('noteReaderModal');
}

// ============================
// LOAD VIDEOS
// ============================
async function loadStudyVideos() {
    let query = supabaseClient
        .from('videos')
        .select('*, topics(title)')
        .eq('course_id', currentStudyCourse.id)
        .order('created_at', { ascending: false });

    if (currentTopicFilter) query = query.eq('topic_id', currentTopicFilter);

    const { data: videos } = await query;
    const el = document.getElementById('studyVideosList');

    if (!videos || videos.length === 0) {
        el.innerHTML = '<p class="empty-msg">No videos available for this course yet.</p>';
        return;
    }

    el.innerHTML = videos.map(v => {
        let embedHtml = '';

        if (v.video_type === 'youtube') {
            const videoId = extractYoutubeId(v.video_url);
            if (videoId) {
                embedHtml = `<iframe class="study-video-embed" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            } else {
                embedHtml = `<a href="${v.video_url}" target="_blank" class="content-download-btn">▶ Watch on YouTube</a>`;
            }
        } else if (v.video_type === 'drive') {
            embedHtml = `<a href="${v.video_url}" target="_blank" class="content-download-btn">▶ Open in Google Drive</a>`;
        } else {
            embedHtml = `<video class="study-video-embed" controls src="${v.video_url}"></video>`;
        }

        return `
            <div class="content-card">
                <div class="content-card-header" style="margin-bottom:12px">
                    <div>
                        <div class="content-card-title">🎬 ${v.title}</div>
                        <div class="content-card-meta">${v.topics?.title || 'General'}</div>
                    </div>
                </div>
                ${embedHtml}
            </div>
        `;
    }).join('');
}

function extractYoutubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\s]+)/);
    return match ? match[1] : null;
}

// ============================
// MODAL HELPERS
// ============================
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}