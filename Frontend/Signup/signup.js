/**
 * Aura Study - Signup Page Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;
            const submitBtn = signupForm.querySelector('.submit-btn');

            if (password !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:8081/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password })
                });

                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('userId', user.id); // Save ID for the sanctuary
                    window.location.href = '../Login/login.html';
                } else {
                    alert("Registration failed. Email might already exist.");
                }
            } catch (error) {
                console.error("Backend Error:", error);
            } finally {
                submitBtn.textContent = 'Create Account';
                submitBtn.disabled = false;
            }
        });
    }
});
    
