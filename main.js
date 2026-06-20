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
// SIGNUP PAGE FUNCTIONALITY
// ============================

document.addEventListener('DOMContentLoaded', function() {

    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {

            event.preventDefault();

            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const university = document.getElementById('university').value;
            const department = document.getElementById('department').value;
            const level = document.getElementById('level').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Check if any field is empty
            if (fullname === '' || email === '' || university === '' || department === '' || level === '' || password === '' || confirmPassword === '') {
                alert('Please fill in all fields.');
                return;
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            console.log('Signup attempt:', {
                fullname: fullname,
                email: email,
                university: university,
                department: department,
                level: level,
                password: password
            });

            // Pretend signup was successful and go to dashboard
            window.location.href = 'dashboard.html';
        });
    }

});

// ============================
// SOCIAL SIGNUP PLACEHOLDERS
// ============================

function signupWithGoogle() {
    window.location.href = 'dashboard.html';
}

function signupWithApple() {
    window.location.href = 'dashboard.html';
}