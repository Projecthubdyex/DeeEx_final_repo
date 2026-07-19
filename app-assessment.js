// ============================
// STATE
// ============================
let selectedCourse = null;
let selectedMode = null;
let questions = [];
let currentIndex = 0;
let answers = {};
let sessionId = null;
let timerInterval = null;
let timeLeft = 0;
let startTime = null;

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
// INIT
// ============================
// Apply saved dark mode
if (localStorage.getItem('deeex-dark') === 'true') {
    document.body.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', async () => {
    const session = await requireAuth();
    if (!session) return;

    // Load user profile for sidebar
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

    // Check if coming from a course link (?course=mth-101)
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('course');

    renderCoursePicker(preselect);
});

// ============================
// RENDER COURSE PICKER
// ============================
function renderCoursePicker(preselect) {
    const list = document.getElementById('coursePickList');
    list.innerHTML = COURSES.map(c => `
        <div class="course-pick-item" id="cpi-${c.id}" onclick="selectCourse('${c.id}')">
            <div>
                <div class="cpi-name">${c.title}</div>
            </div>
            <span class="cpi-code">${c.code}</span>
        </div>
    `).join('');

    if (preselect) selectCourse(preselect);
}

// ============================
// SELECT COURSE
// ============================
function selectCourse(courseId) {
    selectedCourse = COURSES.find(c => c.id === courseId);
    document.querySelectorAll('.course-pick-item').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById('cpi-' + courseId);
    if (el) el.classList.add('selected');
    updateStartInfo();
}

// ============================
// SELECT MODE
// ============================
function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-card').forEach(el => el.classList.remove('selected'));
    document.getElementById('mode' + mode.charAt(0).toUpperCase() + mode.slice(1)).classList.add('selected');
    updateStartInfo();
}

// ============================
// UPDATE START INFO
// ============================
function updateStartInfo() {
    const info = document.getElementById('startInfo');
    const text = document.getElementById('startInfoText');
    if (!selectedCourse || !selectedMode) { info.style.display = 'none'; return; }
    info.style.display = 'block';
    text.textContent = `Ready to start ${selectedCourse.code} in ${selectedMode} mode.`;
}

// ============================
// START ASSESSMENT
// ============================
async function startAssessmentSession() {
    if (!selectedCourse || !selectedMode) {
        alert('Please select a course and mode.');
        return;
    }

    // Fetch questions from Supabase
    const { data, error } = await supabaseClient
        .from('questions')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .in('mode', [selectedMode, 'both'])
        .order('created_at');

    if (error || !data || data.length === 0) {
        alert('No questions available for this course yet. Please check back later.');
        return;
    }

    questions = shuffle(data);
    answers = {};
    currentIndex = 0;
    startTime = Date.now();

    // Get time limit from first question (admin sets per course)
    const timeLimitMins = data[0].time_limit || 30;
    timeLeft = timeLimitMins * 60;

    // Create session in Supabase
    const { data: { session } } = await supabaseClient.auth.getSession();
    const { data: sess } = await supabaseClient.from('assessment_sessions').insert({
        user_id: session.user.id,
        course_id: selectedCourse.id,
        mode: selectedMode,
        total_questions: questions.length
    }).select().single();

    if (sess) sessionId = sess.id;

    // Switch to quiz step
    showStep('quiz');
    renderQuiz();
    startTimer();
}

// ============================
// RENDER QUIZ
// ============================
function renderQuiz() {
    const q = questions[currentIndex];
    const total = questions.length;

    document.getElementById('quizCourseLabel').textContent = selectedCourse.code;
    const badge = document.getElementById('quizModeBadge');
    badge.textContent = selectedMode;
    badge.className = `quiz-mode-badge ${selectedMode}`;

    document.getElementById('quizProgressLabel').textContent =
        `Question ${currentIndex + 1} of ${total}`;
    document.getElementById('quizProgressFill').style.width =
        `${((currentIndex + 1) / total) * 100}%`;

    document.getElementById('questionText').textContent = q.question_text;

    const options = [
        { key: 'a', text: q.option_a },
        { key: 'b', text: q.option_b },
        { key: 'c', text: q.option_c },
        { key: 'd', text: q.option_d },

        
    ];

    document.getElementById('optionsList').innerHTML = options.map(o => `
        <div class="option-item ${answers[q.id] === o.key ? 'selected' : ''}"
             onclick="selectAnswer('${q.id}', '${o.key}')">
            <div class="option-letter">${o.key.toUpperCase()}</div>
            <div class="option-text">${o.text}</div>
        </div>
    `).join('');

    // Nav buttons
    document.getElementById('btnPrev').disabled = currentIndex === 0;
    document.getElementById('btnNext').disabled = currentIndex === total - 1;

    // Dots
    document.getElementById('quizDots').innerHTML = questions.map((_, i) => `
        <div class="quiz-dot ${answers[questions[i].id] ? 'answered' : ''} ${i === currentIndex ? 'current' : ''}"
             onclick="jumpToQuestion(${i})"></div>
    `).join('');

    // Answered count
    const answered = Object.keys(answers).length;
    document.getElementById('answeredCount').textContent =
        `${answered} of ${total} answered`;

        // Re-render math after question loads
    if (window.MathJax) {
     MathJax.typesetPromise();
    }
}

// ============================
// SELECT ANSWER
// ============================
function selectAnswer(questionId, key) {
    answers[questionId] = key;
    renderQuiz();
}

// ============================
// NAVIGATION
// ============================
function goQuestion(direction) {
    currentIndex = Math.max(0, Math.min(questions.length - 1, currentIndex + direction));
    renderQuiz();
}

function jumpToQuestion(index) {
    currentIndex = index;
    renderQuiz();
}

// ============================
// TIMER
// ============================
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting your assessment.');
            submitAssessment();
        }
    }, 1000);
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    const el = document.getElementById('quizTimer');
    el.textContent = `${mins}:${secs}`;
    el.className = `quiz-timer${timeLeft <= 300 ? ' warning' : ''}`;
}

// ============================
// CONFIRM + SUBMIT
// ============================
function confirmSubmit() {
    const answered = Object.keys(answers).length;
    const total = questions.length;
    const unanswered = total - answered;

    if (unanswered > 0) {
        if (!confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`)) return;
    }

    submitAssessment();
}

async function submitAssessment() {
    clearInterval(timerInterval);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    let score = 0;
    const answerRows = questions.map(q => {
        const selected = answers[q.id] || null;
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) score++;
        return {
            session_id: sessionId,
            question_id: q.id,
            selected_answer: selected,
            is_correct: isCorrect
        };
    });

    // Save answers + update session
    if (sessionId) {
        await supabaseClient.from('assessment_answers').insert(answerRows);
        await supabaseClient.from('assessment_sessions').update({
            score,
            time_taken: timeTaken,
            completed: true,
            completed_at: new Date().toISOString()
        }).eq('id', sessionId);

        // Update progress table
        const { data: { session } } = await supabaseClient.auth.getSession();
        const { data: existing } = await supabaseClient
            .from('progress')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('course_id', selectedCourse.id)
            .single();

        if (existing) {
            const newAvg = ((existing.average_score * existing.sessions_taken) + (score / questions.length * 100)) /
                (existing.sessions_taken + 1);
            await supabaseClient.from('progress').update({
                sessions_taken: existing.sessions_taken + 1,
                best_score: Math.max(existing.best_score, score),
                average_score: Math.round(newAvg),
                last_accessed: new Date().toISOString()
            }).eq('id', existing.id);
        } else {
            await supabaseClient.from('progress').insert({
                user_id: session.user.id,
                course_id: selectedCourse.id,
                sessions_taken: 1,
                best_score: score,
                average_score: Math.round(score / questions.length * 100),
            });
        }
    }

    showResults(score, timeTaken);
}

// ============================
// SHOW RESULTS
// ============================
function showResults(score, timeTaken) {
    showStep('results');

    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const wrong = questions.filter(q => answers[q.id] && answers[q.id] !== q.correct_answer).length;
    const skipped = total - Object.keys(answers).length;

    document.getElementById('resultScore').textContent = pct + '%';
    document.getElementById('resultCorrect').textContent = score;
    document.getElementById('resultWrong').textContent = wrong;
    document.getElementById('resultSkipped').textContent = skipped;

    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    document.getElementById('resultTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Review
    document.getElementById('reviewList').innerHTML = questions.map((q, i) => {
        const userAns = answers[q.id];
        const isCorrect = userAns === q.correct_answer;
        const isSkipped = !userAns;
        const cls = isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';

        const optMap = { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };

        return `
            <div class="review-item ${cls}">
                <div class="review-q">${i + 1}. ${q.question_text}</div>
                <div class="review-answers">
                    <span class="review-your">Your answer: ${userAns ? userAns.toUpperCase() + '. ' + optMap[userAns] : 'Skipped'}</span>
                    <span class="review-correct">✓ Correct: ${q.correct_answer.toUpperCase()}. ${optMap[q.correct_answer]}</span>
                </div>
                ${q.explanation ? `<div class="review-explanation">💡 ${q.explanation}</div>` : ''}
            </div>
        `;
    }).join('');

    // Re-render math after question loads
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

// ============================
// HELPERS
// ============================
function showStep(name) {
    document.querySelectorAll('.assess-step').forEach(s => s.style.display = 'none');
    document.getElementById('step-' + name).style.display = 'block';
}

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function retakeAssessment() {
    clearInterval(timerInterval);
    showStep('pick');
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}