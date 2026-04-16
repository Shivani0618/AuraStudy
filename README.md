#  Aura Study — Full Stack AI Study Platform

**Aura Study** is a comprehensive virtual study environment that bridges the gap between generative AI and behavioral focus tracking. Built with **Java Spring Boot**, **PostgreSQL**, and **Vanilla JS**, it allows students to generate customized study materials via the **Gemini 2.5 Flash API** and study within a strictly enforced, distraction-free "Sanctuary Mode".

##  Key Features

* **AI Session Generation:** Transform topics or uploaded PDFs/Images into structured, university-grade study sessions using the Gemini 2.5 Flash API.
* **Sanctuary Mode:** Enters browser fullscreen and utilizes the Page Visibility API to detect tab-switching, providing real-time focus accountability.
* **AI Assistant (Tutor):** Real-time, context-aware tutoring that provides explanations for highlighted text within the study pane.
* **Knowledge Capture (Notes):** One-click note creation with breadcrumbs linking back to the original source session.
* **Analytics Heatmap:** GitHub-style contribution calendar to track study consistency, streaks, and total hours.

##  Tech Stack

* **Backend:** Java Spring Boot 3.x, Spring Security, Spring Data JPA.
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Database:** PostgreSQL.
* **AI:** Google Gemini 2.5 Flash API.
* **File Parsing:** Apache PDFBox.
* **Security:** JWT-based stateless authentication with Refresh Token rotation.



## WorkFlow Implementation

```text
aura-study/
├── Phase 1: Authentication Gate
│   ├── User Login/Signup      # Client sends credentials via Fetch API
│   ├── JWT Generation         # Backend issues Access & Refresh tokens
│   └── Secure Storage         # Tokens saved in LocalStorage for API headers
│
├── Phase 2: AI Content Synthesis
│   ├── Input Processing       # User provides topic and optional PDF/Image
│   ├── Multi-modal Parsing    # Apache PDFBox extracts text from documents
│   └── Gemini Integration     # Backend calls gemini-1.5-flash for study plan
│
├── Phase 3: Focused Study Session
│   ├── Sanctuary Mode         # Enters Fullscreen via Browser API
│   ├── Real-time Monitoring   # Visibility API detects and logs tab-switching
│   └── Contextual Tutoring    # Highlight text to trigger Gemini AI Assistant
│
└── Phase 4: Data Persistence & Analytics
    ├── Session Recording      # Actual minutes and distraction counts saved to DB
    ├── Knowledge Management   # Captured text saved as linked notes in PostgreSQL
    └── Progress Visualization  # GitHub-style Heatmap updates study intensity
