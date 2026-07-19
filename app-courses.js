// ============================
// COURSE DATA
// ============================
const APP_COURSES = [
    { id: 'mth-101-111', code: 'MTH 101/111', title: 'Elementary Mathematics I',       subject: 'mth', desc: 'Algebra, functions, and foundational mathematical concepts.' },
    { id: 'mth-103-121', code: 'MTH 103/121', title: 'Elementary Mathematics II',      subject: 'mth', desc: 'Trigonometry, sequences, and introductory calculus.' },
    { id: 'mth-113',     code: 'MTH 113',     title: 'Intermediate Mathematics',       subject: 'mth', desc: 'Matrices, vectors, and intermediate-level problem solving.' },
    { id: 'sta-111',     code: 'STA 111',     title: 'Descriptive Statistics',         subject: 'sta', desc: 'Data summarization, central tendency, and dispersion.' },
    { id: 'sta-113',     code: 'STA 113',     title: 'Probability I',                  subject: 'sta', desc: 'Basic probability theory, distributions, and counting.' },
    { id: 'phy-101',     code: 'PHY 101',     title: 'General Physics I',              subject: 'phy', desc: 'Motion, forces, and the physical properties of matter.' },
    { id: 'phy-107',     code: 'PHY 107',     title: 'General Practical Physics',      subject: 'phy', desc: 'Hands-on lab experiments and measurement techniques.' },
    { id: 'phy-111',     code: 'PHY 111',     title: 'General Physics for Life Sciences', subject: 'phy', desc: 'Physics applied to biological and life science contexts.' },
    { id: 'chm-101',     code: 'CHM 101',     title: 'Principles of Chemistry',        subject: 'chm', desc: 'Atomic structure, bonding, and basic chemical reactions.' },
    { id: 'chm-107',     code: 'CHM 107',     title: 'Principles of Inorganic Chemistry', subject: 'chm', desc: 'Periodic trends, inorganic compounds, and reaction types.' },
    { id: 'chm-171',     code: 'CHM 171',     title: 'Basic Practical Chemistry',      subject: 'chm', desc: 'Lab safety, titration, and basic experimental techniques.' },
    { id: 'bio-103',     code: 'BIO 103',     title: 'Introduction to Genetics',       subject: 'bio', desc: 'Core genetics concepts for medical and life science students.' },
    { id: 'bio-107',     code: 'BIO 107',     title: 'General Practical Biology I',    subject: 'bio', desc: 'Lab techniques and practical biology fundamentals.' },
    { id: 'bio-151',     code: 'BIO 151',     title: 'General Biology',                subject: 'bio', desc: 'Foundational biology across cell, plant, and animal systems.' },
    { id: 'cos-101',     code: 'COS 101',     title: 'Introduction to Computer Science', subject: 'cos', desc: 'Computing fundamentals, algorithms, and basic programming logic.' },
    { id: 'cos-141',     code: 'COS 141',     title: 'COS 141',                        subject: 'cos', desc: 'Introductory programming and computational thinking.' },
    { id: 'gsp-111',     code: 'GSP 111',     title: 'Communication in English I',     subject: 'gsp', desc: 'Grammar, comprehension, and academic writing basics.' },
    { id: 'gsp-201',     code: 'GSP 201',     title: 'Peace and Conflict Studies I',   subject: 'gsp', desc: 'Conflict resolution theory and peacebuilding fundamentals.' },
    { id: 'gst-111',     code: 'GST 111',     title: 'Communication in English',       subject: 'gsp', desc: 'Core English communication skills for university study.' },
];

let userProgress = {};
let currentSubject = 'all';

// ============================
// INIT
// ============================
// Apply saved dark mode
if (localStorage.getItem('deeex-dark') === 'true') {
    document.body.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', async () => {
    const session = await requireAuth();
    if (!session) return;

    // Load sidebar profile
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

    // Load user progress
    const { data: progress } = await supabaseClient
        .from('progress')
        .select('*')
        .eq('user_id', session.user.id);

    if (progress) {
        progress.forEach(p => { userProgress[p.course_id] = p; });
    }

    renderCourses();
});

// ============================
// RENDER COURSES
// ============================
function renderCourses() {
    const search = document.getElementById('courseSearch')?.value.toLowerCase().trim() || '';
    const grid = document.getElementById('appCourseGrid');
    let visibleCount = 0;

    const filtered = APP_COURSES.filter(c => {
        const matchSubject = currentSubject === 'all' || c.subject === currentSubject;
        const matchSearch = c.title.toLowerCase().includes(search) ||
                            c.code.toLowerCase().includes(search);
        return matchSubject && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        document.getElementById('appNoResults').style.display = 'block';
        return;
    }

    document.getElementById('appNoResults').style.display = 'none';

    grid.innerHTML = filtered.map(c => {
        const progress = userProgress[c.id];
        const pct = progress ? Math.round(progress.average_score) : 0;
        const sessions = progress ? progress.sessions_taken : 0;
        const hasStarted = !!progress;

        const badgeClass = `subject-${c.subject}`;

        return `
            <div class="card assessment-card">
                <span class="subject-badge ${badgeClass}">${c.code}</span>
                <h3>${c.title}</h3>
                <p>${c.desc}</p>

                ${hasStarted ? `
                    <div class="app-course-progress">
                        <div class="progress-bar" style="width:100%;margin-bottom:4px">
                            <div class="progress-fill" style="width:${pct}%"></div>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:11px;color:#666">
                            <span>${sessions} session${sessions !== 1 ? 's' : ''} taken</span>
                            <span>${pct}% avg</span>
                        </div>
                    </div>
                ` : ''}

                <div style="display:flex;gap:10px;margin-top:12px">
                    <button class="primary-btn"
                        onclick="window.location.href='app-assessment.html?course=${c.id}'">
                        ${hasStarted ? 'Resume' : 'Start'}
                    </button>
                    <button class="quiz-nav-btn"
                        onclick="window.location.href='course-detail.html?id=${c.id}'">
                        Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================
// FILTER
// ============================
function setCourseFilter(btn) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentSubject = btn.dataset.subject;
    renderCourses();
}

function filterCourses() {
    renderCourses();
}