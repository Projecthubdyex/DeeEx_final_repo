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