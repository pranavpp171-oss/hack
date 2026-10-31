import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Check if real Gemini API is configured and valid
 */
export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10 && !GEMINI_API_KEY.includes('your_gemini_api_key'));
}

/**
 * Helper to call Gemini with structured JSON output
 */
async function callGemini(prompt, systemInstruction = '') {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Try gemini-1.5-flash first, fallback to gemini-1.5-pro
  const modelName = 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
    systemInstruction: systemInstruction || undefined,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Intelligent Rule-based Heuristic Extractor for Demo / Fallback Mode
 * Guarantees zero crashes and 100% functionality during testing when no key is set
 */
function heuristicExtract(rawText, referenceDateStr) {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // Category heuristics
  let category = 'General Notices';
  if (/hackathon|coding|contest|competition|championship|tournament|codex/i.test(text)) {
    category = 'Competitions';
  } else if (/workshop|hands-on|bootcamp|masterclass|training/i.test(text)) {
    category = 'Workshops';
  } else if (/exam|mid-sem|end-sem|timetable|viva|test|quiz/i.test(text)) {
    category = 'Examinations';
  } else if (/assignment|project submission|homework|deadline|moodle/i.test(text)) {
    category = 'Assignments';
  } else if (/seminar|lecture|webinar|talk|symposium|speaker/i.test(text)) {
    category = 'Seminars';
  } else if (/football|cricket|sports|tournament|match|athletics/i.test(text)) {
    category = 'Sports';
  } else if (/event|fest|cultural|celebration/i.test(text)) {
    category = 'Events';
  }

  // Title extraction: pick first meaningful line or capitalized phrase
  let title = 'Campus Notice';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 5);
  for (const line of lines) {
    if (!/^(fyi|forwarded|urgent|reminder|attention|hey guys|hello|hi all)/i.test(line)) {
      title = line.replace(/^[\*\#\-\s]+/, '').replace(/[\*\#]+$/, '');
      if (title.length > 70) title = title.substring(0, 70) + '...';
      break;
    }
  }

  // Date detection
  let eventDate = new Date(refDate);
  let isDateFound = false;
  let dateAmbiguity = null;

  if (/tomorrow/i.test(text)) {
    eventDate.setDate(eventDate.getDate() + 1);
    isDateFound = true;
  } else if (/today/i.test(text)) {
    isDateFound = true;
  } else if (/next monday/i.test(text)) {
    const day = eventDate.getDay();
    const diff = (8 - day) % 7 || 7;
    eventDate.setDate(eventDate.getDate() + diff);
    isDateFound = true;
  } else {
    // Regex for "15 November" or "Nov 15" or "15/11/2026"
    const monthMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})?/i)
      || text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})?/i);
    
    if (monthMatch) {
      isDateFound = true;
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      let d = 1, m = 0, y = eventDate.getFullYear();
      
      if (isNaN(parseInt(monthMatch[1]))) {
        m = monthNames.findIndex(mn => monthMatch[1].toLowerCase().startsWith(mn));
        d = parseInt(monthMatch[2]);
        if (monthMatch[3]) y = parseInt(monthMatch[3]);
      } else {
        d = parseInt(monthMatch[1]);
        m = monthNames.findIndex(mn => monthMatch[2].toLowerCase().startsWith(mn));
        if (monthMatch[3]) y = parseInt(monthMatch[3]);
      }

      eventDate = new Date(y, m, d);
      if (!monthMatch[3]) {
        dateAmbiguity = 'Year was not specified; defaulted to current year.';
      }
    }
  }

  if (!isDateFound) {
    // Default to +3 days from now
    eventDate.setDate(eventDate.getDate() + 3);
    dateAmbiguity = 'Exact event date not detected in text; estimated relative date.';
  }

  // Time extraction
  let startTime = null;
  const timeMatch = text.match(/(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}\s*o'?clock\b)/i);
  if (timeMatch) {
    startTime = timeMatch[0].toUpperCase();
  }

  // Venue extraction
  let venue = null;
  const venueMatch = text.match(/(?:at|in|venue:?)\s+([A-Z0-9][a-zA-Z0-9\s,\-–]{3,35}(?:Auditorium|Lab|Hall|Room|Complex|Ground|Tower|Centre|Center|Campus))/i)
    || text.match(/(Computer Science Auditorium|Seminar Hall|Central Sports Ground|Exam Hall Complex|Tech Tower|Library)/i);
  if (venueMatch) {
    venue = venueMatch[1].trim();
  }

  // Deadline extraction
  let regDeadline = null;
  const dlMatch = text.match(/(?:registration closes|deadline:?|register before|register asap by|last date:?)\s+(?:on\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+|\w+)/i);
  if (dlMatch) {
    const dlDate = new Date(refDate);
    if (/tomorrow/i.test(dlMatch[1])) {
      dlDate.setDate(dlDate.getDate() + 1);
      regDeadline = dlDate.toISOString().split('T')[0];
    } else {
      dlDate.setDate(dlDate.getDate() + 2);
      regDeadline = dlDate.toISOString().split('T')[0];
    }
  }

  // Missing information detection
  const missingInfo = [];
  if (!startTime) missingInfo.push('Exact Start Time');
  if (!venue) missingInfo.push('Specific Venue / Room');
  if (!regDeadline && /register|apply|submission/i.test(text)) {
    missingInfo.push('Registration Deadline');
  }

  return {
    title: title,
    description: text.length > 200 ? text.substring(0, 197) + '...' : text,
    event_date: eventDate.toISOString().split('T')[0],
    start_time: startTime || '10:00 AM',
    end_time: null,
    venue: venue || 'TBA',
    category,
    registration_deadline: regDeadline,
    important_instructions: 'Please verify venue and schedule with department coordinator.',
    missing_information: missingInfo,
    date_ambiguity: dateAmbiguity,
    is_ai_demo_mode: true,
  };
}

/**
 * Extract structured announcement information from unstructured text using Gemini AI
 */
export function extractAnnouncementWithAI(rawText, referenceDateStr) {
  const refDateStr = referenceDateStr || new Date().toISOString().split('T')[0];
  
  if (!isGeminiConfigured()) {
    console.log('[Gemini Service] API key not configured. Using high-fidelity heuristic extraction engine.');
    return Promise.resolve(heuristicExtract(rawText, refDateStr));
  }

  const systemInstruction = `
You are the AI engine of "Campus Pulse", an intelligent college announcement management platform.
Your task is to parse unstructured college messages (WhatsApp forwards, emails, notices, posters) into clean, structured JSON.

CRITICAL RULES:
1. Reference Date: Today is ${refDateStr} (Timezone: Asia/Kolkata).
   - "tomorrow" means the day after ${refDateStr}.
   - "next Monday" means the upcoming Monday after ${refDateStr}.
   - For dates without a year (e.g., "15 Nov"), infer the closest future date based on ${refDateStr}.
2. Categories must strictly be one of:
   ['Events', 'Workshops', 'Competitions', 'Examinations', 'Assignments', 'Seminars', 'Sports', 'General Notices']
3. Distinguish EVENT DATE from REGISTRATION DEADLINE (e.g. event is 15 Nov, but registration closes 10 Nov).
4. DO NOT invent or hallucinate missing information. If a field is not present or vague, return null or an empty string.
5. Missing Information: If critical event details like exact time, venue, or registration instructions are absent or vague, list them clearly in the missing_information array (e.g. ["Exact Start Time", "Specific Room Venue"]).
6. Date Ambiguity: If the date is ambiguous or lacks month/year, set date_ambiguity string with a helpful note for the user to confirm.
7. Return strictly valid JSON matching the schema below.
`;

  const prompt = `
Extract the announcement details from the following message:

"""
${rawText}
"""

Return a JSON object with this exact schema:
{
  "title": "Clear concise event title (max 80 chars)",
  "description": "2-3 sentence informative summary",
  "event_date": "YYYY-MM-DD",
  "start_time": "e.g. 10:00 AM or null",
  "end_time": "e.g. 04:00 PM or null",
  "venue": "Specific room/hall/ground or 'TBA'",
  "category": "Events | Workshops | Competitions | Examinations | Assignments | Seminars | Sports | General Notices",
  "registration_deadline": "YYYY-MM-DD or null",
  "important_instructions": "Key guidelines, prerequisites, what to bring, or null",
  "missing_information": ["List of missing critical items like time, venue, contact, link"],
  "date_ambiguity": "Note explaining any date ambiguity or null if clear"
}
`;

  return callGemini(prompt, systemInstruction)
    .then(rawJson => {
      try {
        const cleaned = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          ...parsed,
          is_ai_demo_mode: false,
        };
      } catch (err) {
        console.error('[Gemini Service] Error parsing JSON output:', rawJson);
        return heuristicExtract(rawText, refDateStr);
      }
    })
    .catch(err => {
      console.warn('[Gemini Service] Gemini API call failed, falling back to heuristic engine:', err.message);
      const fallback = heuristicExtract(rawText, refDateStr);
      fallback.api_error = err.message;
      return fallback;
    });
}

/**
 * Generate "What Do I Need To Know This Week?" AI Weekly Briefing
 */
export async function generateWeeklySummaryWithAI(announcements, weekStartStr, weekEndStr) {
  if (!announcements || announcements.length === 0) {
    return {
      headline: 'Campus is Quiet This Week',
      summary: 'No upcoming events or urgent deadlines recorded for the current week.',
      deadlines: [],
      events: [],
      notices: [],
      is_ai_demo_mode: !isGeminiConfigured(),
    };
  }

  // Pre-filter events & deadlines for this week
  const deadlines = announcements.filter(a => a.registration_deadline || a.category === 'Assignments' || a.priority === 'RED');
  const events = announcements.filter(a => a.category !== 'General Notices' && a.category !== 'Assignments');
  const notices = announcements.filter(a => a.category === 'General Notices');

  if (!isGeminiConfigured()) {
    // High-quality demo briefing
    return {
      headline: `Your Campus Week: ${announcements.length} Activities & Key Deadlines`,
      summary: `You have ${deadlines.length} critical deadlines and ${events.length} campus events scheduled between ${weekStartStr} and ${weekEndStr}. Ensure you register on time and check venue notices.`,
      deadlines: deadlines.map(d => `${d.title} - due ${d.registration_deadline || d.event_date}`),
      events: events.map(e => `${e.title} on ${e.event_date} at ${e.venue} (${e.start_time || 'Time TBA'})`),
      notices: notices.map(n => `${n.title}: ${n.description}`),
      is_ai_demo_mode: true,
    };
  }

  const prompt = `
You are the AI Chief of Campus Pulse. Generate a crisp, engaging, executive student briefing: "WHAT DO I NEED TO KNOW THIS WEEK?".
Current Week: ${weekStartStr} to ${weekEndStr}.

Here are the announcements in the database:
${JSON.stringify(announcements.map(a => ({
  title: a.title,
  category: a.category,
  event_date: a.event_date,
  venue: a.venue,
  start_time: a.start_time,
  registration_deadline: a.registration_deadline,
  priority: a.priority,
  description: a.description
})), null, 2)}

Return a JSON object with:
{
  "headline": "A punchy, motivating one-line summary (e.g. 'High Alert Week: 3 Hackathons & Mid-Semester Exams')",
  "summary": "A 2-sentence executive summary highlighting the most pressing items.",
  "deadlines": ["List of urgent deadlines with date/time"],
  "events": ["List of key workshops, competitions, and seminars with dates and venues"],
  "notices": ["List of administrative or general campus updates"]
}
`;

  try {
    const rawJson = await callGemini(prompt, 'You are an intelligent campus briefing generator. Synthesize realistic, highly structured student summaries.');
    const cleaned = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      ...parsed,
      is_ai_demo_mode: false,
    };
  } catch (err) {
    console.warn('[Weekly Summary AI] Failed Gemini call, falling back to heuristic:', err.message);
    return {
      headline: `Your Campus Week: ${announcements.length} Activities & Key Deadlines`,
      summary: `You have ${deadlines.length} critical deadlines and ${events.length} campus events scheduled between ${weekStartStr} and ${weekEndStr}.`,
      deadlines: deadlines.map(d => `${d.title} - due ${d.registration_deadline || d.event_date}`),
      events: events.map(e => `${e.title} on ${e.event_date} at ${e.venue} (${e.start_time || 'Time TBA'})`),
      notices: notices.map(n => `${n.title}: ${n.description}`),
      is_ai_demo_mode: true,
      api_error: err.message,
    };
  }
}

