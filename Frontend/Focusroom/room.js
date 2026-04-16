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
    let sessionStartTime = null; // wall-clock timestamp when reading starts

    document.getElementById('startReadingBtn').addEventListener('click', () => {
        const duration = parseInt(document.getElementById('timeInput').value) || 30;
        tabSwitchCount = 0;
        sessionStartTime = Date.now(); // record the exact moment reading starts
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
        isConfirming = true;
        const confirmed = confirm("Are you sure you want to stop this study session early?");
        isConfirming = false;

        if (confirmed) {
            const elapsedMs = sessionStartTime ? Date.now() - sessionStartTime : 0;
            const actualMins = Math.max(1, Math.round(elapsedMs / 60000));
            sessionStartTime = null;

            console.log('[Stop Session] elapsedMs:', elapsedMs, '| actualMins to send:', actualMins, '| sessionId:', currentSessionId);

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
                })
                .then(res => {
                    console.log('[Stop Session] Server response status:', res.status, res.ok ? '✅ OK' : '❌ FAILED');
                    if (!res.ok) res.text().then(t => console.error('[Stop Session] Error body:', t));
                })
                .catch(err => console.error('[Stop Session] Network error:', err));
            } else {
                console.warn('[Stop Session] No currentSessionId — session was never generated, nothing saved.');
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
    document.addEventListener('mousedown', (e) => {
        const btn = document.getElementById('floatingNoteBtn');
        if (btn && e.target.id !== 'floatingNoteBtn') btn.remove();
    });

    const aiContentEl = document.getElementById('aiContent');
    aiContentEl.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > 10) {
            selectedTextContext = text;
            document.getElementById('highlightPreview').textContent = text.length > 30 ? text.substring(0, 30) + '...' : text;
            document.getElementById('tutorControls').style.display = 'block';
            document.getElementById('explanationBox').innerHTML = "";

            // Create floating button positioned at end of selection
            let btn = document.getElementById('floatingNoteBtn');
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'floatingNoteBtn';
                btn.className = 'floating-add-btn';
                btn.innerHTML = '<i class="fas fa-plus"></i> Add to Notes';
                document.body.appendChild(btn);
            }

            // Fix: use fixed positioning relative to viewport
            const range = selection.getRangeAt(0).getBoundingClientRect();
            btn.style.position = 'fixed';
            btn.style.top = `${range.bottom + 8}px`;
            btn.style.left = `${range.left}px`;

            btn.onclick = () => {
                navNotes.click();
                openNoteEditor(text);   // Open the proper editor, not a prompt()
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

            document.getElementById('totalHoursStat').textContent = data.totalMins + ' mins';
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
        const todayKey = today.toISOString().split('T')[0];
        const start = new Date(today);
        start.setFullYear(today.getFullYear() - 1);

        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            let mins = dayMap[key] || 0;
            const isToday = key === todayKey;

            // Always light up today — at least level-1 so the current day is visible
            let lvl = 0;
            if (mins > 0) lvl = 1;
            if (mins >= 30) lvl = 2;
            if (mins >= 60) lvl = 3;
            if (mins >= 120) lvl = 4;
            if (isToday && lvl === 0) lvl = 1;

            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${lvl}${isToday ? ' today' : ''}`;
            cell.title = isToday
                ? `Today (${key}): ${mins} mins`
                : `${key}: ${mins} mins`;
            grid.appendChild(cell);
        }
    }

    // 7. Full Notes System
    let allNotes = [];             // In-memory cache for search/filter
    let editingNoteId = null;       // null = new note, number = editing existing
    let selectedNoteColor = '#FFFDE7'; // Default yellow
    const NOTES_API = 'http://localhost:8081/api/notes';

    // --- Load & Render ---
    async function loadNotes() {
        const container = document.getElementById('notesList');
        container.innerHTML = '<div class="notes-loading"><i class="fas fa-spinner fa-spin"></i> Loading notes...</div>';
        try {
            const res = await fetch(`${NOTES_API}/user/${userId}`);
            if (!res.ok) throw new Error('Server error');
            allNotes = await res.json();
            renderNotes(allNotes);
        } catch (e) {
            container.innerHTML = '<div class="notes-empty"><i class="fas fa-exclamation-circle"></i><p>Could not load notes. Is the server running?</p></div>';
        }
    }

    function renderNotes(notes) {
        const container = document.getElementById('notesList');
        // Pinned notes always appear first
        const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        if (sorted.length === 0) {
            container.innerHTML = `
                <div class="notes-empty">
                    <i class="fas fa-pen-nib"></i>
                    <p>No notes yet. Highlight content or click <strong>New Note</strong> to start.</p>
                </div>`;
            return;
        }

        container.innerHTML = sorted.map(n => `
            <div class="note-card ${n.pinned ? 'pinned' : ''}" style="background: ${n.color || '#FFFDE7'}" data-id="${n.id}">
                ${n.pinned ? '<div class="pin-badge"><i class="fas fa-thumbtack"></i></div>' : ''}
                <div class="note-header">
                    <span class="note-title">${escHtml(n.title || 'Untitled')}</span>
                    <div class="note-actions">
                        <button class="note-edit-btn" onclick="editNoteById(${n.id})" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="delete-btn" onclick="deleteNoteApi(${n.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="note-body">${escHtml(n.content || '')}</div>
                ${n.tags ? `<div class="note-tags">${n.tags.split(',').map(t => `<span class="tag-chip">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
                <div class="note-date">${formatDate(n.updatedAt || n.createdAt)}</div>
            </div>
        `).join('');
    }

    // --- Editor Panel Logic ---
    function openNoteEditor(prefillContent = '', noteId = null) {
        editingNoteId = noteId;
        selectedNoteColor = '#FFFDE7';

        document.getElementById('editorPanelTitle').textContent = noteId ? 'Edit Note' : 'New Note';
        document.getElementById('noteEditorTitle').value = '';
        document.getElementById('noteEditorContent').value = prefillContent;
        document.getElementById('noteEditorTags').value = '';
        document.getElementById('noteEditorPinned').checked = false;

        // If editing an existing note, prefill all fields
        if (noteId) {
            const n = allNotes.find(x => x.id === noteId);
            if (n) {
                document.getElementById('noteEditorTitle').value = n.title || '';
                document.getElementById('noteEditorContent').value = n.content || '';
                document.getElementById('noteEditorTags').value = n.tags || '';
                document.getElementById('noteEditorPinned').checked = n.pinned || false;
                selectedNoteColor = n.color || '#FFFDE7';
            }
        }

        // Update swatch UI
        document.querySelectorAll('.swatch').forEach(s => {
            s.classList.toggle('selected', s.dataset.color === selectedNoteColor);
        });

        document.getElementById('noteEditorOverlay').classList.add('active');
        document.getElementById('noteEditorPanel').classList.add('open');
        document.getElementById('noteEditorContent').focus();
    }

    function closeNoteEditor() {
        document.getElementById('noteEditorOverlay').classList.remove('active');
        document.getElementById('noteEditorPanel').classList.remove('open');
        editingNoteId = null;
    }

    async function saveNote() {
        const title = document.getElementById('noteEditorTitle').value.trim() || 'Quick Note';
        const content = document.getElementById('noteEditorContent').value.trim();
        const tags = document.getElementById('noteEditorTags').value.trim();
        const pinned = document.getElementById('noteEditorPinned').checked;

        if (!content) { alert('Please write something in your note!'); return; }

        const payload = { userId, sessionId: currentSessionId, title, content, color: selectedNoteColor, tags, pinned };
        const saveBtn = document.getElementById('saveNoteBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            let res;
            if (editingNoteId) {
                res = await fetch(`${NOTES_API}/${editingNoteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(NOTES_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) {
                // Surface the actual server error so it's debuggable
                const errText = await res.text();
                console.error('Save note failed:', res.status, errText);
                alert(`Save failed (${res.status}): ${errText || 'Unknown server error'}`);
                return;   // Keep editor open — do not close
            }

            closeNoteEditor();
            await loadNotes();

        } catch (e) {
            console.error('Network error saving note:', e);
            alert('Could not reach the server. Make sure Spring Boot is running on port 8081.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Note';
        }
    }

    // --- Color swatches ---
    document.querySelectorAll('.swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            selectedNoteColor = swatch.dataset.color;
        });
    });

    // --- Search ---
    document.getElementById('notesSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const activeColor = document.querySelector('.color-chip.active')?.dataset.color;
        let filtered = allNotes.filter(n =>
            (n.title || '').toLowerCase().includes(query) ||
            (n.content || '').toLowerCase().includes(query) ||
            (n.tags || '').toLowerCase().includes(query)
        );
        if (activeColor && activeColor !== 'all') {
            filtered = filtered.filter(n => n.color === activeColor);
        }
        renderNotes(filtered);
    });

    // --- Color filter chips ---
    document.getElementById('colorFilters').addEventListener('click', (e) => {
        const chip = e.target.closest('.color-chip');
        if (!chip) return;
        document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const color = chip.dataset.color;
        const query = document.getElementById('notesSearch').value.toLowerCase();
        let filtered = color === 'all' ? allNotes : allNotes.filter(n => n.color === color);
        if (query) filtered = filtered.filter(n =>
            (n.title || '').toLowerCase().includes(query) ||
            (n.content || '').toLowerCase().includes(query)
        );
        renderNotes(filtered);
    });

    // --- Button event bindings ---
    document.getElementById('newNoteBtn').addEventListener('click', () => openNoteEditor());
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('closeEditorBtn').addEventListener('click', closeNoteEditor);
    document.getElementById('cancelNoteBtn').addEventListener('click', closeNoteEditor);
    document.getElementById('noteEditorOverlay').addEventListener('click', closeNoteEditor);

    // Make editNoteById & deleteNoteApi globally accessible (called from inline onclick)
    window.editNoteById = (id) => openNoteEditor('', id);

    window.deleteNoteApi = async (noteId) => {
        if (confirm("Delete this note?")) {
            await fetch(`${NOTES_API}/${noteId}`, { method: 'DELETE' });
            loadNotes();
        }
    };

    // Compatibility: old createNewNoteDialog used by floating button fallback
    function createNewNoteDialog(content) {
        openNoteEditor(content);
    }

    // --- Utility helpers ---
    function escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }


    loadHistory(); // Load on boot
});