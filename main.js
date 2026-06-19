const harmburger = document.querySelector(".hamburger");
const navUl = document.querySelector(".nav-ul");
const navAuth = document.querySelector(".nav-auth");

harmburger.addEventListener("click", () => {
    harmburger.classList.toggle("active")
    navUl.classList.toggle("active")
    navAuth.classList.toggle("active")
})

document.querySelectorAll(".nav-link").forEach(n => n.addEventListener ("click", () => {
    harmburger.classList.remove("active");
    navUl.classList.remove("active");
    navAuth.classList.remove("active");
}))

function goToSignup(){
    window.location.href='signup.html';
}
function goToService(){
    window.location.href='service.html';
}

async function sendEmail(){
    const text = document.getElementById('myText').value;
    
    await fetch('https://formspree.io/f/xpqenbpn' , {
        method: 'POST' ,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: text })
    });

    alert('Submitted!');
}