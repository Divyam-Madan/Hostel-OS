// ─── STUDENT INFO ───────────────────────────────────────────────────────────
export const currentUser = {
  id: 'S2024001',
  name: 'Arjun Sharma',
  email: 'arjun.sharma@college.edu',
  roll: '21CS101',
  branch: 'Computer Science & Engineering',
  year: '3rd Year',
  room: 'B-204',
  hostel: 'Block B – Visvesvaraya Hall',
  phone: '+91 98765 43210',
  parentPhone: '+91 91234 56789',
  admissionDate: '2021-07-15',
  bloodGroup: 'O+',
  proctor: 'Dr. Meera Nair',
  proctorEmail: 'meera.nair@college.edu',
  proctorPhone: '+91 94455 66778',
  photo: 'AS',
  role: 'student', // 'admin' | 'student'
};

export const roommates = [
  { id: 'S2024002', name: 'Rahul Verma',   roll: '21CS102', email: 'rahul.v@college.edu', photo: 'RV' },
  { id: 'S2024003', name: 'Dev Patel',      roll: '21ME045', email: 'dev.p@college.edu',  photo: 'DP' },
];

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
export const attendanceData = {
  percentage: 87.3,
  present: 162,
  absent: 24,
  leave: 8,
  history: [
    { date: '2024-12-01', status: 'present', time: '10:32 PM' },
    { date: '2024-11-30', status: 'present', time: '10:58 PM' },
    { date: '2024-11-29', status: 'absent',  time: null },
    { date: '2024-11-28', status: 'present', time: '11:04 PM' },
    { date: '2024-11-27', status: 'leave',   time: null },
    { date: '2024-11-26', status: 'present', time: '10:22 PM' },
    { date: '2024-11-25', status: 'present', time: '10:45 PM' },
    { date: '2024-11-24', status: 'absent',  time: null },
  ],
  chartData: [
    { month: 'Jul', pct: 92 }, { month: 'Aug', pct: 88 },
    { month: 'Sep', pct: 95 }, { month: 'Oct', pct: 84 },
    { month: 'Nov', pct: 87 }, { month: 'Dec', pct: 90 },
  ],
};

// ─── MESS ────────────────────────────────────────────────────────────────────
export const messMenu = {
  date: new Date().toDateString(),
  meals: [
    {
      id: 'breakfast',
      label: 'Breakfast',
      time: '7:00 – 9:00 AM',
      icon: '🌅',
      items: ['Idli Sambar', 'Coconut Chutney', 'Boiled Eggs', 'Bread & Butter', 'Tea / Coffee'],
      rating: 4.2,
      votes: 134,
    },
    {
      id: 'lunch',
      label: 'Lunch',
      time: '12:00 – 2:00 PM',
      icon: '☀️',
      items: ['Rice', 'Dal Tadka', 'Paneer Butter Masala', 'Roti', 'Raita', 'Salad', 'Papad'],
      rating: 4.5,
      votes: 220,
    },
    {
      id: 'snacks',
      label: 'Evening Snacks',
      time: '5:00 – 6:00 PM',
      icon: '☕',
      items: ['Vada Pav', 'Tea / Milk', 'Biscuits', 'Fruit'],
      rating: 3.8,
      votes: 98,
    },
    {
      id: 'dinner',
      label: 'Dinner',
      time: '7:30 – 9:30 PM',
      icon: '🌙',
      items: ['Rice', 'Rajma', 'Mixed Veg', 'Roti', 'Curd', 'Sweet – Halwa'],
      rating: 4.1,
      votes: 198,
    },
  ],
  feedbackTrend: [
    { day: 'Mon', breakfast: 4.0, lunch: 4.3, dinner: 3.9 },
    { day: 'Tue', breakfast: 4.2, lunch: 4.5, dinner: 4.1 },
    { day: 'Wed', breakfast: 3.8, lunch: 4.2, dinner: 4.3 },
    { day: 'Thu', breakfast: 4.4, lunch: 4.6, dinner: 4.0 },
    { day: 'Fri', breakfast: 4.1, lunch: 4.5, dinner: 4.2 },
    { day: 'Sat', breakfast: 4.5, lunch: 4.8, dinner: 4.5 },
    { day: 'Sun', breakfast: 4.6, lunch: 4.7, dinner: 4.6 },
  ],
  aiInsights: [
    { icon: '🏆', text: 'Most liked dish this week: Paneer Butter Masala (4.8★)' },
    { icon: '📉', text: 'Low rating trend: Wednesday evening snacks dipping below 3.5★' },
    { icon: '👥', text: '89% mess attendance today — higher than weekly average' },
    { icon: '♻️', text: 'Food waste reduced by 12% compared to last week' },
  ],
};

export const messAttendance = {
  today: { breakfast: true, lunch: true, snacks: false, dinner: null },
  missedMeals: 3,
};

// ─── COMPLAINTS ──────────────────────────────────────────────────────────────
export const complaints = [
  { id: 'C001', category: 'AC / Cooling',   title: 'AC not cooling in room B-204',          priority: 'high',   status: 'in-progress', date: '2024-12-01', icon: '❄️', updatedAt: '2 hours ago' },
  { id: 'C002', category: 'Water',          title: 'Water leakage in bathroom',             priority: 'high',   status: 'pending',     date: '2024-11-30', icon: '💧', updatedAt: '1 day ago' },
  { id: 'C003', category: 'Cleaning',       title: 'Common area not cleaned for 3 days',   priority: 'medium', status: 'resolved',    date: '2024-11-25', icon: '🧹', updatedAt: '3 days ago' },
  { id: 'C004', category: 'Electricity',    title: 'Tube light flickering in corridor',     priority: 'low',    status: 'resolved',    date: '2024-11-20', icon: '💡', updatedAt: '5 days ago' },
  { id: 'C005', category: 'Mosquito',       title: 'Mosquito fogging not done this month',  priority: 'medium', status: 'pending',     date: '2024-11-28', icon: '🦟', updatedAt: '2 days ago' },
  { id: 'C006', category: 'Window/Door',    title: 'Window latch broken in B-204',          priority: 'medium', status: 'in-progress', date: '2024-11-27', icon: '🪟', updatedAt: '3 days ago' },
];

export const complaintCategories = [
  { label: 'AC / Cooling',   icon: '❄️', color: '#3b82f6' },
  { label: 'Water',          icon: '💧', color: '#06b6d4' },
  { label: 'Cleaning',       icon: '🧹', color: '#10b981' },
  { label: 'Electricity',    icon: '💡', color: '#f59e0b' },
  { label: 'Mosquito/Pest',  icon: '🦟', color: '#84cc16' },
  { label: 'Window/Door',    icon: '🪟', color: '#8b5cf6' },
  { label: 'Internet/WiFi',  icon: '📡', color: '#ec4899' },
  { label: 'Furniture',      icon: '🪑', color: '#f97316' },
  { label: 'Mirror/Sanitary',icon: '🪞', color: '#a855f7' },
  { label: 'Toilet/Drain',   icon: '🚿', color: '#64748b' },
];

export const complaintsByCategory = [
  { name: 'AC/Cooling',   count: 18 }, { name: 'Water',      count: 24 },
  { name: 'Cleaning',     count: 12 }, { name: 'Electricity', count: 8  },
  { name: 'Mosquito',     count: 15 }, { name: 'Window',      count: 6  },
];

// ─── LEAVE & OUTING ──────────────────────────────────────────────────────────
export const leaveRequests = [
  { id: 'L001', type: 'leave',  from: '2024-12-05', to: '2024-12-08', reason: 'Family function – sister\'s engagement ceremony', status: 'approved',  appliedOn: '2024-11-28' },
  { id: 'L002', type: 'outing', from: '2024-11-25', to: '2024-11-25', reason: 'Medical appointment at city hospital',             status: 'approved',  appliedOn: '2024-11-24' },
  { id: 'L003', type: 'leave',  from: '2024-11-10', to: '2024-11-13', reason: 'Diwali vacation at hometown',                     status: 'approved',  appliedOn: '2024-11-08' },
  { id: 'L004', type: 'outing', from: '2024-12-20', to: '2024-12-20', reason: 'Shopping mall visit with friends',                 status: 'pending',   appliedOn: '2024-12-01' },
  { id: 'L005', type: 'leave',  from: '2024-10-02', to: '2024-10-04', reason: 'Personal work at home',                           status: 'rejected',  appliedOn: '2024-10-01' },
];

// ─── LAUNDRY ─────────────────────────────────────────────────────────────────
export const laundrySlots = [
  { id: 1, time: '6:00 AM – 7:00 AM',   available: false, bookedBy: 'Rahul V.' },
  { id: 2, time: '7:00 AM – 8:00 AM',   available: true  },
  { id: 3, time: '8:00 AM – 9:00 AM',   available: true  },
  { id: 4, time: '9:00 AM – 10:00 AM',  available: false, bookedBy: 'You' },
  { id: 5, time: '10:00 AM – 11:00 AM', available: true  },
  { id: 6, time: '11:00 AM – 12:00 PM', available: false, bookedBy: 'Dev P.' },
  { id: 7, time: '4:00 PM – 5:00 PM',   available: true  },
  { id: 8, time: '5:00 PM – 6:00 PM',   available: true  },
  { id: 9, time: '6:00 PM – 7:00 PM',   available: false, bookedBy: 'Kiran M.' },
  { id: 10,time: '7:00 PM – 8:00 PM',   available: true  },
];

// ─── HOSTEL FEES ─────────────────────────────────────────────────────────────
export const feeData = {
  total: 85000,
  paid: 60000,
  due: 25000,
  dueDate: '2025-01-15',
  payments: [
    { id: 'F001', amount: 30000, date: '2024-07-10', semester: '1st Sem 2024-25', method: 'UPI',          status: 'paid' },
    { id: 'F002', amount: 20000, date: '2024-09-05', semester: '1st Sem 2024-25', method: 'Net Banking',   status: 'paid' },
    { id: 'F003', amount: 10000, date: '2024-11-20', semester: '2nd Sem 2024-25', method: 'UPI',          status: 'paid' },
    { id: 'F004', amount: 25000, date: null,          semester: '2nd Sem 2024-25', method: null,           status: 'due'  },
  ],
};

// ─── LOST & FOUND ────────────────────────────────────────────────────────────
export const lostFoundItems = [
  { id: 'LF001', type: 'lost',  title: 'Black JBL Earphones',      desc: 'Lost near mess area on Nov 28',     location: 'Mess Hall',      date: '2024-11-28', postedBy: 'Arjun S.', emoji: '🎧', status: 'open' },
  { id: 'LF002', type: 'found', title: 'Blue Water Bottle',         desc: 'Found in Block B common room',      location: 'Block B',        date: '2024-11-30', postedBy: 'Priya K.', emoji: '🍶', status: 'claimed' },
  { id: 'LF003', type: 'lost',  title: 'Casio Scientific Calculator',desc: 'Last seen in 3rd floor study room', location: 'Study Room 3',  date: '2024-11-29', postedBy: 'Rahul M.', emoji: '🔢', status: 'open' },
  { id: 'LF004', type: 'found', title: 'ID Card – Sneha Reddy',     desc: 'Found near gym entrance',           location: 'Gym',            date: '2024-12-01', postedBy: 'Admin',    emoji: '🪪', status: 'open' },
  { id: 'LF005', type: 'lost',  title: 'Grey Hoodie (M size)',       desc: 'Forgotten in laundry room',         location: 'Laundry',        date: '2024-11-27', postedBy: 'Dev P.',   emoji: '👕', status: 'open' },
  { id: 'LF006', type: 'found', title: 'Power Bank (Realme 20000mAh)',desc: 'Submitted to warden office',       location: 'Warden Office',  date: '2024-12-01', postedBy: 'Admin',    emoji: '🔋', status: 'open' },
];

// ─── EVENTS ──────────────────────────────────────────────────────────────────
export const events = [
  { id: 'E001', title: 'Inter-Hostel Hackathon 2024',    date: '2024-12-15', time: '9:00 AM', venue: 'LH-101', category: 'hackathon', registered: true,  seats: 120, filled: 98,  prize: '₹50,000', emoji: '💻' },
  { id: 'E002', title: 'Fresher\'s Night – Rhythm 2024', date: '2024-12-20', time: '6:00 PM', venue: 'Open Amphitheater', category: 'cultural', registered: false, seats: 500, filled: 320, prize: null, emoji: '🎭' },
  { id: 'E003', title: 'Table Tennis Tournament',         date: '2024-12-10', time: '4:00 PM', venue: 'Sports Complex', category: 'sports', registered: false, seats: 32,  filled: 28,  prize: '₹5,000', emoji: '🏓' },
  { id: 'E004', title: 'Photography Contest',             date: '2024-12-18', time: '10:00 AM', venue: 'Online', category: 'art', registered: true, seats: 200, filled: 145, prize: '₹10,000', emoji: '📸' },
  { id: 'E005', title: 'Annual Alumni Meet',              date: '2025-01-05', time: '11:00 AM', venue: 'Main Auditorium', category: 'networking', registered: false, seats: 300, filled: 87, prize: null, emoji: '🤝' },
];

// ─── GYM ─────────────────────────────────────────────────────────────────────
export const gymData = {
  registered: true,
  memberSince: '2024-08-01',
  plan: '6 Months',
  expiresOn: '2025-02-01',
  timings: 'Mon–Sat: 5:30 AM – 8:00 AM & 5:00 PM – 9:00 PM',
  currentCapacity: 18,
  maxCapacity: 40,
  trainer: 'Mr. Ramesh Kumar',
  equipment: ['Treadmill (4 units)','Dumbbells (5–50 kg)','Barbell Sets','Bench Press','Pull-up Bar','Cycle (3 units)','Rowing Machine'],
};

// ─── COUNSELLING ─────────────────────────────────────────────────────────────
export const counsellingSlots = [
  { id: 1, date: '2024-12-05', day: 'Thu', slots: ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'] },
  { id: 2, date: '2024-12-09', day: 'Mon', slots: ['10:00 AM', '11:00 AM', '12:00 PM', '3:00 PM', '4:00 PM'] },
  { id: 3, date: '2024-12-11', day: 'Wed', slots: ['10:00 AM', '2:00 PM', '3:00 PM'] },
  { id: 4, date: '2024-12-13', day: 'Fri', slots: ['11:00 AM', '12:00 PM', '4:00 PM'] },
];

// ─── ROOM ALLOTMENT ──────────────────────────────────────────────────────────
export const availableRooms = [
  { room: 'A-101', block: 'A', floor: 1, capacity: 3, occupants: 1, type: 'Triple', vacancies: 2, amenities: ['AC', 'WiFi', 'Attached Bath'] },
  { room: 'A-203', block: 'A', floor: 2, capacity: 2, occupants: 1, type: 'Double', vacancies: 1, amenities: ['WiFi', 'Common Bath'] },
  { room: 'C-301', block: 'C', floor: 3, capacity: 4, occupants: 2, type: 'Quad',   vacancies: 2, amenities: ['Fan', 'WiFi', 'Common Bath'] },
  { room: 'B-102', block: 'B', floor: 1, capacity: 3, occupants: 2, type: 'Triple', vacancies: 1, amenities: ['AC', 'WiFi', 'Attached Bath'] },
];

// ─── ENTRY/EXIT LOGS ─────────────────────────────────────────────────────────
export const entryExitLogs = [
  { id: 1, date: '2024-12-01', checkIn: '10:28 PM', status: 'normal',   statusLabel: 'On Time' },
  { id: 2, date: '2024-11-30', checkIn: '11:05 PM', status: 'warning',  statusLabel: 'Moderately Late' },
  { id: 3, date: '2024-11-29', checkIn: '10:55 PM', status: 'normal',   statusLabel: 'On Time' },
  { id: 4, date: '2024-11-28', checkIn: '12:30 AM', status: 'danger',   statusLabel: 'Extremely Late' },
  { id: 5, date: '2024-11-27', checkIn: null,        status: 'leave',    statusLabel: 'On Leave' },
  { id: 6, date: '2024-11-26', checkIn: '10:40 PM', status: 'normal',   statusLabel: 'On Time' },
  { id: 7, date: '2024-11-25', checkIn: '11:15 PM', status: 'warning',  statusLabel: 'Moderately Late' },
  { id: 8, date: '2024-11-24', checkIn: '10:30 PM', status: 'normal',   statusLabel: 'On Time' },
];

// ─── HOSPITAL / AMBULANCE ────────────────────────────────────────────────────
export const hospitalData = {
  healthCenter: { name: 'Campus Health Centre', phone: '0471-2598765', timing: '24×7', location: 'Near Admin Block' },
  nearbyHospitals: [
    { name: 'Government Medical College', distance: '4.2 km', phone: '0471-2523100', type: 'Government' },
    { name: 'KIMS Hospital',              distance: '6.8 km', phone: '0471-2977000', type: 'Private' },
    { name: 'Ananthapuri Hospital',       distance: '8.1 km', phone: '0471-2571100', type: 'Private' },
  ],
};

// ─── ADMIN DASHBOARD DATA ────────────────────────────────────────────────────
export const adminStats = {
  totalStudents: 624,
  activeComplaints: 34,
  pendingLeaves: 12,
  messAttendanceToday: 89,
  pendingFees: 87,
  openRooms: 6,
};

export const adminStudents = [
  { id: 'S001', name: 'Arjun Sharma',   room: 'B-204', branch: 'CSE', year: '3rd', fees: 'paid',    attendance: 87, status: 'active' },
  { id: 'S002', name: 'Priya Nair',     room: 'A-103', branch: 'ECE', year: '2nd', fees: 'due',     attendance: 92, status: 'active' },
  { id: 'S003', name: 'Rohan Mehta',    room: 'C-301', branch: 'ME',  year: '4th', fees: 'paid',    attendance: 74, status: 'active' },
  { id: 'S004', name: 'Sneha Reddy',    room: 'A-205', branch: 'CE',  year: '1st', fees: 'partial', attendance: 96, status: 'active' },
  { id: 'S005', name: 'Akhil Kumar',    room: 'B-108', branch: 'CSE', year: '3rd', fees: 'due',     attendance: 65, status: 'active' },
  { id: 'S006', name: 'Divya Pillai',   room: 'C-404', branch: 'IT',  year: '2nd', fees: 'paid',    attendance: 91, status: 'active' },
];

export const recentActivity = [
  { id:1, type:'leave',     text:'Arjun Sharma applied for leave (Dec 5–8)',          time:'2 hrs ago',  color:'blue' },
  { id:2, type:'complaint', text:'New complaint: Water leakage in Block B bathroom',   time:'3 hrs ago',  color:'red' },
  { id:3, type:'fee',       text:'Priya Nair paid ₹15,000 via UPI',                   time:'5 hrs ago',  color:'green' },
  { id:4, type:'mess',      text:'Mess rating dropped: Tuesday snacks rated 3.1★',    time:'6 hrs ago',  color:'amber' },
  { id:5, type:'room',      text:'Room swap request: Rohan Mehta ↔ Akhil Kumar',      time:'1 day ago',  color:'purple' },
  { id:6, type:'event',     text:'48 new registrations for Inter-Hostel Hackathon',   time:'1 day ago',  color:'teal' },
];

// ─── TIMETABLE ────────────────────────────────────────────────────────────────
export const timetable = {
  Mon: [
    { time: '8:00',  subject: 'Data Structures',     room: 'LH-201', type: 'lecture',  faculty: 'Dr. Kumar' },
    { time: '10:00', subject: 'DBMS Lab',             room: 'CL-103', type: 'lab',      faculty: 'Dr. Priya' },
    { time: '2:00',  subject: 'Computer Networks',   room: 'LH-301', type: 'lecture',  faculty: 'Dr. Singh' },
  ],
  Tue: [
    { time: '9:00',  subject: 'Operating Systems',   room: 'LH-202', type: 'lecture',  faculty: 'Dr. Rao' },
    { time: '11:00', subject: 'Software Engineering',room: 'LH-101', type: 'lecture',  faculty: 'Dr. Nair' },
    { time: '3:00',  subject: 'DSA Lab',              room: 'CL-201', type: 'lab',      faculty: 'Dr. Kumar' },
  ],
  Wed: [
    { time: '8:00',  subject: 'Computer Networks',   room: 'LH-301', type: 'lecture',  faculty: 'Dr. Singh' },
    { time: '10:00', subject: 'Data Structures',     room: 'LH-201', type: 'lecture',  faculty: 'Dr. Kumar' },
    { time: '2:00',  subject: 'Mini Project',         room: 'PL-102', type: 'project',  faculty: 'Dr. Meera' },
  ],
  Thu: [
    { time: '9:00',  subject: 'DBMS',                room: 'LH-202', type: 'lecture',  faculty: 'Dr. Priya' },
    { time: '11:00', subject: 'Operating Systems',   room: 'LH-202', type: 'lecture',  faculty: 'Dr. Rao' },
    { time: '3:00',  subject: 'Seminar',              room: 'SH-01',  type: 'seminar',  faculty: 'Dr. Nair' },
  ],
  Fri: [
    { time: '8:00',  subject: 'Software Engineering',room: 'LH-101', type: 'lecture',  faculty: 'Dr. Nair' },
    { time: '10:00', subject: 'Networks Lab',         room: 'CL-104', type: 'lab',      faculty: 'Dr. Singh' },
    { time: '2:00',  subject: 'Elective: AI/ML',      room: 'LH-203', type: 'lecture',  faculty: 'Dr. Rao' },
  ],
};

export const missedClasses = [
  { date: '2024-11-28', subject: 'Data Structures', time: '8:00 AM', reason: 'Absent' },
  { date: '2024-11-21', subject: 'Networks Lab',    time: '10:00 AM', reason: 'Absent' },
  { date: '2024-11-14', subject: 'DBMS',            time: '9:00 AM', reason: 'On Leave' },
];

// ─── TODAY'S EVENTS ───────────────────────────────────────────────────────────
export const todayTimeline = [
  { time: '7:00 AM',  label: 'Breakfast',              type: 'mess',      done: true  },
  { time: '8:00 AM',  label: 'Data Structures class',  type: 'class',     done: true  },
  { time: '10:00 AM', label: 'DBMS Lab',               type: 'class',     done: true  },
  { time: '12:30 PM', label: 'Lunch',                  type: 'mess',      done: true  },
  { time: '2:00 PM',  label: 'Computer Networks',      type: 'class',     done: false },
  { time: '5:30 PM',  label: 'Gym session',            type: 'gym',       done: false },
  { time: '7:30 PM',  label: 'Dinner',                 type: 'mess',      done: false },
  { time: '8:00 PM',  label: 'Hackathon team meeting', type: 'event',     done: false },
  { time: '10:30 PM', label: 'Check-in deadline',      type: 'hostel',    done: false },
];
