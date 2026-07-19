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

    const userId = session.user.id;

    // Load sidebar
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name, department, level')
        .eq('id', userId)
        .single();

    if (profile) {
        const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('sidebarName').textContent = profile.full_name;
        document.getElementById('sidebarDept').textContent = `${profile.department} · ${profile.level}`;
        document.getElementById('sidebarAvatar').textContent = initials;
    }

    // Load sessions
    const { data: sessions } = await supabaseClient
        .from('assessment_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

    // Load progress
    const { data: progress } = await supabaseClient
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false });

    renderStats(sessions, progress);
    renderCourseBreakdown(progress);
    renderSessionsTable(sessions);
});

// ============================
// STATS
// ============================
function renderStats(sessions, progress) {
    const total = sessions?.length || 0;
    const courses = progress?.length || 0;

    let avg = '—', best = '—';

    if (sessions && sessions.length > 0) {
        const avgNum = Math.round(
            sessions.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / sessions.length
        );
        const bestNum = Math.round(
            Math.max(...sessions.map(s => s.score / s.total_questions * 100))
        );
        avg = avgNum + '%';
        best = bestNum + '%';
    }

    document.getElementById('pgStatSessions').textContent = total;
    document.getElementById('pgStatAvg').textContent = avg;
    document.getElementById('pgStatBest').textContent = best;
    document.getElementById('pgStatCourses').textContent = courses;
}

// ============================
// COURSE BREAKDOWN
// ============================
function renderCourseBreakdown(progress) {
    const el = document.getElementById('courseBreakdown');
    if (!progress || progress.length === 0) {
        el.innerHTML = '<p class="empty-msg">No assessments taken yet.</p>';
        return;
    }

    el.innerHTML = progress.map(p => {
        const pct = Math.round(p.average_score);
        const barColor = pct >= 70 ? '#2e7d32' : pct >= 50 ? '#006DF2' : '#e65100';

        return `
            <div class="pg-course-row">
                <div class="pg-course-info">
                    <div class="pg-course-name">${p.course_id.toUpperCase().replace(/-/g, ' ')}</div>
                    <div class="pg-course-meta">${p.sessions_taken} session${p.sessions_taken !== 1 ? 's' : ''} · Best: ${p.best_score} correct</div>
                </div>
                <div class="pg-course-bar-wrap">
                    <div class="progress-bar" style="width:100%;height:8px">
                        <div class="progress-fill" style="width:${pct}%;background:${barColor}"></div>
                    </div>
                    <div class="pg-pct">${pct}%</div>
                </div>
                <button class="quiz-nav-btn" style="flex-shrink:0"
                    onclick="window.location.href='app-assessment.html?course=${p.course_id}'">
                    Retake
                </button>
            </div>
        `;
    }).join('');
}

// ============================
// SESSIONS TABLE
// ============================
function renderSessionsTable(sessions) {
    const tbody = document.getElementById('sessionsTable');
    if (!sessions || sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No sessions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = sessions.slice(0, 20).map(s => {
        const pct = Math.round(s.score / s.total_questions * 100);
        const date = new Date(s.completed_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const scoreColor = pct >= 70 ? '#2e7d32' : pct >= 50 ? '#006DF2' : '#a32d2d';

        return `
            <tr>
                <td>${s.course_id.toUpperCase().replace(/-/g, ' ')}</td>
                <td><span class="badge badge-${s.mode}">${s.mode}</span></td>
                <td style="font-weight:600;color:${scoreColor}">${pct}% (${s.score}/${s.total_questions})</td>
                <td style="color:#666;font-size:12px">${date}</td>
            </tr>
        `;
    }).join('');
}