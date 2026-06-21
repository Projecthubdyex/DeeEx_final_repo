// ============================
// HAMBURGER MENU (home/navbar pages only)
// ============================

const harmburger = document.querySelector(".hamburger");
const navUl = document.querySelector(".nav-ul");
const navAuth = document.querySelector(".nav-auth");

if (harmburger) {
    harmburger.addEventListener("click", () => {
        harmburger.classList.toggle("active");
        navUl.classList.toggle("active");
        navAuth.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
        harmburger.classList.remove("active");
        navUl.classList.remove("active");
        navAuth.classList.remove("active");
    }));
}

// ============================
// NAVIGATION FUNCTIONS
// ============================

function goToSignup() {
    window.location.href = 'signup.html';
}

function goToService() {
    window.location.href = 'service.html';
}

function goToLogin() {
    window.location.href = 'login.html';
}

// ============================
// CONTACT FORM (home page)
// ============================

async function sendEmail() {
    const text = document.getElementById('myText').value;

    await fetch('https://formspree.io/f/xpqenbpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
    });

    alert('Submitted!');
}

// ============================
// LOGIN PAGE FUNCTIONALITY
// ============================

document.addEventListener('DOMContentLoaded', function() {

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {

            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (email === '' || password === '') {
                alert('Please fill in both email and password.');
                return;
            }

            console.log('Login attempt:', { email: email, password: password });

            window.location.href = 'dashboard.html';
        });
    }

});

// ============================
// SOCIAL LOGIN PLACEHOLDERS
// ============================

function loginWithGoogle() {
    window.location.href = 'dashboard.html';
}

function loginWithApple() {
    window.location.href = 'dashboard.html';
}

// ============================
// FACULTY & DEPARTMENT DATA
// ============================

const facultyData = {
    "Faculty of Agriculture": [
        "Agriculture", "Agricultural Economics", "Agric Extension", "Agribusiness",
        "Animal Science", "Crop Science", "Food Science and Technology",
        "Home Science and Management", "Nutrition and Dietetics", "Soil Science"
    ],
    "Faculty of Arts": [
        "Archaeology", "Combined Arts", "Creative Arts", "English and Literary Studies",
        "Fine and Applied Arts", "French with German/Russian", "German", "History",
        "History and International Studies", "Igbo", "Industrial Arts", "Linguistics",
        "Mass Communication", "Music", "Theatre and Film Studies", "Tourism"
    ],
    "Faculty of Basic Medical Sciences": [
        "Human Anatomy", "Human Physiology"
    ],
    "Faculty of Biological Sciences": [
        "Biochemistry", "Biological Sciences", "Botany", "Combined Biological Sciences",
        "Genetics and Biotechnology", "Microbiology", "Plant Science and Biotechnology",
        "Zoology", "Zoology and Environmental Biology", "Zoology and Environmental Studies"
    ],
    "Faculty of Business Administration": [
        "Accountancy", "Banking and Finance", "Business Management", "Marketing"
    ],
    "Faculty of Clinical Sciences": [
        "Medicine and Surgery"
    ],
    "Faculty of Education": [
        "Education and Fine and Applied Arts", "Education and Political Science",
        "Education Arts", "Guidance and Counselling", "Library and Information Science"
    ],
    "Faculty of Engineering": [
        "Electrical Engineering", "Electronics Engineering", "Mechanical Engineering"
    ],
    "Faculty of Environmental Studies": [
        "Architecture", "Surveying and Geoinformatics", "Urban and Regional Planning"
    ],
    "Faculty of Law": [
        "Law"
    ],
    "Faculty of Pharmaceutical Sciences": [
        "Doctor of Pharmacy"
    ],
    "Faculty of Physical Sciences": [
        "Computer Science", "Science Laboratory Technology", "Mathematics",
        "Pure and Industrial Chemistry", "Physics and Astronomy", "Geology",
        "Combined Physical Sciences"
    ],
    "Faculty of Social Sciences": [
        "Criminology and Security Studies", "Economics", "Political Science", "Psychology"
    ],
    "Faculty of Veterinary Medicine": [
        "Veterinary Medicine"
    ],
    "Faculty of Vocational and Technical Education": [
        "Agricultural Science and Education", "Computer Education",
        "Business Education", "Home Economics and Education", "Industrial Technical Education"
    ]
};

// ============================
// POPULATE FACULTY DROPDOWN ON PAGE LOAD
// ============================

function populateFaculties() {
    const facultySelect = document.getElementById('faculty');
    if (!facultySelect) return; // stop if this page has no faculty dropdown

    // Loop through each faculty name and add it as an option
    for (const facultyName in facultyData) {
        const option = document.createElement('option');
        option.value = facultyName;
        option.textContent = facultyName;
        facultySelect.appendChild(option);
    }
}

// ============================
// UPDATE DEPARTMENTS WHEN FACULTY CHANGES
// ============================

function updateDepartments() {
    const facultySelect = document.getElementById('faculty');
    const departmentSelect = document.getElementById('department');

    const selectedFaculty = facultySelect.value;

    // Clear out old department options first
    departmentSelect.innerHTML = '<option value="">Select department</option>';

    // If no faculty chosen yet, stop here
    if (selectedFaculty === '') return;

    // Get the list of departments for the chosen faculty
    const departments = facultyData[selectedFaculty];

    // Add each department as an option
    departments.forEach(function(dept) {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        departmentSelect.appendChild(option);
    });
}

// Run this as soon as the page loads
document.addEventListener('DOMContentLoaded', populateFaculties);


// ============================
// INSTITUTION PAGE DATA
// ============================

const universityList = [
    { name: "University of Nigeria, Nnsuka", students: "1,200", departments: "32" },
    { name: "University of Ibadan", students: "850", departments: "28" },
    { name: "University of Lagos", students: "620", departments: "40" },
    { name: "Federal University of Owerri", students: "540", departments: "30" }
];

// ============================
// BUILD UNIVERSITY CARDS
// ============================

function loadUniversities() {
    const grid = document.getElementById('universityGrid');
    if (!grid) return; // only run on institution page

    universityList.forEach(function(uni, index) {
        const card = document.createElement('div');
        card.className = 'inst-card';
        card.onclick = function() { openUniversityModal(index); };

        card.innerHTML = `
            <div class="inst-ico"><i class="ti ti-building-bank"></i></div>
            <h4>${uni.name}</h4>
            <p>${uni.students} students</p>
        `;

        grid.appendChild(card);
    });
}

// ============================
// UNIVERSITY MODAL
// ============================

function openUniversityModal(index) {
    const uni = universityList[index];

    document.getElementById('modalUniName').textContent = uni.name;
    document.getElementById('modalUniDesc').textContent =
        `${uni.name} is one of the partner institutions on DeeEx, giving students access to organised materials and practice tests across their departments.`;
    document.getElementById('modalUniStudents').textContent = uni.students;
    document.getElementById('modalUniDept').textContent = uni.departments;

    document.getElementById('universityModal').classList.add('active');
}

function closeUniversityModal() {
    document.getElementById('universityModal').classList.remove('active');
}

// ============================
// COUNTING NUMBER ANIMATION
// ============================

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return; // nothing to animate on this page

    counters.forEach(function(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        let current = 0;
        const increment = target / 60; // controls speed (60 steps)

        function updateCount() {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCount);
            } else {
                counter.textContent = target.toLocaleString();
            }
        }

        updateCount();
    });
}

// ============================
// RUN ON PAGE LOAD
// ============================

document.addEventListener('DOMContentLoaded', function() {
    loadUniversities();
    animateCounters();
});

function toggleFaq(button) {
    const item = button.closest(".faq-item");
    const wasActive = item.classList.contains("active");

    document.querySelectorAll(".faq-item.active").forEach(el => el.classList.remove("active"));

    if (!wasActive) {
        item.classList.add("active");
    }
}



async function sendContactEmail() {
     const name = document.getElementById('contactName').value;
     const email = document.getElementById('contactEmail').value;
     const message = document.getElementById('contactMessage').value;

   await fetch('https://formspree.io/f/xpqenbpn', {
        method: 'POST',
         headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, message: message })
     });

     alert("Thanks for reaching out! We'll get back to you soon.");
 }

 let currentSubjectFilter = 'all';

function setSubjectFilter(button) {
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
    currentSubjectFilter = button.dataset.subject;
    filterAssessments();
}

function filterAssessments() {
    const searchValue = document.getElementById('assessmentSearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.assessment-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const matchesSubject = currentSubjectFilter === 'all' || card.dataset.subject === currentSubjectFilter;
        const matchesSearch = card.dataset.title.includes(searchValue);

        if (matchesSubject && matchesSearch) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    document.getElementById('noResults').style.display = visibleCount === 0 ? 'block' : 'none';
}

function startAssessment(assessmentId) {
    window.location.href = `signup.html?assessment=${assessmentId}`;
}

function viewCourse(courseId) {
    window.location.href = `course-detail.html?id=${courseId}`;
}