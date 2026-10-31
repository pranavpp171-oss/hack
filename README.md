# ⚡ CAMPUS PULSE

> *"Never Miss What's Happening on Campus."*

**Campus Pulse** is a complete, full-stack, AI-powered college announcement management platform designed for college students and faculty. It aggregates unstructured WhatsApp forwards, messy emails, notice-board posters, and examination bulletins, uses **Google Gemini AI** to extract structured metadata, and organizes everything into a modern, centralized SaaS dashboard.

---

## 🎯 The Problem
College students receive announcements through dozens of unorganized WhatsApp group chats, forwarded messages, official department emails, and physical posters. As a result:
- Important hackathon, scholarship, and competition deadlines are routinely missed.
- Examination timetables and viva dates get buried under chat forwards.
- Crucial event information (exact times, venues, registration links) is often missing or vague.
- The same message gets forwarded repeatedly across multiple groups, causing clutter and confusion.

---

## 💡 The Solution
Campus Pulse turns chaotic unstructured campus messages into actionable intelligence:
1. **AI Smart Notice Extractor**: Paste raw WhatsApp forwards; Google Gemini AI extracts titles, dates, times, venues, categories, registration deadlines, and instructions.
2. **Innovative Duplicate Detection Engine**: Compares incoming notices with existing database records using semantic and title-venue-date matching, warning users before duplicate clutter is saved.
3. **Missing Information Detection**: Automatically highlights missing critical fields (e.g., missing venue or start time) so students know to verify before attending.
4. **Smart Priority System**: Dynamically calculates urgency:
   - 🔴 **RED / URGENT**: Deadlines or events happening within 24 hours.
   - 🟡 **YELLOW / UPCOMING**: Deadlines or events within 7 days.
   - 🟢 **GREEN / NORMAL**: Standard announcements occurring later.
   - ⚪ **GREY / EXPIRED**: Completed or past events.
5. **Interactive Smart Calendar**: Monthly and weekly interactive views with color-coded categories, event drawers, and date-based filtering.
6. **"WHAT DO I NEED TO KNOW THIS WEEK?" (AI Weekly Summary)**: One-click executive briefing powered by Gemini summarizing all active deadlines, workshops, and exams for the current week.
7. **Full Announcements Management**: Real-time multi-criteria search, category filters, timeline filters, in-place editing, and database deletion.

---

## 🛠️ Technology Stack
- **Frontend**: Responsive Single-Page Application (HTML5, Tailwind CSS, Lucide Icons, Modern SaaS UI, Dark & Light Mode Support).
- **Backend**: Node.js & Express.js architecture with modular RESTful APIs.
- **Database**: SQLite with Write-Ahead Logging (WAL mode) for instant zero-config local persistence via `better-sqlite3`.
- **AI Core**: Google Gemini API (`gemini-1.5-flash`), with prompt engineering for structured JSON schemas, date-relative reasoning (`Asia/Kolkata` reference timezone), duplicate detection, and a high-fidelity Demo Mode if an API key is not yet configured.

---

## 🚀 How to Run Locally

### Option A: Double-Click Startup (Easiest)
Simply double-click `start.bat` in the project folder!

### Option B: PowerShell
Run the following in PowerShell:
```powershell
.\start.ps1
```
Or directly:
```powershell
.\tools\node\node.exe server\src\index.js
```

Then open your browser and navigate to:
👉 **`http://localhost:5000`**

---

## 🔑 Configuring Google Gemini API (Optional)
Campus Pulse features an **intelligent built-in Demo Engine** that works immediately without any external API keys for demonstration purposes.

To connect live **Google Gemini 1.5 Flash**:
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Either:
   - Go to the **Settings** tab in the web interface and paste your key, OR
   - Edit `server/.env` and set:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
3. The AI status badge in the sidebar will immediately switch to **Online (Live Gemini AI)**.

---

## 🧪 Testing the Innovative Features
1. **AI Notice Extractor**:
   - Open the "Notice Extractor" tab.
   - Click one of the **Instant Demo Templates** (e.g. *Hackathon WhatsApp Broadcast* or *Incomplete Workshop Notice*).
   - Click **"Extract with AI"**.
   - Notice how Gemini extracts all fields, detects missing venue/time info, and checks for duplicates.
   - Click **"Save to Campus Pulse"** to save to the database.
2. **Duplicate Detection Warning**:
   - In the Extractor, click the template **"Duplicate Notice Forward"** and click **"Extract with AI"**.
   - Watch the amber warning alert trigger: *"Possible Duplicate Announcement Detected (85% Match) Matches existing announcement: CodeX 2026..."* with options to Keep Both, Merge Details, or Dismiss.
3. **Weekly AI Briefing**:
   - Open **"Weekly AI Summary"**.
   - Click **"Generate AI Weekly Briefing"**.
   - Gemini compiles an executive briefing categorizing Important Deadlines, Upcoming Events, and General Notices.
4. **Smart Calendar**:
   - Navigate to **"Smart Calendar"**.
   - Filter by categories, jump between months, or click any event to view the full details drawer.
5. **Theme Switcher**:
   - Click the sun/moon icon in the top header to toggle between Dark Navy and Modern Light mode.

---

## 📂 Project Structure
```
c:\Users\Lenovo\Desktop\Hack\
├── server\
│   ├── data\
│   │   └── campuspulse.db       # Persistent SQLite WAL database
│   ├── public\
│   │   ├── index.html           # Modern SaaS dashboard interface
│   │   ├── app.js               # Reactive frontend application engine
│   │   └── styles.css           # Custom animations, glassmorphism & themes
│   ├── src\
│   │   ├── routes\
│   │   │   ├── announcements.js # CRUD & filtering endpoints
│   │   │   ├── ai.js            # Gemini extraction & duplicate routes
│   │   │   └── stats.js         # Dashboard statistics & health
│   │   ├── services\
│   │   │   └── gemini.js        # Google Gemini AI & heuristic fallback engine
│   │   ├── db.js                # SQLite schema, priority & duplicate algorithms
│   │   ├── seed.js              # 8+ realistic college announcement samples
│   │   └── index.js             # Express server entry point
│   ├── .env                     # Server environment variables
│   ├── .env.example             # Example environment template
│   └── package.json             # Server dependencies
├── tools\
│   └── node\                    # Portable Node.js v20 runtime
├── package.json                 # Root npm scripts
├── start.bat                    # 1-click Windows launcher
├── start.ps1                    # 1-click PowerShell launcher
└── README.md                    # Project documentation
```

