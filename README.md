# 🏨 HostelOS — Smart Hostel Information & Management Portal v2.0

**SOLVE-A-THON 2026 · Theme 1 · PS02**

A premium, fully functional React + Vite hostel management platform — dark theme, smooth animations, persistent auth, 17 feature modules.

---

## 🚀 Quick Start

```bash
unzip hostel-os.zip
cd hostel-os
npm install
npm run dev          # → http://localhost:5173
npm run build        # production build
```

**Demo Login:** any email + any password. Switch between **Student** and **Admin** roles.
Session persists for 24 hours across page refreshes via localStorage.

---

## ✨ What's New in v2.0

| Feature | Details |
|---------|---------|
| **Persistent Auth** | Login survives page refresh (24h session via `useAuth` hook) |
| **Logout** | Works from sidebar AND topbar — clears localStorage session |
| **Lazy Loading** | All 17 pages lazy-loaded for fast initial render |
| **macOS Dock** | Animated magnification dock on Dashboard |
| **Today's Timeline** | Agenda panel on Dashboard with live progress |
| **Timetable Page** | Weekly class schedule, missed class alerts, day tabs |
| **OTP Roommate Verify** | 6-digit OTP flow in Room Allotment |
| **Laundry Token** | Booking generates a printable token with ID |
| **Camera Attendance** | GPS + camera capture mock in Attendance |
| **Image Upload** | Lost & Found supports photo + location tag |
| **Team Creation** | Events page: create/join hackathon teams |
| **Gym Slot Booking** | Paid/Free toggle + day/session/slot picker |
| **Mess Caterer UI** | Switch caterer, room service, nutrition radar chart |
| **Incident Report** | Hospital page: structured incident form |
| **Admin Heatmap** | Activity heatmap by day + hour |
| **Admin Fees Tab** | Monthly fee collection bar chart |
| **Admin Insights** | Top compliance room, most complaints, best mess day |
| **Search & Filter** | Admin student table: live search + year filter |

---

## 📁 Project Structure

```
hostel-os/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx       # Collapsible nav + logout
│   │   │   └── Topbar.jsx        # Notifications + logout
│   │   └── ui/
│   │       └── index.jsx         # 15+ shared components
│   │
│   ├── hooks/
│   │   ├── useAuth.js            # Persistent auth (localStorage)
│   │   └── useLocalStorage.js    # Generic persisted state
│   │
│   ├── utils/
│   │   └── index.js              # fmt, fmtDate, greet, randomId…
│   │
│   ├── data/
│   │   └── mockData.js           # All data — swap with API calls
│   │
│   ├── pages/
│   │   ├── Login.jsx             # Animated split-screen login
│   │   ├── Dashboard.jsx         # macOS dock + charts + timeline
│   │   ├── MyInfo.jsx            # Profile + rank + credentials
│   │   ├── Attendance.jsx        # GPS + camera mock flow
│   │   ├── EntryExit.jsx         # Color-coded logs
│   │   ├── Room.jsx              # OTP verify + swap portal
│   │   ├── Timetable.jsx         # NEW: Schedule + missed alerts
│   │   ├── Mess.jsx              # QR + menu + radar + caterer
│   │   ├── Laundry.jsx           # Paid/free + token generation
│   │   ├── Complaints.jsx        # Categories + analytics
│   │   ├── Leave.jsx             # Leave/outing apply
│   │   ├── Fees.jsx              # Payment + history
│   │   ├── LostFound.jsx         # Image upload + location tag
│   │   ├── Events.jsx            # Register + team creation
│   │   ├── Gym.jsx               # Slot booking + schedule
│   │   ├── Counselling.jsx       # Anonymous + slot picker
│   │   ├── Hospital.jsx          # Ambulance + incident report
│   │   └── Admin.jsx             # 6-tab dashboard + heatmap
│   │
│   ├── App.jsx                   # Lazy routing + auth gate
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Dark design system
│
├── index.html
├── vite.config.js
└── package.json
```

---

## 🎨 Design System

**Colors** (change `--accent` in `index.css` to rebrand):
- Primary: `#6366f1` (Indigo)
- Purple: `#a855f7`
- Green/Amber/Red for semantic status

**Fonts:** DM Sans (body) + Space Grotesk (headings)

**Components** (`src/components/ui/index.jsx`):
`StatCard` `Badge` `StatusBadge` `PriorityBadge` `ProgressBar`
`Avatar` `StarRating` `Card` `Modal` `Field` `EmptyState`
`SectionHeader` `TimelineItem` `ChipFilter` `GlowCard` `InfoRow` `IconBox`

---

## 🔌 Backend Integration Checklist

- [ ] Replace `mockData.js` exports with `fetch`/`axios` API calls
- [ ] Connect `useAuth.js` to real JWT login endpoint
- [ ] Add React Query or SWR for caching + loading states
- [ ] Real GPS geofence check in `Attendance.jsx`
- [ ] Real camera/WebRTC in `Attendance.jsx`
- [ ] OTP verification via SMS gateway in `Room.jsx`
- [ ] File upload to S3/CDN in `LostFound.jsx`
- [ ] Payment gateway (Razorpay) in `Fees.jsx`
- [ ] Push notifications for leave approvals / complaint updates
- [ ] WebSocket for live admin activity feed

---

## 📦 Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 + Vite 8 | Framework + build |
| Recharts | All charts |
| Lucide React | Icons |
| Framer Motion | Available for enhanced animations |
| date-fns | Date formatting |

---

*Built for SOLVE-A-THON 2026 · Anthropic Claude*
