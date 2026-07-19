let currentFilter = 'overall';
let currentUserId = null;

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('deeex-dark') === 'true') {
        document.body.classList.add('dark-mode');
    }

    const session = await requireAuth();
    if (!session) return;

    currentUserId = session.user.id;

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

    loadLeaderboard();
});

// ============================
// FILTER
// ============================
function setLbFilter(btn) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadLeaderboard();
}

// ============================
// LOAD LEADERBOARD
// ============================
async function loadLeaderboard() {
    document.getElementById('lbTable').innerHTML =
        '<tr><td colspan="5" class="empty-msg">Loading...</td></tr>';
    document.getElementById('lbPodium').innerHTML = '';
    document.getElementById('yourRankCard').style.display = 'none';

    let data;

    if (currentFilter === 'overall') {
        // Get all progress records with profile info
        const { data: progress } = await supabaseClient
            .from('progress')
            .select('user_id, average_score, sessions_taken, course_id');

        if (!progress || progress.length === 0) {
            document.getElementById('lbTable').innerHTML =
                '<tr><td colspan="5" class="empty-msg">No data yet.</td></tr>';
            return;
        }

        // Aggregate per user
        const userMap = {};
        progress.forEach(p => {
            if (!userMap[p.user_id]) {
                userMap[p.user_id] = { total: 0, count: 0, sessions: 0 };
            }
            userMap[p.user_id].total += p.average_score;
            userMap[p.user_id].count++;
            userMap[p.user_id].sessions += p.sessions_taken;
        });

        // Get profiles
        const userIds = Object.keys(userMap);
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, full_name, department')
            .in('id', userIds);

        data = profiles?.map(p => ({
            user_id: p.id,
            full_name: p.full_name,
            department: p.department,
            avg_score: Math.round(userMap[p.id].total / userMap[p.id].count),
            sessions: userMap[p.id].sessions
        })) || [];

    } else {
        // Per course leaderboard
        const { data: progress } = await supabaseClient
            .from('progress')
            .select('user_id, average_score, sessions_taken')
            .eq('course_id', currentFilter);

        if (!progress || progress.length === 0) {
            document.getElementById('lbTable').innerHTML =
                '<tr><td colspan="5" class="empty-msg">No data for this course yet.</td></tr>';
            return;
        }

        const userIds = progress.map(p => p.user_id);
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, full_name, department')
            .in('id', userIds);

        const profileMap = {};
        profiles?.forEach(p => { profileMap[p.id] = p; });

        data = progress.map(p => ({
            user_id: p.user_id,
            full_name: profileMap[p.user_id]?.full_name || 'Unknown',
            department: profileMap[p.user_id]?.department || '—',
            avg_score: Math.round(p.average_score),
            sessions: p.sessions_taken
        }));
    }

    // Sort by avg score descending
    data.sort((a, b) => b.avg_score - a.avg_score);

    renderPodium(data.slice(0, 3));
    renderTable(data);
    renderYourRank(data);
}

// ============================
// PODIUM (top 3)
// ============================
function renderPodium(top3) {
    if (top3.length === 0) return;

    const medals = ['🥇', '🥈', '🥉'];
    const heights = ['lb-podium-1st', 'lb-podium-2nd', 'lb-podium-3rd'];
    // Reorder: 2nd, 1st, 3rd for visual podium effect
    const order = [1, 0, 2];

    document.getElementById('lbPodium').innerHTML = order.map(i => {
        const entry = top3[i];
        if (!entry) return '';
        const initials = entry.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const isYou = entry.user_id === currentUserId;

        return `
            <div class="lb-podium-item ${heights[i]} ${isYou ? 'lb-you' : ''}">
                <div class="lb-podium-avatar">${initials}</div>
                <div class="lb-podium-medal">${medals[i]}</div>
                <div class="lb-podium-name">${entry.full_name.split(' ')[0]}${isYou ? ' (You)' : ''}</div>
                <div class="lb-podium-score">${entry.avg_score}%</div>
                <div class="lb-podium-bar ${heights[i]}-bar"></div>
            </div>
        `;
    }).join('');
}

// ============================
// TABLE
// ============================
function renderTable(data) {
    const tbody = document.getElementById('lbTable');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No data yet.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((entry, i) => {
        const rank = i + 1;
        const isYou = entry.user_id === currentUserId;
        const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        const scoreColor = entry.avg_score >= 70 ? '#2e7d32' : entry.avg_score >= 50 ? '#006DF2' : '#e65100';

        return `
            <tr class="${isYou ? 'lb-you-row' : ''}">
                <td style="font-weight:600">${rankLabel}</td>
                <td>
                    ${entry.full_name}
                    ${isYou ? '<span class="lb-you-badge">You</span>' : ''}
                </td>
                <td style="color:#666;font-size:12px">${entry.department}</td>
                <td style="font-weight:600;color:${scoreColor}">${entry.avg_score}%</td>
                <td style="color:#666">${entry.sessions}</td>
            </tr>
        `;
    }).join('');
}

// ============================
// YOUR RANK
// ============================
function renderYourRank(data) {
    const myIndex = data.findIndex(e => e.user_id === currentUserId);
    if (myIndex === -1) return;

    const myEntry = data[myIndex];
    const card = document.getElementById('yourRankCard');
    card.style.display = 'block';
    document.getElementById('yourRankNum').textContent = `#${myIndex + 1}`;
    document.getElementById('yourRankScore').textContent = `${myEntry.avg_score}% average · ${myEntry.sessions} sessions`;
}