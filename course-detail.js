document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    const course = courseData[courseId];

    if (!course) {
        document.querySelector('.course-detail-main').innerHTML =
            '<p class="no-results">Course not found. <a href="courses.html">Browse all courses</a></p>';
        return;
    }

    document.title = `DeeEx - ${course.code}`;

    document.getElementById('courseSubjectBadge').textContent = course.subjectLabel;
    document.getElementById('courseSubjectBadge').classList.add('subject-' + course.subject);

    document.getElementById('courseTitle').textContent = `${course.code}: ${course.title}`;
    document.getElementById('courseDescription').textContent = course.description;

    document.getElementById('courseMeta').innerHTML =
        `<span>${course.questions} questions</span><span>${course.minutes} mins</span>`;

    const topicsList = document.getElementById('courseTopics');
    course.topics.forEach(topic => {
        const li = document.createElement('li');
        li.textContent = topic;
        topicsList.appendChild(li);
    });

    document.getElementById('courseWhy').textContent = course.why;

    const cta = document.getElementById('courseCta');
    cta.textContent = 'Start assessment';
    cta.onclick = function () {
        window.location.href = `signup.html?assessment=${courseId}`;
    };
});