// ============================
// SIDEBAR TOGGLE (mobile)
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
// GREETING
// ============================

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// ============================
// LOAD DASHBOARD DATA
// ============================

async function loadDashboard() {
    const session = await requireAuth();
    if (!session) return;

    const userId = session.user.id;

    // Load profile
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile && profile.full_name) {
        const firstName = profile.full_name.split(' ')[0];
        const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        document.getElementById('topGreeting').textContent = `${getGreeting()}, ${firstName}!`;
        document.getElementById('topMeta').textContent =
            `${profile.university} · ${profile.department} · ${profile.level}`;
        document.getElementById('sidebarName').textContent = profile.full_name;
        document.getElementById('sidebarDept').textContent = `${profile.department} · ${profile.level}`;
        document.getElementById('sidebarAvatar').textContent = initials;
    }

    else {
        document.getElementById('topGreeting').textContent = `${getGreeting()}!`;
        document.getElementById('topMeta').textContent = 'Profile not found';
        document.getElementById('sidebarName').textContent = 'User';
        document.getElementById('sidebarDept').textContent = '—';
        document.getElementById('sidebarAvatar').textContent = '?';
    }

    // Load assessment sessions
    const { data: sessions } = await supabaseClient
        .from('assessment_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

    if (sessions && sessions.length > 0) {
        const totalSessions = sessions.length;
        const avgScore = Math.round(
            sessions.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / totalSessions
        );
        const bestScore = Math.round(
            Math.max(...sessions.map(s => s.score / s.total_questions * 100))
        );
        const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);

        document.getElementById('statAssessments').textContent = totalSessions;
        document.getElementById('statAvgScore').textContent = avgScore + '%';
        document.getElementById('statBest').textContent = bestScore + '%';
        document.getElementById('standAvg').textContent = avgScore + '%';
        document.getElementById('standQuestions').textContent = totalQuestions;

        // Best course
        const courseScores = {};
        sessions.forEach(s => {
            if (!courseScores[s.course_id]) courseScores[s.course_id] = [];
            courseScores[s.course_id].push(s.score / s.total_questions * 100);
        });
        let bestCourse = null, bestCourseAvg = 0;
        for (const [courseId, scores] of Object.entries(courseScores)) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg > bestCourseAvg) { bestCourseAvg = avg; bestCourse = courseId; }
        }
        if (bestCourse) {
            document.getElementById('standBest').textContent = bestCourse.toUpperCase().replace(/-/g, ' ');
            document.getElementById('standBestScore').textContent = Math.round(bestCourseAvg) + '% avg score';
        }

        // Recent assessments list
        const recentSessions = sessions.slice(0, 4);
        const assessmentList = document.getElementById('assessmentList');
        assessmentList.innerHTML = recentSessions.map(s => `
            <div class="assessment-item">
                <div>
                    <div class="a-title">${s.course_id.toUpperCase().replace(/-/g, ' ')}</div>
                    <div class="a-meta">${s.total_questions} questions · ${Math.round(s.score / s.total_questions * 100)}%</div>
                </div>
                <span class="badge badge-${s.mode}">${s.mode}</span>
            </div>
        `).join('');
    } else {
        document.getElementById('statAssessments').textContent = '0';
        document.getElementById('statAvgScore').textContent = '—';
        document.getElementById('statBest').textContent = '—';
        document.getElementById('standAvg').textContent = '—';
        document.getElementById('standQuestions').textContent = '0';
    }

    // Load progress (active courses)
    const { data: progressData } = await supabaseClient
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false })
        .limit(4);

    document.getElementById('statCourses').textContent = progressData ? progressData.length : '0';

    if (progressData && progressData.length > 0) {
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = progressData.map(p => {
            const pct = Math.round(p.average_score);
            return `
                <div class="course-item">
                    <div>
                        <div class="course-name">${p.course_id.toUpperCase().replace(/-/g, ' ')}</div>
                        <div class="course-code">${p.sessions_taken} session${p.sessions_taken !== 1 ? 's' : ''} taken</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${pct}%"></div>
                        </div>
                        <div class="pct">${pct}% avg</div>
                    </div>
                    <button class="resume-btn" onclick="viewCourse('${p.course_id}')">Resume</button>
                </div>
            `;
        }).join('');
    }
}

// ============================
// INIT
// ============================

document.addEventListener('DOMContentLoaded', loadDashboard);