document.addEventListener('DOMContentLoaded', () => {
    // Port & Identity
    const BASE_URL = 'http://localhost:8081/api/study';
    const userId = localStorage.getItem('userId') || 1;
    const fullName = localStorage.getItem('fullName') || 'Scholar';
    let currentSessionId = null;

    // UI State References
    const appContainer = document.getElementById('appContainer');
    const navStudy = document.getElementById('navStudy');
    const navAnalytics = document.getElementById('navAnalytics');
    const navNotes = document.getElementById('navNotes');
    const studyView = document.getElementById('studyView');
    const analyticsView = document.getElementById('analyticsView');
    const notesView = document.getElementById('notesView');

    // Theme Toggle logic
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

    // 1. Navigation Logic
    navStudy.addEventListener('click', () => {
        studyView.style.display = 'block';
        analyticsView.style.display = 'none';
        notesView.style.display = 'none';
        navStudy.classList.add('active');
        navAnalytics.classList.remove('active');
        navNotes.classList.remove('active');
    });

    navAnalytics.addEventListener('click', () => {
        studyView.style.display = 'none';
        analyticsView.style.display = 'block';
        notesView.style.display = 'none';
        navAnalytics.classList.add('active');
        navStudy.classList.remove('active');
        navNotes.classList.remove('active');
        loadAnalytics();
    });

    navNotes.addEventListener('click', () => {
        studyView.style.display = 'none';
        analyticsView.style.display = 'none';
        notesView.style.display = 'block';
        navNotes.classList.add('active');
        navStudy.classList.remove('active');
        navAnalytics.classList.remove('active');
        loadNotes();
    });

    // 2. Personalization
    const userFullNameEl = document.getElementById('userFullName');
    const userAvatarEl = document.getElementById('userAvatar');
    const welcomeGreetingEl = document.getElementById('welcomeGreeting');
    if (userFullNameEl) userFullNameEl.textContent = fullName;
    if (userAvatarEl) userAvatarEl.textContent = fullName.charAt(0);
    if (welcomeGreetingEl) welcomeGreetingEl.textContent = `Welcome, ${fullName.split(' ')[0]}.`;

    // 3. Generation Logic (Connectivity)
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', async () => {
        const topic = document.getElementById('topicInput').value;
        const duration = document.getElementById('timeInput').value;
        const fileInput = document.getElementById('syllabusFile');
        const aiContent = document.getElementById('aiContent');

        if (!topic) return alert("Please enter a topic.");

        // Switch to session view
        document.getElementById('placeholderView').style.display = 'none';
        document.getElementById('generatedView').style.display = 'block';
        aiContent.innerHTML = "<em>Analyzing your request and architecting your study path...</em>";

        const formData = new FormData();
        if (fileInput.files[0]) formData.append("file", fileInput.files[0]);
        formData.append("topic", topic);
        formData.append("duration", duration);
        formData.append("userId", userId);

        try {
            const response = await fetch(`${BASE_URL}/generate-with-syllabus`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            aiContent.innerHTML = marked.parse(data.content);

            currentSessionId = data.id;
            if (window.MathJax) {
                MathJax.typesetPromise([aiContent]).catch((err) => console.error(err.message));
            }

            // Activate Triple Pane
            appContainer.classList.add('assistant-active');
            document.getElementById('timerControl').style.display = 'block';
            document.getElementById('timerActive').style.display = 'none';
            loadHistory();
        } catch (e) {
            console.error(e);
            aiContent.innerHTML = "Failed to reach the Sanctuary. The server might be experiencing issues: " + e.message;
        }
    });

    // 3b. Sanctuary Timer & Distraction Tracking
    let tabSwitchCount = 0;

    document.getElementById('startReadingBtn').addEventListener('click', () => {
        const duration = parseInt(document.getElementById('timeInput').value) || 30;
        tabSwitchCount = 0;
        document.getElementById('timerControl').style.display = 'none';
        document.getElementById('timerActive').style.display = 'block';
        startTimer(duration * 60);
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        }
    });

    let isConfirming = false; // ADD THIS FLAG

    document.getElementById('stopReadingBtn').addEventListener('click', () => {
        isConfirming = true; // SET FLAG BEFORE confirm()
        const confirmed = confirm("Are you sure you want to stop this study session early?");
        isConfirming = false; // RESET FLAG AFTER

        if (confirmed) {
            const actualMins = Math.floor((parseInt(document.getElementById('timeInput').value) * 60 - currentSeconds) / 60) || 0;
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById('timerActive').style.display = 'none';
            document.getElementById('timerControl').style.display = 'block';

            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }

            if (currentSessionId) {
                fetch(`${BASE_URL}/${currentSessionId}/end`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actualMins, tabSwitchCount })
                }).catch(() => { });
            }
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (isConfirming) return; // IGNORE visibility changes from confirm() dialog
        if (document.hidden && timerInterval !== null && currentSessionId) {
            tabSwitchCount++;
            fetch(`${BASE_URL}/${currentSessionId}/distraction`, { method: 'POST' }).catch(e => { });
            const banner = document.getElementById('distractionBanner');
            banner.style.display = 'block';
            setTimeout(() => banner.style.display = 'none', 4000);
        }
    });

    // 4. Highlight-to-Explain & Add to Notes Logic
    let selectedTextContext = "";
    document.addEventListener('click', (e) => {
        if (e.target.id !== 'floatingNoteBtn') {
            const btn = document.getElementById('floatingNoteBtn');
            if (btn) btn.remove();
        }
    });

    document.getElementById('aiContent').addEventListener('mouseup', async (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > 10) {
            selectedTextContext = text;
            document.getElementById('highlightPreview').textContent = text.length > 30 ? text.substring(0, 30) + '...' : text;
            document.getElementById('tutorControls').style.display = 'block';
            document.getElementById('explanationBox').innerHTML = "";

            // Add floating button
            let btn = document.getElementById('floatingNoteBtn');
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'floatingNoteBtn';
                btn.className = 'floating-add-btn';
                btn.innerHTML = '<i class="fas fa-plus"></i> Add to Notes';
                document.body.appendChild(btn);
            }
            const range = selection.getRangeAt(0).getBoundingClientRect();
            btn.style.top = `${range.bottom + window.scrollY + 5}px`;
            btn.style.left = `${range.left + window.scrollX}px`;

            btn.onclick = () => {
                navNotes.click();
                createNewNoteDialog(text);
                btn.remove();
            };
        }
    });

    async function fetchExplanation(instruction) {
        const explanationBox = document.getElementById('explanationBox');
        explanationBox.innerHTML = "<em>Assistant is thinking...</em>";
        try {
            const response = await fetch(`${BASE_URL}/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: selectedTextContext, instruction: instruction })
            });
            const data = await response.json();
            explanationBox.innerHTML = marked.parse(data.explanation || "");
            if (window.MathJax) {
                MathJax.typesetPromise([explanationBox]).catch((err) => console.error(err.message));
            }
        } catch (e) {
            explanationBox.innerHTML = "Tutor connection lost.";
        }
    }

    document.getElementById('btnExplain').addEventListener('click', () => fetchExplanation("Explain this simply."));
    document.getElementById('btnSynonyms').addEventListener('click', () => fetchExplanation("Provide synonyms."));
    document.getElementById('customPrompt').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            fetchExplanation(e.target.value.trim());
            e.target.value = '';
        }
    });

    // 5. Timer & History Utils
    let timerInterval = null;
    let currentSeconds = 0;
    function startTimer(seconds) {
        clearInterval(timerInterval);
        currentSeconds = seconds;
        const display = document.getElementById('timerDisplay');
        timerInterval = setInterval(() => {
            const m = Math.floor(currentSeconds / 60);
            const s = currentSeconds % 60;
            display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            if (currentSeconds-- <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }, 1000);
    }

    window.loadOldSession = async (id) => {
        document.getElementById('placeholderView').style.display = 'none';
        document.getElementById('generatedView').style.display = 'block';
        const aiContent = document.getElementById('aiContent');
        aiContent.innerHTML = "<em>Retrieving archives...</em>";
        try {
            const response = await fetch(`${BASE_URL}/session/${id}`);
            const data = await response.json();
            currentSessionId = data.id;
            aiContent.innerHTML = marked.parse(data.content || "");
            if (window.MathJax) MathJax.typesetPromise([aiContent]);
            appContainer.classList.add('assistant-active');
            document.getElementById('timerControl').style.display = 'block';
            document.getElementById('timerActive').style.display = 'none';
        } catch (e) {
            console.error("Failed to load archive", e);
        }
    };

    async function loadHistory() {
        const list = document.getElementById('historyList');
        try {
            const response = await fetch(`${BASE_URL}/history/${userId}`);
            const data = await response.json();
            list.innerHTML = data.reverse().map(s => `
                <div class="history-card" onclick="loadOldSession(${s.id})">
                    <div class="card-info">
                        <strong>${s.topic}</strong>
                        <span>${s.durationMinutes} mins</span>
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteSession(${s.id})" title="Delete Session">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (e) { console.error("History fail"); }
    }

    window.deleteSession = async (id) => {
        if (confirm("Are you sure you want to delete this session?")) {
            try {
                const response = await fetch(`${BASE_URL}/session/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    alert("Failed to delete! Please ensure your Spring Boot server is re-compiled with the latest backend code changes.");
                    return;
                }
                loadHistory();
            } catch (e) {
                console.error("Failed to delete session", e);
            }
        }
    };

    // 6. Heatmap Generation & Analytics API
    async function loadAnalytics() {
        const heatmap = document.getElementById('heatmapGrid');
        if (!heatmap) return;
        heatmap.innerHTML = '<em>Loading...</em>';

        try {
            const res = await fetch(`http://localhost:8081/api/analytics/heatmap/${userId}`);
            const data = await res.json();

            document.getElementById('totalHoursStat').textContent = Math.round(data.totalMins / 60) + 'h';
            document.getElementById('currentStreakStat').textContent = data.currentStreak + ' days';
            document.getElementById('maxStreakStat').textContent = data.maxStreak + ' days';
            document.getElementById('distractionsStat').textContent = data.totalDistractions || 0;

            renderHeatmap(data.studyDays);
        } catch (e) {
            heatmap.innerHTML = 'Failed to load heatmap data.';
            console.error(e);
        }
    }

    function renderHeatmap(studyDays) {
        const grid = document.getElementById('heatmapGrid');
        grid.innerHTML = '';

        const dayMap = {};
        studyDays.forEach(d => dayMap[d.studyDate] = d.totalMins);

        const today = new Date();
        const start = new Date(today);
        start.setFullYear(today.getFullYear() - 1);

        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            const mins = dayMap[key] || 0;

            let lvl = 0;
            if (mins > 0) lvl = 1;
            if (mins >= 30) lvl = 2;
            if (mins >= 60) lvl = 3;
            if (mins >= 120) lvl = 4;

            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${lvl}`;
            cell.title = `${key}: ${Math.round(mins / 60 * 10) / 10}h`;
            grid.appendChild(cell);
        }
    }

    // 7. Notes System API
    async function loadNotes() {
        const container = document.getElementById('notesList');
        container.innerHTML = "<em>Loading notes...</em>";
        try {
            const res = await fetch(`http://localhost:8081/api/notes/user/${userId}`);
            const notes = await res.json();
            container.innerHTML = notes.map(n => `
                <div class="note-card" style="background: ${n.color}">
                    <div class="note-header">
                        <span class="note-title">${n.title || 'Untitled'}</span>
                        <div class="note-actions">
                            <button class="delete-btn" onclick="deleteNoteApi(${n.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="note-body">${n.content}</div>
                </div>
            `).join('');
            if (notes.length === 0) container.innerHTML = "<p>No notes yet.</p>";
        } catch (e) { container.innerHTML = "Failed to load notes"; }
    }

    function createNewNoteDialog(content) {
        const title = prompt("Enter note title:") || "Quick Note";
        fetch(`http://localhost:8081/api/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, sessionId: currentSessionId, title, content, color: '#FFFDE7', tags: '' })
        }).then(() => loadNotes()).catch(e => console.error(e));
    }

    window.deleteNoteApi = async (noteId) => {
        if (confirm("Delete note?")) {
            await fetch(`http://localhost:8081/api/notes/${noteId}`, { method: 'DELETE' });
            loadNotes();
        }
    };

    loadHistory(); // Load on boot
});