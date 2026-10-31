import { initDB, createAnnouncement, getAllAnnouncements } from './db.js';
import db from './db.js';

export function seedData(force = false) {
  initDB();

  const existing = getAllAnnouncements();
  if (existing.length > 0 && !force) {
    console.log(`Database already contains ${existing.length} announcements. Skipping seed.`);
    return existing.length;
  }

  if (force) {
    db.prepare('DELETE FROM announcements').run();
    console.log('Cleared existing announcements for reseeding.');
  }

  const today = new Date();
  
  // Helper to format date offset in days
  const getDateOffset = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const sampleAnnouncements = [
    {
      title: 'CodeX 2026 - Annual 24-Hour National Hackathon',
      description: 'The premier national coding hackathon hosted by the Dept of Computer Science. Teams of 3-4 build AI and Web3 solutions. Cash prizes worth ₹1,50,000 + internship interviews with top tech sponsors.',
      event_date: getDateOffset(5),
      start_time: '10:00 AM',
      end_time: '04:00 PM',
      venue: 'Computer Science Auditorium & Labs A-C',
      category: 'Competitions',
      registration_deadline: getDateOffset(1), // Tomorrow - URGENT!
      important_instructions: 'Bring your student college ID card, laptops, and chargers. Food and energy drinks provided.',
      source_text: 'Hey guys! Our annual coding competition CodeX 2026 is happening on 5 days from now at 10 AM in the Computer Science Auditorium. Registration closes tomorrow! Interested students should register ASAP.',
      missing_information: [],
      status: 'active'
    },
    {
      title: 'Mid-Semester Theory Examinations (Odd Sem)',
      description: 'Official commencement of Mid-Semester examinations for 2nd, 3rd, and 4th year B.Tech students. Seating arrangement will be posted on notice boards 30 minutes prior.',
      event_date: getDateOffset(0), // Today!
      start_time: '09:30 AM',
      end_time: '12:30 PM',
      venue: 'Exam Hall Complex (Blocks B & D)',
      category: 'Examinations',
      registration_deadline: null,
      important_instructions: 'Strictly no smartwatches or smartphones allowed. Bring physical hall ticket signed by HOD.',
      source_text: 'ATTENTION ALL STUDENTS: Mid-Sem theory exams begin today 9:30 AM at Exam Hall Complex. Hall tickets mandatory.',
      missing_information: [],
      status: 'active'
    },
    {
      title: 'Hands-on Generative AI & Agentic Systems Workshop',
      description: 'Full-day interactive technical workshop covering Gemini 1.5, LangChain, MCP protocol, and building production-ready autonomous coding agents.',
      event_date: getDateOffset(3),
      start_time: '11:00 AM',
      end_time: '05:00 PM',
      venue: 'Seminar Hall 3, Tech Tower',
      category: 'Workshops',
      registration_deadline: getDateOffset(2),
      important_instructions: 'Pre-requisite: basic Python understanding. GitHub Student Pack recommended.',
      source_text: 'Workshop alert: Hands-on Generative AI & Agentic Systems on 3 days from now, 11 AM in Seminar Hall 3. Limited to 80 seats.',
      missing_information: [],
      status: 'active'
    },
    {
      title: 'Database Management Systems Mini-Project Submission',
      description: 'Final submission of working SQLite/PostgreSQL schema, backend repository URL, and 10-page technical documentation to the Moodle portal.',
      event_date: getDateOffset(1), // Tomorrow - URGENT!
      start_time: '11:59 PM',
      end_time: '11:59 PM',
      venue: 'Online Moodle Portal',
      category: 'Assignments',
      registration_deadline: getDateOffset(1),
      important_instructions: 'Late submissions will face an automatic 20% penalty. Plagiarism checks will be enforced.',
      source_text: 'Reminder from Prof. Raghavan: DBMS Mini project submission deadline is tomorrow night 11:59 PM sharp on Moodle.',
      missing_information: [],
      status: 'active'
    },
    {
      title: 'Distinguished Lecture: Frontiers of Quantum Computing',
      description: 'Special guest lecture by Dr. Arvind Subramaniam, Senior Quantum Research Fellow at IISc Bangalore, on fault-tolerant quantum error correction.',
      event_date: getDateOffset(8),
      start_time: '02:00 PM',
      end_time: '04:00 PM',
      venue: 'Main University Amphitheatre',
      category: 'Seminars',
      registration_deadline: getDateOffset(6),
      important_instructions: 'Open to all engineering branches. High tea served after the talk.',
      source_text: 'Guest lecture: Quantum Computing Frontiers on 8 days from now at 2 PM, Main Amphitheatre. Guest: Dr. Arvind Subramaniam.',
      missing_information: [],
      status: 'active'
    },
    {
      title: 'Inter-Department Football Tournament Finals',
      description: 'Final championship clash between Computer Science & Information Technology vs Mechanical Engineering. Free refreshments for student spectators.',
      event_date: getDateOffset(2),
      start_time: '04:30 PM',
      end_time: '06:30 PM',
      venue: 'Campus Central Sports Ground',
      category: 'Sports',
      registration_deadline: null,
      important_instructions: 'Come in college colours to cheer your department!',
      source_text: 'SPORTS NOTICE: Football finals CS vs Mech this week at 4:30 PM, central sports ground!',
      missing_information: [],
      status: 'active'
    },
    {
      title: 'Robotics Club Autonomous Drone Bootcamp (Incomplete Notice)',
      description: 'Weekend crash course on ROS2, flight controllers, and obstacle avoidance sensors.',
      event_date: getDateOffset(12),
      start_time: null, // Test missing time!
      end_time: null,
      venue: 'TBA', // Test missing venue!
      category: 'Workshops',
      registration_deadline: null, // Test missing deadline!
      important_instructions: 'Parts kit will be loaned for the weekend.',
      source_text: 'Robotics club will organize an autonomous drone bootcamp soon for all interested batches. Stay tuned for time and venue.',
      missing_information: ['Exact Start Time', 'Specific Room/Lab Venue', 'Registration Deadline link'],
      status: 'active'
    },
    {
      title: 'Library Book Clearance & Caution Deposit Notice',
      description: 'Final deadline for all final-year graduating students to return borrowed reference books and obtain no-dues clearance certificate from the Central Library desk.',
      event_date: getDateOffset(15),
      start_time: '10:00 AM',
      end_time: '05:00 PM',
      venue: 'Central Library First Floor Circulation Desk',
      category: 'General Notices',
      registration_deadline: getDateOffset(14),
      important_instructions: 'Clear any overdue fines online before visiting the counter.',
      source_text: 'General Notice: Library clearance for graduating students closes mid month. Clear your dues.',
      missing_information: [],
      status: 'active'
    }
  ];

  for (const item of sampleAnnouncements) {
    createAnnouncement(item);
  }

  console.log(`Successfully seeded ${sampleAnnouncements.length} campus announcements.`);
  return sampleAnnouncements.length;
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedData(true);
}

