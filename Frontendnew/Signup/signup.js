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
    

//     // 2. Form Submission & Validation
//     if (signupForm) {
//         signupForm.addEventListener('submit', (e) => {
//             e.preventDefault();

//             const password = passwordInput.value;
//             const confirm = confirmPasswordInput.value;
//             const submitBtn = signupForm.querySelector('.submit-btn');

//             // Simple match validation - Avoiding browser alert() per system guidelines
//             if (password !== confirm) {
//                 const originalColor = confirmPasswordInput.style.borderColor;
//                 confirmPasswordInput.style.borderColor = "#e53e3e"; // Red error border
//                 confirmPasswordInput.placeholder = "Passwords must match";
//                 confirmPasswordInput.value = "";
                
//                 setTimeout(() => {
//                     confirmPasswordInput.style.borderColor = originalColor;
//                 }, 2000);
//                 return;
//             }

//             // Visual feedback for account creation
//             submitBtn.textContent = 'Creating Account...';
//             submitBtn.style.opacity = '0.7';
//             submitBtn.disabled = true;

//             // Simulating API/Server delay
//             setTimeout(() => {
//                 /**
//                  * Redirect path logic:
//                  * From Signup/signup.html to Home Page/index.html
//                  */
//                 window.location.href = '../Home Page/index.html';
//             }, 1500);
//         });
//     }

//     // 3. Theme State Check
//     // Ensures the signup page matches the user's preferred theme (Dark/Light)
//     if (localStorage.getItem('theme') === 'dark') {
//         document.body.classList.add('dark-mode');
//     }
// });