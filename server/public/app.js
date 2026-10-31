/**
 * Campus Pulse - Frontend Application Engine
 * Pure Vanilla JavaScript with Tailwind, Lucide, and modern reactive UI patterns.
 */

// Application State
const state = {
  currentRoute: 'dashboard',
  announcements: [],
  stats: null,
  health: null,
  isLoading: false,
  theme: localStorage.getItem('cp_theme') || 'dark',
  calendarView: 'month', // 'month' | 'week'
  calendarDate: new Date(),
  selectedCategory: 'All',
  announcementFilters: {
    search: '',
    category: 'All',
    priority: 'All',
    timeline: 'all',
    sort: 'newest'
  },
  extractor: {
    rawText: '',
    extractedData: null,
    duplicates: [],
    isExtracting: false,
    isSaving: false,
    showDuplicateBanner: true,
  },
  weeklySummary: {
    data: null,
    isGenerating: false,
  }
};

// Category Colors & Styling Configurations
const CATEGORY_STYLES = {
  'Competitions': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    calendar: 'bg-amber-600/80 text-white',
    icon: 'trophy'
  },
  'Workshops': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    calendar: 'bg-purple-600/80 text-white',
    icon: 'wrench'
  },
  'Examinations': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    calendar: 'bg-rose-600/80 text-white',
    icon: 'file-text'
  },
  'Assignments': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    calendar: 'bg-cyan-600/80 text-white',
    icon: 'check-square'
  },
  'Seminars': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    calendar: 'bg-emerald-600/80 text-white',
    icon: 'presentation'
  },
  'Sports': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    calendar: 'bg-blue-600/80 text-white',
    icon: 'activity'
  },
  'Events': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    calendar: 'bg-indigo-600/80 text-white',
    icon: 'calendar'
  },
  'General Notices': {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    calendar: 'bg-slate-600/80 text-white',
    icon: 'bell'
  }
};

const CATEGORIES = [
  'Events',
  'Workshops',
  'Competitions',
  'Examinations',
  'Assignments',
  'Seminars',
  'Sports',
  'General Notices'
];

// Sample Templates for 1-Click Hackathon Testing
const SAMPLE_TEMPLATES = [
  {
    name: 'Hackathon WhatsApp Broadcast',
    icon: 'code-2',
    text: `Hey guys! Our annual coding competition CodeX 2026 is happening on 15 November at 10 AM in the Computer Science Auditorium. Registration closes on 10 November. Interested students should register ASAP. Teams of 3-4 students. Cash prize pool ₹1,50,000!`
  },
  {
    name: 'Incomplete Workshop Notice',
    icon: 'help-circle',
    text: `Tomorrow we have a workshop on Autonomous Drone Robotics in college. Everyone interested should attend! Hands-on kits provided.`
  },
  {
    name: 'Urgent Exam Timetable Notice',
    icon: 'alert-triangle',
    text: `URGENT NOTICE: Mid-Semester Theory Examinations for 3rd Year B.Tech starts tomorrow at 9:30 AM in Exam Hall Complex (Blocks B & D). Hall tickets are strictly mandatory. No entry without signed physical admit cards.`
  },
  {
    name: 'Duplicate Notice Forward',
    icon: 'copy',
    text: `Forwarded message: Don't forget CodeX 2026 annual coding hackathon on 15 November, 10 AM at CS Auditorium! Hurry up and submit your teams before 10 November deadline.`
  }
];

// Toast System
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'error') iconName = 'alert-octagon';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0 ${
      type === 'success' ? 'text-emerald-400' :
      type === 'error' ? 'text-rose-400' :
      type === 'warning' ? 'text-amber-400' : 'text-blue-400'
    }"></i>
    <div class="flex-1 text-xs leading-relaxed font-medium">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// API Client
const api = {
  async getAnnouncements(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.timeline && filters.timeline !== 'all') params.append('timeline', filters.timeline);
    if (filters.sort) params.append('sort', filters.sort);

    const res = await fetch(`/api/announcements?${params.toString()}`);
    return await res.json();
  },

  async getAnnouncementById(id) {
    const res = await fetch(`/api/announcements/${id}`);
    return await res.json();
  },

  async createAnnouncement(data) {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async updateAnnouncement(id, data) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async deleteAnnouncement(id) {
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  async getStats() {
    const res = await fetch('/api/stats');
    return await res.json();
  },

  async getHealth() {
    const res = await fetch('/api/health');
    return await res.json();
  },

  async extractWithAI(text, referenceDate) {
    const res = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, referenceDate }),
    });
    return await res.json();
  },

  async getWeeklySummary() {
    const res = await fetch('/api/ai/weekly-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return await res.json();
  },

  async saveApiKey(key) {
    const res = await fetch('/api/settings/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return await res.json();
  },

  async reseedDatabase() {
    const res = await fetch('/api/seed', { method: 'POST' });
    return await res.json();
  }
};

// UI Helpers
function renderPriorityBadge(priority) {
  switch (priority) {
    case 'RED':
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span class="w-2 h-2 rounded-full bg-rose-500 pulse-urgent"></span>
          URGENT (24H)
        </span>
      `;
    case 'YELLOW':
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          UPCOMING
        </span>
      `;
    case 'GREEN':
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          NORMAL
        </span>
      `;
    case 'GREY':
    default:
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/40 text-slate-400 border border-slate-600/30">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          EXPIRED
        </span>
      `;
  }
}

function renderCategoryBadge(category) {
  const conf = CATEGORY_STYLES[category] || CATEGORY_STYLES['General Notices'];
  return `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${conf.badge}">
      <i data-lucide="${conf.icon}" class="w-3.5 h-3.5"></i>
      ${category}
    </span>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Router and Navigation
function navigate(route) {
  state.currentRoute = route;

  // Update active sidebar styles
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-indigo-600/20', 'text-indigo-400', 'border-indigo-500/30', 'border');
  });

  const activeBtn = document.getElementById(`nav-${route}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-indigo-600/20', 'text-indigo-400', 'border-indigo-500/30', 'border');
  }

  const container = document.getElementById('main-content');
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs text-slate-400 font-medium">Loading ${route}...</span>
      </div>
    </div>
  `;

  setTimeout(() => {
    switch (route) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'extractor':
        renderExtractor();
        break;
      case 'calendar':
        renderCalendar();
        break;
      case 'announcements':
        renderAnnouncements();
        break;
      case 'weekly':
        renderWeeklySummary();
        break;
      case 'settings':
        renderSettings();
        break;
      default:
        renderDashboard();
    }
    lucide.createIcons();
  }, 50);
}

// ----------------------------------------------------
// 1. DASHBOARD VIEW
// ----------------------------------------------------
async function renderDashboard() {
  const container = document.getElementById('main-content');

  try {
    const [statsRes, announcementsRes] = await Promise.all([
      api.getStats(),
      api.getAnnouncements({ limit: 8, timeline: 'upcoming', sort: 'urgent_first' })
    ]);

    const stats = statsRes.data || { total: 0, upcoming: 0, urgentCount: 0, eventsThisWeek: 0, todaysHighlights: [] };
    const upcomingList = announcementsRes.data || [];
    const recentRes = await api.getAnnouncements({ sort: 'newest' });
    const recentList = (recentRes.data || []).slice(0, 5);

    // Update sidebar total badge
    const badgeEl = document.getElementById('nav-badge-total');
    if (badgeEl) badgeEl.textContent = stats.total;

    container.innerHTML = `
      <div class="space-y-8 animate-fade-in max-w-7xl mx-auto">
        <!-- Hero Welcome Banner -->
        <div class="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40 border border-slate-800 shadow-2xl">
          <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                AI-Driven Campus Intelligence
              </div>
              <h2 class="text-3xl font-extrabold tracking-tight text-white mb-2">
                Welcome to Campus Pulse
              </h2>
              <p class="text-slate-400 text-sm max-w-xl leading-relaxed">
                "Never Miss What's Happening on Campus." All unstructured WhatsApp forwards, notices, and exam timetables converted into organized action items.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <button onclick="navigate('extractor')" class="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95">
                <i data-lucide="scan-text" class="w-4 h-4"></i>
                Extract Notice with AI
              </button>
              <button onclick="navigate('weekly')" class="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 transition-all active:scale-95">
                <i data-lucide="newspaper" class="w-4 h-4 text-emerald-400"></i>
                Weekly AI Briefing
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Statistics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Total Announcements -->
          <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Notices</span>
              <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <i data-lucide="bell" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-white">${stats.total}</span>
              <span class="text-xs text-slate-500">active records</span>
            </div>
          </div>

          <!-- Upcoming Events -->
          <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Events</span>
              <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <i data-lucide="calendar" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-purple-400">${stats.upcoming}</span>
              <span class="text-xs text-slate-500">scheduled</span>
            </div>
          </div>

          <!-- Urgent Deadlines (RED) -->
          <div class="glass-card rounded-2xl p-5 relative overflow-hidden border-rose-500/30">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-500 pulse-urgent"></span>
                Urgent Deadlines
              </span>
              <div class="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-rose-400">${stats.urgentCount}</span>
              <span class="text-xs text-rose-400/80 font-medium">&lt; 24h deadline</span>
            </div>
          </div>

          <!-- Events This Week -->
          <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Events This Week</span>
              <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <i data-lucide="zap" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-3xl font-extrabold text-cyan-400">${stats.eventsThisWeek}</span>
              <span class="text-xs text-slate-500">this Monday-Sunday</span>
            </div>
          </div>
        </div>

        <!-- Today's Highlights Section -->
        <div class="glass-card rounded-2xl p-6 border-indigo-500/20">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></div>
              <h3 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Today's Highlights
                <span class="text-xs font-normal text-slate-400">(${formatDate(new Date().toISOString())})</span>
              </h3>
            </div>
            <button onclick="navigate('calendar')" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              Open Calendar <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          ${stats.todaysHighlights && stats.todaysHighlights.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${stats.todaysHighlights.map(item => `
                <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between cursor-pointer" onclick="openDetailsModal(${item.id})">
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                      ${renderCategoryBadge(item.category)}
                      ${renderPriorityBadge(item.priority)}
                    </div>
                    <h4 class="text-sm font-bold text-white mb-1 line-clamp-1">${item.title}</h4>
                    <p class="text-xs text-slate-400 line-clamp-2">${item.description}</p>
                  </div>
                  <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3 text-indigo-400"></i> ${item.start_time || 'Time TBA'}</span>
                    <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3 text-purple-400"></i> ${item.venue || 'TBA'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="py-6 px-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
              <i data-lucide="sun" class="w-8 h-8 text-amber-400/80 mx-auto mb-2"></i>
              <p class="text-xs font-medium text-slate-300">No scheduled exams or deadlines for today.</p>
              <p class="text-[11px] text-slate-500 mt-0.5">Check upcoming events below to plan ahead!</p>
            </div>
          `}
        </div>

        <!-- 2 Column Layout: Upcoming Events & Urgent Deadlines Feed -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Upcoming Events Column (2/3 width) -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="calendar-days" class="w-4 h-4 text-purple-400"></i>
                Upcoming Campus Events
              </h3>
              <button onclick="navigate('announcements')" class="text-xs text-slate-400 hover:text-white transition-colors">
                View all (${stats.upcoming})
              </button>
            </div>

            <div class="space-y-3">
              ${upcomingList.length > 0 ? upcomingList.map(item => `
                <div class="glass-card rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onclick="openDetailsModal(${item.id})">
                  <div class="space-y-1.5 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      ${renderCategoryBadge(item.category)}
                      ${renderPriorityBadge(item.priority)}
                      ${item.missing_information && item.missing_information.length > 0 ? `
                        <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Missing info (${item.missing_information.length})
                        </span>
                      ` : ''}
                    </div>
                    <h4 class="text-sm font-bold text-white hover:text-indigo-300 transition-colors">${item.title}</h4>
                    <p class="text-xs text-slate-400 line-clamp-1">${item.description}</p>
                    <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span class="flex items-center gap-1.5">
                        <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400"></i>
                        ${formatDate(item.event_date)}
                      </span>
                      <span class="flex items-center gap-1.5">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-purple-400"></i>
                        ${item.start_time || 'Time TBA'}
                      </span>
                      <span class="flex items-center gap-1.5">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-cyan-400"></i>
                        ${item.venue || 'TBA'}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 sm:self-center">
                    <button onclick="event.stopPropagation(); openDetailsModal(${item.id})" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all">
                      Details
                    </button>
                  </div>
                </div>
              `).join('') : `
                <div class="p-8 text-center glass-card rounded-2xl text-slate-500 text-xs">
                  No upcoming events registered. Paste a new notice using AI Extractor!
                </div>
              `}
            </div>
          </div>

          <!-- Right Column: Urgent Notifications & Category Breakdown (1/3 width) -->
          <div class="space-y-6">
            <!-- Urgent Deadlines Highlight Box -->
            <div class="glass-card rounded-2xl p-5 border-rose-500/25">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="flame" class="w-4 h-4 text-rose-400"></i>
                  Urgent Actions Required
                </h3>
                <span class="px-2 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  ${stats.urgentCount} Urgent
                </span>
              </div>
              <div class="mt-3 space-y-3">
                ${upcomingList.filter(item => item.priority === 'RED').length > 0 ? 
                  upcomingList.filter(item => item.priority === 'RED').slice(0, 3).map(item => `
                    <div class="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/50 cursor-pointer transition-all" onclick="openDetailsModal(${item.id})">
                      <div class="flex items-center justify-between text-[11px] mb-1">
                        <span class="font-semibold text-rose-300">${item.category}</span>
                        <span class="text-rose-400 font-bold">${item.registration_deadline ? 'Deadline: ' + formatDate(item.registration_deadline) : 'Happening Soon'}</span>
                      </div>
                      <h5 class="text-xs font-bold text-white line-clamp-1">${item.title}</h5>
                      <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">${item.venue || 'Venue TBA'}</p>
                    </div>
                  `).join('') : `
                    <div class="py-4 text-center text-xs text-slate-400">
                      No urgent 24-hour deadlines pending!
                    </div>
                  `
                }
              </div>
            </div>

            <!-- Category Distribution Analytics -->
            <div class="glass-card rounded-2xl p-5">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Campus Activity Split</span>
                <i data-lucide="pie-chart" class="w-4 h-4 text-indigo-400"></i>
              </h3>
              <div class="space-y-2.5">
                ${Object.entries(stats.categoryCounts || {}).map(([cat, count]) => {
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES['General Notices'];
                  return `
                    <div>
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-slate-300 font-medium">${cat}</span>
                        <span class="text-slate-500 font-mono">${count} (${percent}%)</span>
                      </div>
                      <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width: ${percent}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Recently Added Notices -->
            <div class="glass-card rounded-2xl p-5">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <i data-lucide="history" class="w-4 h-4 text-cyan-400"></i>
                Recently Saved
              </h3>
              <div class="space-y-2 text-xs">
                ${recentList.map(item => `
                  <div class="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-between" onclick="openDetailsModal(${item.id})">
                    <span class="text-slate-200 font-medium truncate max-w-[180px]">${item.title}</span>
                    <span class="text-[10px] text-slate-500">${formatDate(item.created_at)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
  } catch (err) {
    console.error('Failed to render dashboard:', err);
    container.innerHTML = `
      <div class="p-8 text-center glass-card rounded-2xl text-rose-400 text-sm">
        Failed to load dashboard data. Ensure server is active.
      </div>
    `;
  }
}

// ----------------------------------------------------
// 2. AI SMART NOTICE EXTRACTOR VIEW (CORE FEATURE)
// ----------------------------------------------------
function renderExtractor() {
  const container = document.getElementById('main-content');
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-2">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            Gemini AI Extraction Engine
          </div>
          <h2 class="text-2xl font-extrabold text-white">AI Smart Notice Extractor</h2>
          <p class="text-xs text-slate-400 mt-1">
            Paste messy WhatsApp group forwards, posters, or emails. AI will extract title, dates, venues, deadlines, and detect duplicate announcements.
          </p>
        </div>
      </div>

      <!-- Quick Template Pills for Hackathon Judges & Testing -->
      <div class="glass-card rounded-2xl p-4">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
          🚀 Instant Demo Templates (Click to fill):
        </span>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          ${SAMPLE_TEMPLATES.map((tmpl, idx) => `
            <button 
              type="button"
              onclick="loadSampleTemplate(${idx})"
              class="p-2.5 text-left rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-xs group"
            >
              <div class="flex items-center gap-2 font-semibold text-slate-300 group-hover:text-indigo-300 mb-1">
                <i data-lucide="${tmpl.icon}" class="w-3.5 h-3.5 text-indigo-400"></i>
                <span class="truncate">${tmpl.name}</span>
              </div>
              <p class="text-[10px] text-slate-500 line-clamp-1 font-mono">${tmpl.text}</p>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Input Textarea & Extract Action -->
      <div class="glass-card rounded-3xl p-6 relative">
        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Paste Raw Announcement / WhatsApp Forward
        </label>
        <textarea 
          id="extractor-raw-text"
          rows="6"
          placeholder="Paste message here... e.g. 'Hey guys! Our annual coding competition CodeX 2026 is happening on 15 November at 10 AM in the Computer Science Auditorium. Registration closes on 10 November.'"
          class="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed resize-y"
        >${state.extractor.rawText || ''}</textarea>

        <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>Reference Date:</span>
            <input 
              type="date" 
              id="extractor-ref-date"
              value="${todayStr}"
              class="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
            <span class="text-[10px] text-slate-500">(Asia/Kolkata)</span>
          </div>

          <button 
            id="extract-btn"
            onclick="handleExtractNotice()"
            class="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <i data-lucide="sparkles" class="w-4 h-4 text-indigo-200"></i>
            <span>Extract with AI</span>
          </button>
        </div>
      </div>

      <!-- Dynamic Extracted Result Output Area -->
      <div id="extractor-result-container">
        ${state.extractor.extractedData ? renderExtractedCard(state.extractor.extractedData) : ''}
      </div>
    </div>
  `;

  lucide.createIcons();
}

function loadSampleTemplate(idx) {
  const tmpl = SAMPLE_TEMPLATES[idx];
  if (!tmpl) return;
  const textarea = document.getElementById('extractor-raw-text');
  if (textarea) {
    textarea.value = tmpl.text;
    state.extractor.rawText = tmpl.text;
  }
  showToast(`Loaded "${tmpl.name}" template. Click "Extract with AI" to test!`, 'info');
}

async function handleExtractNotice() {
  const text = document.getElementById('extractor-raw-text').value;
  const refDate = document.getElementById('extractor-ref-date').value;

  if (!text || !text.trim()) {
    showToast('Please paste announcement text before extracting.', 'warning');
    return;
  }

  state.extractor.rawText = text;
  const btn = document.getElementById('extract-btn');
  const resultContainer = document.getElementById('extractor-result-container');

  // Loading animation state
  btn.disabled = true;
  btn.innerHTML = `
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span>Analyzing with Gemini AI...</span>
  `;

  resultContainer.innerHTML = `
    <div class="p-8 glass-card rounded-3xl ai-shimmer border-indigo-500/30 text-center space-y-3">
      <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
        <i data-lucide="cpu" class="w-5 h-5 animate-spin"></i>
      </div>
      <h4 class="text-sm font-bold text-white">Gemini AI is parsing announcement details...</h4>
      <p class="text-xs text-slate-400 max-w-md mx-auto">
        Identifying dates, venues, categories, extracting registration deadlines, and checking for duplicate broadcasts.
      </p>
    </div>
  `;
  lucide.createIcons();

  try {
    const res = await api.extractWithAI(text, refDate);
    btn.disabled = false;
    btn.innerHTML = `
      <i data-lucide="sparkles" class="w-4 h-4 text-indigo-200"></i>
      <span>Extract with AI</span>
    `;

    if (!res.success) {
      showToast(res.error || 'Failed to extract announcement.', 'error');
      resultContainer.innerHTML = '';
      return;
    }

    state.extractor.extractedData = res.data;
    state.extractor.duplicates = res.duplicates || [];
    state.extractor.showDuplicateBanner = res.has_duplicates;

    resultContainer.innerHTML = renderExtractedCard(res.data, state.extractor.duplicates);
    lucide.createIcons();
    showToast('Notice extracted successfully! Review and save below.', 'success');
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `
      <i data-lucide="sparkles" class="w-4 h-4 text-indigo-200"></i>
      <span>Extract with AI</span>
    `;
    console.error(err);
    showToast('Network error while calling AI service.', 'error');
  }
}

function renderExtractedCard(data, duplicates = []) {
  const missingInfo = data.missing_information || [];
  const hasDuplicates = duplicates.length > 0 && state.extractor.showDuplicateBanner;

  return `
    <div class="space-y-6 animate-fade-in">
      <!-- Innovative Feature A: Duplicate Detection Warning Banner -->
      ${hasDuplicates ? `
        <div class="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3 shadow-lg">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </div>
              <div>
                <h4 class="text-sm font-bold text-amber-300">
                  Possible Duplicate Announcement Detected (${duplicates[0].confidence}% Match)
                </h4>
                <p class="text-xs text-amber-200/80 mt-1">
                  Matches existing announcement: <strong class="text-white">"${duplicates[0].existing.title}"</strong> on ${formatDate(duplicates[0].existing.event_date)}.
                </p>
                <div class="mt-2 text-[11px] text-amber-300/70 font-mono">
                  Reasons: ${duplicates[0].reasons.join(' • ')}
                </div>
              </div>
            </div>
            <button onclick="dismissDuplicateBanner()" class="text-amber-400 hover:text-white p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex items-center gap-3 pt-2 border-t border-amber-500/20">
            <button onclick="mergeWithDuplicate(${duplicates[0].existing.id})" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors">
              Merge Information
            </button>
            <button onclick="dismissDuplicateBanner()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors">
              Keep Both
            </button>
            <button onclick="openDetailsModal(${duplicates[0].existing.id})" class="text-xs text-amber-400 underline hover:text-amber-300 ml-auto">
              View Existing Notice
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Innovative Feature B: Missing Information Detection Alert -->
      ${missingInfo.length > 0 ? `
        <div class="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i data-lucide="help-circle" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Missing Information Alert
            </h4>
            <p class="text-xs text-slate-300 mt-1">
              Some important event details were not found in the raw text:
            </p>
            <div class="flex flex-wrap gap-2 mt-2">
              ${missingInfo.map(m => `
                <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ⚠️ ${m}
                </span>
              `).join('')}
            </div>
            <p class="text-[11px] text-slate-400 mt-2">
              You can manually enter these details below before saving.
            </p>
          </div>
        </div>
      ` : ''}

      <!-- Date Ambiguity Warning if any -->
      ${data.date_ambiguity ? `
        <div class="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-2.5 text-xs text-purple-300">
          <i data-lucide="info" class="w-4 h-4 text-purple-400 flex-shrink-0"></i>
          <span><strong>Date Note:</strong> ${data.date_ambiguity}</span>
        </div>
      ` : ''}

      <!-- Structured Editable Form Card -->
      <div class="glass-card rounded-3xl p-6 border-indigo-500/30 space-y-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>
            Extracted Structured Details
          </h3>
          <span class="text-xs text-slate-400 font-medium">Review and edit before saving</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <!-- Title -->
          <div class="md:col-span-2">
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Event Title *</label>
            <input 
              type="text" 
              id="field-title" 
              value="${escapeHtml(data.title || '')}"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
            >
          </div>

          <!-- Category -->
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Category *</label>
            <select 
              id="field-category"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
            >
              ${CATEGORIES.map(cat => `
                <option value="${cat}" ${data.category === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>

          <!-- Venue -->
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Venue</label>
            <input 
              type="text" 
              id="field-venue" 
              value="${escapeHtml(data.venue || 'TBA')}"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
            >
          </div>

          <!-- Event Date -->
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Event Date *</label>
            <input 
              type="date" 
              id="field-event-date" 
              value="${data.event_date || ''}"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
            >
          </div>

          <!-- Start Time & End Time -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Start Time</label>
              <input 
                type="text" 
                id="field-start-time" 
                placeholder="10:00 AM"
                value="${escapeHtml(data.start_time || '')}"
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
              >
            </div>
            <div>
              <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">End Time</label>
              <input 
                type="text" 
                id="field-end-time" 
                placeholder="04:00 PM"
                value="${escapeHtml(data.end_time || '')}"
                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
              >
            </div>
          </div>

          <!-- Registration Deadline -->
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Registration Deadline (if applicable)
            </label>
            <input 
              type="date" 
              id="field-reg-deadline" 
              value="${data.registration_deadline || ''}"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
            >
          </div>

          <!-- Important Instructions -->
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Important Instructions</label>
            <input 
              type="text" 
              id="field-instructions" 
              value="${escapeHtml(data.important_instructions || '')}"
              placeholder="e.g. Bring laptops, hall ticket required"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
            >
          </div>

          <!-- Description -->
          <div class="md:col-span-2">
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Event Description</label>
            <textarea 
              id="field-description" 
              rows="3"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none leading-relaxed"
            >${escapeHtml(data.description || '')}</textarea>
          </div>
        </div>

        <!-- Action Save Button -->
        <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button 
            type="button" 
            onclick="state.extractor.extractedData = null; renderExtractor();"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Clear / Discard
          </button>
          
          <button 
            id="save-notice-btn"
            type="button" 
            onclick="handleSaveExtractedNotice()"
            class="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Save to Campus Pulse</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function dismissDuplicateBanner() {
  state.extractor.showDuplicateBanner = false;
  const container = document.getElementById('extractor-result-container');
  if (container && state.extractor.extractedData) {
    container.innerHTML = renderExtractedCard(state.extractor.extractedData, []);
    lucide.createIcons();
  }
}

async function mergeWithDuplicate(existingId) {
  try {
    const existingRes = await api.getAnnouncementById(existingId);
    if (!existingRes.success) return;
    const existing = existingRes.data;

    // Merge non-empty fields into form
    if (!document.getElementById('field-instructions').value && existing.important_instructions) {
      document.getElementById('field-instructions').value = existing.important_instructions;
    }
    if (document.getElementById('field-venue').value === 'TBA' && existing.venue) {
      document.getElementById('field-venue').value = existing.venue;
    }

    showToast('Merged relevant fields from existing announcement!', 'info');
    dismissDuplicateBanner();
  } catch (e) {
    console.error(e);
  }
}

async function handleSaveExtractedNotice() {
  const title = document.getElementById('field-title').value;
  const category = document.getElementById('field-category').value;
  const event_date = document.getElementById('field-event-date').value;
  const start_time = document.getElementById('field-start-time').value;
  const end_time = document.getElementById('field-end-time').value;
  const venue = document.getElementById('field-venue').value;
  const registration_deadline = document.getElementById('field-reg-deadline').value;
  const important_instructions = document.getElementById('field-instructions').value;
  const description = document.getElementById('field-description').value;

  if (!title || !title.trim()) {
    showToast('Title is required.', 'warning');
    return;
  }
  if (!event_date) {
    showToast('Event date is required.', 'warning');
    return;
  }

  const payload = {
    title,
    category,
    event_date,
    start_time: start_time || null,
    end_time: end_time || null,
    venue: venue || 'TBA',
    registration_deadline: registration_deadline || null,
    important_instructions: important_instructions || null,
    description: description || '',
    source_text: state.extractor.rawText || null,
    missing_information: state.extractor.extractedData?.missing_information || []
  };

  const btn = document.getElementById('save-notice-btn');
  btn.disabled = true;
  btn.innerHTML = `
    <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span>Saving...</span>
  `;

  try {
    const res = await api.createAnnouncement(payload);
    if (res.success) {
      showToast('Announcement saved successfully to database!', 'success');
      state.extractor.rawText = '';
      state.extractor.extractedData = null;
      // Navigate to All Announcements to show newly created item
      setTimeout(() => navigate('announcements'), 500);
    } else {
      showToast(res.error || 'Failed to save announcement.', 'error');
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Save to Campus Pulse</span>`;
      lucide.createIcons();
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to save announcement to database.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Save to Campus Pulse</span>`;
    lucide.createIcons();
  }
}

// ----------------------------------------------------
// 3. SMART CALENDAR VIEW
// ----------------------------------------------------
async function renderCalendar() {
  const container = document.getElementById('main-content');
  const d = state.calendarDate;
  const year = d.getFullYear();
  const month = d.getMonth();

  try {
    const res = await api.getAnnouncements({ category: state.selectedCategory });
    const allEvents = res.data || [];

    // Filter events for this month or calculate days
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[month];

    // First day of month & total days
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <!-- Calendar Header & Navigation Controls -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 class="text-2xl font-extrabold text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-6 h-6 text-indigo-400"></i>
              Smart Campus Calendar
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Visualize exams, workshops, hackathons, and deadlines in one central schedule.
            </p>
          </div>

          <!-- Controls: Prev, Next, Today, Month/Week Switch -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button onclick="changeCalendarMonth(-1)" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
              <span class="px-4 text-xs font-bold text-white min-w-[130px] text-center">
                ${currentMonthName} ${year}
              </span>
              <button onclick="changeCalendarMonth(1)" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
            </div>

            <button onclick="calendarJumpToToday()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors">
              Today
            </button>

            <button onclick="navigate('extractor')" class="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Event</span>
            </button>
          </div>
        </div>

        <!-- Category Filters Strip -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button 
            onclick="filterCalendarByCategory('All')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${state.selectedCategory === 'All' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
          >
            All Categories
          </button>
          ${CATEGORIES.map(cat => `
            <button 
              onclick="filterCalendarByCategory('${cat}')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${state.selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
            >
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Month Grid View -->
        <div class="glass-card rounded-3xl overflow-hidden border-slate-800">
          <!-- Weekday Headers -->
          <div class="grid grid-cols-7 border-b border-slate-800 bg-slate-900/80 text-center text-xs font-bold text-slate-400 py-3">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          <!-- Calendar Days Grid -->
          <div class="grid grid-cols-7 auto-rows-fr gap-[1px] bg-slate-800/60">
            ${renderCalendarDays(year, month, firstDayIndex, daysInMonth, prevMonthDays, allEvents)}
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
  } catch (err) {
    console.error('Failed to render calendar:', err);
  }
}

function renderCalendarDays(year, month, firstDayIndex, daysInMonth, prevMonthDays, events) {
  let html = '';
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    html += `
      <div class="min-h-[110px] p-2 bg-[#0F172A]/40 text-slate-600 text-xs">
        <span class="font-semibold">${dayNum}</span>
      </div>
    `;
  }

  // Current month active days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.event_date === dateStr);
    const isToday = isCurrentMonth && today.getDate() === day;

    html += `
      <div class="min-h-[110px] p-2 bg-slate-950/80 hover:bg-slate-900/60 transition-colors flex flex-col justify-between text-xs group cursor-pointer" onclick="quickAddOnDate('${dateStr}')">
        <div class="flex items-center justify-between mb-1">
          <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'text-slate-300'}">
            ${day}
          </span>
          ${dayEvents.length > 0 ? `
            <span class="text-[10px] text-slate-500 font-mono">${dayEvents.length} notice${dayEvents.length > 1 ? 's' : ''}</span>
          ` : ''}
        </div>

        <div class="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
          ${dayEvents.map(e => {
            const style = CATEGORY_STYLES[e.category] || CATEGORY_STYLES['General Notices'];
            return `
              <div 
                onclick="event.stopPropagation(); openDetailsModal(${e.id})"
                class="px-2 py-1 rounded-md text-[11px] font-medium truncate ${style.calendar} hover:opacity-90 shadow-sm transition-opacity flex items-center gap-1 cursor-pointer"
                title="${escapeHtml(e.title)} (${e.venue || 'TBA'})"
              >
                ${e.priority === 'RED' ? '<span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse flex-shrink-0"></span>' : ''}
                <span class="truncate">${escapeHtml(e.title)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Trailing next month days to complete 7-col grid (up to 35 or 42 cells)
  const totalCellsSoFar = firstDayIndex + daysInMonth;
  const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    html += `
      <div class="min-h-[110px] p-2 bg-[#0F172A]/40 text-slate-600 text-xs">
        <span class="font-semibold">${day}</span>
      </div>
    `;
  }

  return html;
}

function changeCalendarMonth(delta) {
  state.calendarDate.setMonth(state.calendarDate.getMonth() + delta);
  renderCalendar();
}

function calendarJumpToToday() {
  state.calendarDate = new Date();
  renderCalendar();
}

function filterCalendarByCategory(category) {
  state.selectedCategory = category;
  renderCalendar();
}

function quickAddOnDate(dateStr) {
  state.extractor.rawText = `Notice on ${dateStr}: `;
  navigate('extractor');
}

// ----------------------------------------------------
// 4. ALL ANNOUNCEMENTS MANAGEMENT VIEW
// ----------------------------------------------------
async function renderAnnouncements() {
  const container = document.getElementById('main-content');

  try {
    const res = await api.getAnnouncements(state.announcementFilters);
    const list = res.data || [];

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 class="text-2xl font-extrabold text-white flex items-center gap-2">
              <i data-lucide="bell" class="w-6 h-6 text-indigo-400"></i>
              All Campus Announcements
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Search, filter, update, and manage all saved college notices.
            </p>
          </div>

          <button onclick="navigate('extractor')" class="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 self-start md:self-auto">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            <span>Add via AI Notice Extractor</span>
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="glass-card rounded-2xl p-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <!-- Search Input -->
            <div class="lg:col-span-2 relative">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input 
                type="text" 
                id="filter-search" 
                placeholder="Search title, description, or venue..." 
                value="${escapeHtml(state.announcementFilters.search || '')}"
                oninput="debounceSearchAnnouncements(this.value)"
                class="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              >
            </div>

            <!-- Category Filter -->
            <div>
              <select 
                id="filter-category" 
                onchange="handleFilterChange('category', this.value)"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All" ${state.announcementFilters.category === 'All' ? 'selected' : ''}>All Categories</option>
                ${CATEGORIES.map(c => `
                  <option value="${c}" ${state.announcementFilters.category === c ? 'selected' : ''}>${c}</option>
                `).join('')}
              </select>
            </div>

            <!-- Priority Filter -->
            <div>
              <select 
                id="filter-priority" 
                onchange="handleFilterChange('priority', this.value)"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All" ${state.announcementFilters.priority === 'All' ? 'selected' : ''}>All Priorities</option>
                <option value="RED" ${state.announcementFilters.priority === 'RED' ? 'selected' : ''}>RED - Urgent (&lt; 24h)</option>
                <option value="YELLOW" ${state.announcementFilters.priority === 'YELLOW' ? 'selected' : ''}>YELLOW - Upcoming (&lt; 7d)</option>
                <option value="GREEN" ${state.announcementFilters.priority === 'GREEN' ? 'selected' : ''}>GREEN - Normal</option>
                <option value="GREY" ${state.announcementFilters.priority === 'GREY' ? 'selected' : ''}>GREY - Expired</option>
              </select>
            </div>

            <!-- Timeline Filter (Upcoming vs Past) -->
            <div>
              <select 
                id="filter-timeline" 
                onchange="handleFilterChange('timeline', this.value)"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all" ${state.announcementFilters.timeline === 'all' ? 'selected' : ''}>All Dates</option>
                <option value="upcoming" ${state.announcementFilters.timeline === 'upcoming' ? 'selected' : ''}>Upcoming Only</option>
                <option value="past" ${state.announcementFilters.timeline === 'past' ? 'selected' : ''}>Past / Expired Only</option>
              </select>
            </div>
          </div>

          <!-- Sorting and Reset Bar -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span class="font-medium">Showing ${list.length} announcements</span>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-1.5">
                <span>Sort by:</span>
                <select 
                  onchange="handleFilterChange('sort', this.value)"
                  class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
                >
                  <option value="newest" ${state.announcementFilters.sort === 'newest' ? 'selected' : ''}>Recently Added</option>
                  <option value="urgent_first" ${state.announcementFilters.sort === 'urgent_first' ? 'selected' : ''}>Urgency First</option>
                  <option value="date_asc" ${state.announcementFilters.sort === 'date_asc' ? 'selected' : ''}>Event Date (Earliest)</option>
                  <option value="date_desc" ${state.announcementFilters.sort === 'date_desc' ? 'selected' : ''}>Event Date (Latest)</option>
                </select>
              </label>

              <button onclick="resetFilters()" class="text-indigo-400 hover:text-indigo-300 font-semibold underline">
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Cards Grid -->
        ${list.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${list.map(item => `
              <div class="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer group" onclick="openDetailsModal(${item.id})">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    ${renderCategoryBadge(item.category)}
                    ${renderPriorityBadge(item.priority)}
                  </div>

                  <h3 class="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5">
                    ${item.title}
                  </h3>

                  <p class="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    ${item.description || 'No description provided.'}
                  </p>
                </div>

                <div class="space-y-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-1 text-indigo-300 font-medium">
                      <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400"></i>
                      ${formatDate(item.event_date)}
                    </span>
                    <span class="flex items-center gap-1">
                      <i data-lucide="clock" class="w-3.5 h-3.5 text-purple-400"></i>
                      ${item.start_time || 'TBA'}
                    </span>
                  </div>

                  <div class="flex items-center gap-1 text-[11px] truncate text-slate-400">
                    <i data-lucide="map-pin" class="w-3 h-3 text-cyan-400 flex-shrink-0"></i>
                    <span class="truncate">${item.venue || 'TBA'}</span>
                  </div>

                  ${item.registration_deadline ? `
                    <div class="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <i data-lucide="timer" class="w-3 h-3 text-amber-400"></i>
                      <span>Reg. Deadline: ${formatDate(item.registration_deadline)}</span>
                    </div>
                  ` : ''}

                  <!-- Card Action Buttons -->
                  <div class="flex items-center justify-between pt-2 border-t border-slate-800/50">
                    <button 
                      onclick="event.stopPropagation(); openEditModal(${item.id})" 
                      class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                    >
                      <i data-lucide="edit-3" class="w-3 h-3 text-indigo-400"></i>
                      Edit
                    </button>

                    <button 
                      onclick="event.stopPropagation(); handleDeleteNotice(${item.id})" 
                      class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1 border border-rose-500/20 transition-colors"
                    >
                      <i data-lucide="trash-2" class="w-3 h-3"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="p-12 text-center glass-card rounded-3xl space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
              <i data-lucide="inbox" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-bold text-white">No announcements found</h4>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              No notices match your current filters. Try resetting the filters or extract a new notice with AI!
            </p>
            <button onclick="resetFilters()" class="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700">
              Reset Filters
            </button>
          </div>
        `}
      </div>
    `;

    lucide.createIcons();
  } catch (err) {
    console.error('Failed to render announcements:', err);
  }
}

let searchDebounceTimer = null;
function debounceSearchAnnouncements(val) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.announcementFilters.search = val;
    renderAnnouncements();
  }, 300);
}

function handleFilterChange(key, value) {
  state.announcementFilters[key] = value;
  renderAnnouncements();
}

function resetFilters() {
  state.announcementFilters = {
    search: '',
    category: 'All',
    priority: 'All',
    timeline: 'all',
    sort: 'newest'
  };
  renderAnnouncements();
}

async function handleDeleteNotice(id) {
  if (!confirm('Are you sure you want to delete this campus announcement? This action cannot be undone.')) {
    return;
  }

  try {
    const res = await api.deleteAnnouncement(id);
    if (res.success) {
      showToast('Announcement deleted from database.', 'success');
      renderAnnouncements();
    } else {
      showToast('Failed to delete announcement.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error deleting announcement.', 'error');
  }
}

// ----------------------------------------------------
// 5. AI WEEKLY SUMMARY ("WHAT DO I NEED TO KNOW THIS WEEK?")
// ----------------------------------------------------
async function renderWeeklySummary() {
  const container = document.getElementById('main-content');

  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <!-- Feature Header Banner -->
      <div class="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-tr from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 shadow-2xl">
        <div class="relative z-10 space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            Campus Executive Intelligence
          </div>
          <h2 class="text-3xl font-extrabold text-white tracking-tight">
            WHAT DO I NEED TO KNOW THIS WEEK?
          </h2>
          <p class="text-slate-300 text-xs max-w-xl leading-relaxed">
            Gemini AI scans the entire college database, groups upcoming deadlines, exams, and competitions into an actionable student briefing for your week.
          </p>

          <div class="pt-3">
            <button 
              id="generate-summary-btn"
              onclick="handleGenerateWeeklySummary()"
              class="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <i data-lucide="zap" class="w-4 h-4 text-purple-200"></i>
              <span>Generate AI Weekly Briefing</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Result Container -->
      <div id="weekly-summary-result">
        ${state.weeklySummary.data ? renderWeeklySummaryContent(state.weeklySummary.data) : `
          <div class="p-12 text-center glass-card rounded-3xl space-y-3 border-dashed border-slate-800">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <i data-lucide="newspaper" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-bold text-white">No summary generated yet</h4>
            <p class="text-xs text-slate-400 max-w-md mx-auto">
              Click "Generate AI Weekly Briefing" above to let Gemini AI analyze your week's schedule.
            </p>
          </div>
        `}
      </div>
    </div>
  `;

  lucide.createIcons();
}

async function handleGenerateWeeklySummary() {
  const btn = document.getElementById('generate-summary-btn');
  const resultContainer = document.getElementById('weekly-summary-result');

  btn.disabled = true;
  btn.innerHTML = `
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span>Synthesizing Campus Schedule...</span>
  `;

  resultContainer.innerHTML = `
    <div class="p-8 glass-card rounded-3xl ai-shimmer border-purple-500/30 text-center space-y-3">
      <div class="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
        <i data-lucide="sparkles" class="w-5 h-5 animate-spin"></i>
      </div>
      <h4 class="text-sm font-bold text-white">Synthesizing Campus Schedule with Gemini AI...</h4>
      <p class="text-xs text-slate-400 max-w-md mx-auto">
        Aggregating approaching registration deadlines, mid-term examinations, and workshops happening this week.
      </p>
    </div>
  `;
  lucide.createIcons();

  try {
    const res = await api.getWeeklySummary();
    btn.disabled = false;
    btn.innerHTML = `
      <i data-lucide="zap" class="w-4 h-4 text-purple-200"></i>
      <span>Generate AI Weekly Briefing</span>
    `;

    if (!res.success) {
      showToast(res.error || 'Failed to generate weekly briefing.', 'error');
      resultContainer.innerHTML = '';
      return;
    }

    state.weeklySummary.data = res.data;
    resultContainer.innerHTML = renderWeeklySummaryContent(res.data, res.week_range);
    lucide.createIcons();
    showToast('Weekly summary generated!', 'success');
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `
      <i data-lucide="zap" class="w-4 h-4 text-purple-200"></i>
      <span>Generate AI Weekly Briefing</span>
    `;
    console.error(err);
    showToast('Failed to generate weekly summary.', 'error');
  }
}

function renderWeeklySummaryContent(data, weekRange = {}) {
  return `
    <div class="glass-card rounded-3xl p-8 border-purple-500/30 space-y-8 animate-fade-in shadow-2xl">
      <!-- Headline & Executive Brief -->
      <div class="pb-6 border-b border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <i data-lucide="radio" class="w-4 h-4"></i>
            YOUR CAMPUS THIS WEEK
          </span>
          <div class="flex items-center gap-2">
            <button onclick="copyWeeklySummaryToClipboard()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>Copy Briefing</span>
            </button>
          </div>
        </div>

        <h3 class="text-xl font-extrabold text-white tracking-tight">
          ${escapeHtml(data.headline || 'Your Campus Weekly Overview')}
        </h3>

        <p class="text-sm text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          ${escapeHtml(data.summary || '')}
        </p>
      </div>

      <!-- 3 Categorized Summary Columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 1. Important Deadlines -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-rose-500/20">
            <i data-lucide="alert-circle" class="w-4 h-4"></i>
            Important Deadlines
          </h4>
          <ul class="space-y-2 text-xs">
            ${data.deadlines && data.deadlines.length > 0 ? data.deadlines.map(d => `
              <li class="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-200 flex items-start gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                <span>${escapeHtml(d)}</span>
              </li>
            `).join('') : `
              <li class="p-3 text-slate-500 text-xs italic">No urgent deadlines recorded this week.</li>
            `}
          </ul>
        </div>

        <!-- 2. Upcoming Events -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-purple-500/20">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            Upcoming Events
          </h4>
          <ul class="space-y-2 text-xs">
            ${data.events && data.events.length > 0 ? data.events.map(e => `
              <li class="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-200 flex items-start gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></span>
                <span>${escapeHtml(e)}</span>
              </li>
            `).join('') : `
              <li class="p-3 text-slate-500 text-xs italic">No workshops or events scheduled.</li>
            `}
          </ul>
        </div>

        <!-- 3. Important Notices -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-cyan-500/20">
            <i data-lucide="info" class="w-4 h-4"></i>
            Important Notices
          </h4>
          <ul class="space-y-2 text-xs">
            ${data.notices && data.notices.length > 0 ? data.notices.map(n => `
              <li class="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-200 flex items-start gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                <span>${escapeHtml(n)}</span>
              </li>
            `).join('') : `
              <li class="p-3 text-slate-500 text-xs italic">No general administrative notices.</li>
            `}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function copyWeeklySummaryToClipboard() {
  if (!state.weeklySummary.data) return;
  const d = state.weeklySummary.data;
  let text = `CAMPUS PULSE - WEEKLY BRIEFING\n\n${d.headline}\n\n${d.summary}\n\n`;
  text += `🚨 IMPORTANT DEADLINES:\n` + (d.deadlines || []).map(i => `• ${i}`).join('\n') + `\n\n`;
  text += `📅 UPCOMING EVENTS:\n` + (d.events || []).map(i => `• ${i}`).join('\n') + `\n\n`;
  text += `📌 IMPORTANT NOTICES:\n` + (d.notices || []).map(i => `• ${i}`).join('\n');

  navigator.clipboard.writeText(text).then(() => {
    showToast('Weekly briefing copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Unable to copy to clipboard.', 'warning');
  });
}

// ----------------------------------------------------
// 6. SETTINGS VIEW & DEMO CONTROLS
// ----------------------------------------------------
async function renderSettings() {
  const container = document.getElementById('main-content');

  try {
    const healthRes = await api.getHealth();
    const gemini = healthRes.gemini || { configured: false, mode: 'Demo Mode' };

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <!-- Header -->
        <div class="pb-4 border-b border-slate-800">
          <h2 class="text-2xl font-extrabold text-white flex items-center gap-2">
            <i data-lucide="settings-2" class="w-6 h-6 text-indigo-400"></i>
            Settings & System Status
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Configure Gemini AI, check backend database status, and test sample college announcements.
          </p>
        </div>

        <!-- Google Gemini AI Configuration Card -->
        <div class="glass-card rounded-3xl p-6 border-indigo-500/30 space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i>
                Google Gemini API Status
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Kept securely on the server via .env. Never exposed to frontend code.</p>
            </div>
            <div>
              ${gemini.configured ? `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Live Gemini AI Active
                </span>
              ` : `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  Demo Mode (Smart Heuristic)
                </span>
              `}
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Configure / Update Gemini API Key
              </label>
              <div class="flex gap-3">
                <input 
                  type="password" 
                  id="settings-api-key" 
                  placeholder="Paste AI Studio API Key (AIzaSy...)" 
                  class="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                <button 
                  onclick="handleSaveApiKey()" 
                  class="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  Save Key
                </button>
              </div>
              <p class="text-[11px] text-slate-500 mt-2">
                Get your free API key at <a href="https://aistudio.google.com/" target="_blank" class="text-indigo-400 underline">aistudio.google.com</a>. If left empty, Campus Pulse functions seamlessly in high-fidelity Demo Mode.
              </p>
            </div>
          </div>
        </div>

        <!-- Sample Data Reset / Reseed Control -->
        <div class="glass-card rounded-3xl p-6 border-slate-800 space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="database" class="w-4 h-4 text-cyan-400"></i>
                Sample College Announcements Seeder
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Populates 8+ realistic college hackathons, workshops, and exam notices for hackathon demonstrations.
              </p>
            </div>
            <button 
              onclick="handleReseedData()" 
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
            >
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>Reset & Seed Database</span>
            </button>
          </div>
        </div>

        <!-- Technology Stack & System Info -->
        <div class="glass-card rounded-3xl p-6 border-slate-800 space-y-4 text-xs">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="cpu" class="w-4 h-4 text-emerald-400"></i>
            Architecture Overview
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Backend Architecture</span>
              <span class="font-semibold text-white">Node.js Express + SQLite (WAL Mode)</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">AI Core</span>
              <span class="font-semibold text-white">Google Gemini 1.5 Flash</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Reference Timezone</span>
              <span class="font-semibold text-white">Asia/Kolkata (Indian Standard Time)</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Design Theme</span>
              <span class="font-semibold text-white">Dark Navy • Purple • Electric Blue</span>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
  } catch (err) {
    console.error('Failed to render settings:', err);
  }
}

async function handleSaveApiKey() {
  const input = document.getElementById('settings-api-key');
  const key = input.value.trim();

  if (!key) {
    showToast('Please paste a valid Gemini API key.', 'warning');
    return;
  }

  try {
    const res = await api.saveApiKey(key);
    if (res.success) {
      showToast('Gemini API key saved! Live AI is now active.', 'success');
      input.value = '';
      renderSettings();
      updateSidebarAIStatus();
    } else {
      showToast(res.error || 'Failed to update key.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to save API key.', 'error');
  }
}

async function handleReseedData() {
  if (!confirm('This will reset and reseed sample campus announcements. Continue?')) {
    return;
  }

  try {
    const res = await api.reseedDatabase();
    if (res.success) {
      showToast(`Successfully reseeded ${res.count} campus announcements!`, 'success');
      setTimeout(() => navigate('dashboard'), 400);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to reseed database.', 'error');
  }
}

// ----------------------------------------------------
// 7. MODALS: DETAILS & EDIT
// ----------------------------------------------------
async function openDetailsModal(id) {
  const modal = document.getElementById('details-modal');
  const body = document.getElementById('details-modal-body');

  body.innerHTML = `
    <div class="p-8 text-center">
      <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <span class="text-xs text-slate-400">Loading announcement details...</span>
    </div>
  `;
  modal.classList.remove('hidden');

  try {
    const res = await api.getAnnouncementById(id);
    if (!res.success) {
      body.innerHTML = `<div class="p-4 text-rose-400 text-xs">Failed to load announcement.</div>`;
      return;
    }

    const item = res.data;
    const missingInfo = item.missing_information || [];

    body.innerHTML = `
      <div class="space-y-5">
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              ${renderCategoryBadge(item.category)}
              ${renderPriorityBadge(item.priority)}
            </div>
            <h3 class="text-lg font-bold text-white tracking-tight">${escapeHtml(item.title)}</h3>
          </div>
          <button onclick="closeDetailsModal()" class="text-slate-400 hover:text-white p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Missing Information Alert if any -->
        ${missingInfo.length > 0 ? `
          <div class="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-300">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"></i>
            <div>
              <strong>Missing Information Alert:</strong> ${missingInfo.join(', ')}. Please verify with organizers before attending.
            </div>
          </div>
        ` : ''}

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Event Date & Time</span>
            <div class="font-semibold text-white flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400"></i>
              ${formatDate(item.event_date)}
            </div>
            <div class="text-slate-400 mt-1 flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-purple-400"></i>
              ${item.start_time || 'Time TBA'} ${item.end_time ? ' - ' + item.end_time : ''}
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Campus Venue</span>
            <div class="font-semibold text-white flex items-center gap-1.5">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-cyan-400"></i>
              ${item.venue || 'TBA'}
            </div>
          </div>

          ${item.registration_deadline ? `
            <div class="col-span-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="timer" class="w-4 h-4 text-amber-400"></i>
                <span class="font-bold">Registration Deadline:</span>
              </div>
              <span class="font-mono font-bold">${formatDate(item.registration_deadline)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Announcement Details</span>
          <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            ${escapeHtml(item.description || 'No description provided.')}
          </p>
        </div>

        <!-- Instructions -->
        ${item.important_instructions ? `
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Important Instructions</span>
            <div class="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
              <i data-lucide="info" class="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5"></i>
              <span>${escapeHtml(item.important_instructions)}</span>
            </div>
          </div>
        ` : ''}

        <!-- Original Source Text Snippet -->
        ${item.source_text ? `
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original WhatsApp / Notice Snippet</span>
            <pre class="text-[11px] text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80 overflow-x-auto whitespace-pre-wrap">${escapeHtml(item.source_text)}</pre>
          </div>
        ` : ''}

        <!-- Modal Actions Footer -->
        <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button onclick="closeDetailsModal(); openEditModal(${item.id})" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-indigo-400"></i>
            Edit Details
          </button>
          <button onclick="closeDetailsModal()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

function closeDetailsModal() {
  document.getElementById('details-modal').classList.add('hidden');
}

async function openEditModal(id) {
  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-notice-form');

  form.innerHTML = `
    <div class="p-8 text-center">
      <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <span class="text-xs text-slate-400">Loading announcement for editing...</span>
    </div>
  `;
  modal.classList.remove('hidden');

  try {
    const res = await api.getAnnouncementById(id);
    if (!res.success) return;
    const item = res.data;

    form.innerHTML = `
      <input type="hidden" id="edit-id" value="${item.id}">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="md:col-span-2">
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Title *</label>
          <input type="text" id="edit-title" value="${escapeHtml(item.title)}" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div>
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Category *</label>
          <select id="edit-category" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
            ${CATEGORIES.map(c => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Venue</label>
          <input type="text" id="edit-venue" value="${escapeHtml(item.venue || 'TBA')}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div>
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Event Date *</label>
          <input type="date" id="edit-event-date" value="${item.event_date}" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Start Time</label>
            <input type="text" id="edit-start-time" value="${escapeHtml(item.start_time || '')}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
          </div>
          <div>
            <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">End Time</label>
            <input type="text" id="edit-end-time" value="${escapeHtml(item.end_time || '')}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
          </div>
        </div>

        <div class="md:col-span-2">
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Registration Deadline</label>
          <input type="date" id="edit-reg-deadline" value="${item.registration_deadline || ''}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div class="md:col-span-2">
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Important Instructions</label>
          <input type="text" id="edit-instructions" value="${escapeHtml(item.important_instructions || '')}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div class="md:col-span-2">
          <label class="block font-bold text-slate-300 uppercase tracking-wider mb-1">Description</label>
          <textarea id="edit-description" rows="3" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-indigo-500 focus:outline-none">${escapeHtml(item.description || '')}</textarea>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
        <button type="button" onclick="closeEditModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
          Cancel
        </button>
        <button type="submit" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
          Save Changes
        </button>
      </div>
    `;

    lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function handleSaveEditNotice(event) {
  event.preventDefault();
  const id = document.getElementById('edit-id').value;

  const payload = {
    title: document.getElementById('edit-title').value,
    category: document.getElementById('edit-category').value,
    event_date: document.getElementById('edit-event-date').value,
    start_time: document.getElementById('edit-start-time').value || null,
    end_time: document.getElementById('edit-end-time').value || null,
    venue: document.getElementById('edit-venue').value || 'TBA',
    registration_deadline: document.getElementById('edit-reg-deadline').value || null,
    important_instructions: document.getElementById('edit-instructions').value || null,
    description: document.getElementById('edit-description').value || ''
  };

  try {
    const res = await api.updateAnnouncement(id, payload);
    if (res.success) {
      showToast('Announcement updated successfully!', 'success');
      closeEditModal();
      if (state.currentRoute === 'announcements') renderAnnouncements();
      else if (state.currentRoute === 'dashboard') renderDashboard();
      else if (state.currentRoute === 'calendar') renderCalendar();
    } else {
      showToast(res.error || 'Failed to update announcement.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to update announcement.', 'error');
  }
}

function openQuickAddModal() {
  navigate('extractor');
}

function handleGlobalSearch(term) {
  state.announcementFilters.search = term;
  navigate('announcements');
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light-theme');
    localStorage.setItem('cp_theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    document.body.classList.remove('light-theme');
    localStorage.setItem('cp_theme', 'dark');
  }
}

async function updateSidebarAIStatus() {
  try {
    const health = await api.getHealth();
    const ind = document.getElementById('sidebar-ai-indicator');
    const desc = document.getElementById('sidebar-ai-desc');
    if (!ind || !desc) return;

    if (health.gemini && health.gemini.configured) {
      ind.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online`;
      ind.className = 'flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium';
      desc.textContent = 'Gemini 1.5 Flash (Live)';
    } else {
      ind.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Demo Mode`;
      ind.className = 'flex items-center gap-1.5 text-[11px] text-amber-400 font-medium';
      desc.textContent = 'Smart Heuristic Engine';
    }
  } catch (e) {
    // silently ignore
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  if (state.theme === 'light') {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light-theme');
  }

  // Format header date
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const headerDate = document.getElementById('header-date');
  if (headerDate) headerDate.textContent = `${dateStr} • Asia/Kolkata`;

  // Update AI status
  updateSidebarAIStatus();

  // Navigate to initial dashboard
  navigate('dashboard');
});

