document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('.submit-btn');

            btn.textContent = 'Authenticating...';
            btn.disabled = true;

            try {
                const response = await fetch('http://localhost:8081/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('userId', user.userId || user.id);
                    localStorage.setItem('fullName', user.fullName);
                    window.location.href = '../Focusroom/room.html';
                } else {
                    alert("Invalid email or password.");
                }
            } catch (error) {
                console.error("Connection Error:", error);
            } finally {
                btn.textContent = 'Sign In';
                btn.disabled = false;
            }
        });
    }
});