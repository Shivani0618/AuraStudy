document.addEventListener('DOMContentLoaded', () => {
    // 1. Greet the User
    const userId = localStorage.getItem('userId');
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        if (userId) {
            const firstName = ('Scholar').split(' ')[0];
            heroTitle.innerHTML = `Welcome Back,<br>${firstName}!`;
        }
    }

    // 2. Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark-mode');
            } else {
                localStorage.setItem('theme', '');
            }
        });
    }

    // 3. Study Sanctuary Toggle
    // (Ensure you add a "Start Session" button or Search Bar to your index.html)
    window.startSession = async () => {
        let userId = localStorage.getItem('userId');
        if (!userId || userId === 'undefined') {
            window.location.href = '../Login/login.html';
            return;
        }

        const topic = document.getElementById('topicInput').value;
        const duration = document.getElementById('durationInput').value;
        const fileInput = document.getElementById('syllabusFile');

        const formData = new FormData();
        if (fileInput && fileInput.files[0]) formData.append("file", fileInput.files[0]);

        formData.append("topic", topic);
        formData.append("duration", duration);
        formData.append("userId", userId);

        try {
            const response = await fetch('http://localhost:8081/api/study/generate-with-syllabus', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            // Redirect to a dedicated 'Sanctuary' page or update DOM to show 3 panes
            renderSanctuary(data);
        } catch (e) {
            console.error("Sanctuary Error:", e);
        }
    };
});