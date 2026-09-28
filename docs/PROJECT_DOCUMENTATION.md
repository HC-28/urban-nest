# UrbanNest — Real Estate Platform
## Complete Project Documentation

---

## 1. Project Overview

**UrbanNest** is a full-stack, production-grade real estate platform that enables buyers to discover, favorite, and schedule site visits for properties. Agents can list and manage properties and communicate directly with interested buyers. An admin oversees the entire platform — approving agents, managing listings, and monitoring analytics.

### Core Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router v6, Framer Motion |
| Styling | Vanilla CSS, React Icons (Feather) |
| Backend | Spring Boot 3 (Java 21), Spring Security 6 |
| Database | PostgreSQL (local dev / Neon cloud for prod) |
| Auth | JWT (JSON Web Tokens) + Google OAuth2 |
| Image Storage | Cloudinary CDN |
| Email | Brevo (Sendinblue) SMTP / Gmail SMTP |
| Maps | Leaflet.js + OpenStreetMap |
| Build | Maven (backend), Vite (frontend) |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│  React 18 SPA  ─── React Router ─── Axios API calls      │
└─────────────────────────┬────────────────────────────────┘
                          │  HTTPS / REST (JSON)
                          │  Authorization: Bearer <JWT>
┌─────────────────────────▼────────────────────────────────┐
│              SPRING BOOT BACKEND (:8083)                  │
│                                                           │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Security │  │  Controllers │  │    Services       │  │
│  │  Filter   │→ │  (REST API)  │→ │  (Business Logic) │  │
│  │  (JWT)    │  │              │  │                   │  │
│  └───────────┘  └──────────────┘  └────────┬─────────┘  │
│                                            │              │
│  ┌─────────────────────────────────────────▼──────────┐  │
│  │            JPA Repositories (Spring Data)          │  │
│  └─────────────────────────────────────────┬──────────┘  │
└────────────────────────────────────────────┼─────────────┘
                                             │
┌────────────────────────────────────────────▼─────────────┐
│              PostgreSQL Database                          │
│  Tables: app_users, properties, appointments,            │
│  chat_messages, agent_slots, favorites,                  │
│  agent_profiles, agencies, agent_reviews,                │
│  pincode_scores, property_views                          │
└──────────────────────────────────────────────────────────┘
                      │                │
             ┌────────▼───┐    ┌───────▼──────┐
             │ Cloudinary  │    │  SMTP Email  │
             │ (Images)    │    │  (Brevo)     │
             └────────────┘    └──────────────┘
```

---

## 3. User Roles & Permissions

The platform has **three distinct roles**, each with separate capabilities:

### 3.1 BUYER
- Browse all active, unsold properties
- Search and filter by location, type, BHK, price, amenities
- Save properties to favorites (max 10)
- Chat directly with the listing agent
- Request or book appointment slots
- View heatmap analytics (demand, price, market activity)
- Purchase history in dashboard

### 3.2 AGENT
- Must belong to a verified Agency (approved by Admin)
- Post and manage property listings with Cloudinary image uploads
- Create time-slot availability for site visits
- View all buyer inquiries and chats per property
- Assign appointment slots to pending buyer requests
- Mark properties as Sold through the confirmation workflow
- Dashboard: manage listings, view sales pipeline, review chats

### 3.3 ADMIN
- Approve or reject agencies and agents
- Moderate all property listings (approve, hide, delete)
- View all users, chats, appointments system-wide
- Hard-delete properties and users

---

## 4. Database Schema

### 4.1 Entity Relationships

```
app_users (id, name, email, password_hash, role, phone, profile_picture)
    │
    ├──< properties (id, title, type, purpose, price, area, bhk,
    │       agent_id → app_users.id, city, pin_code, lat, lng,
    │       views, favorites, inquiries, is_sold, sold_to_user_id,
    │       active, featured, photos, amenities, listed_date)
    │
    ├──< agent_profiles (id, user_id → app_users, bio, license_no,
    │       agency_id → agencies, verified, experience_years)
    │
    ├──< agent_slots (id, agent_id, property_id, slot_date, slot_time,
    │       duration_minutes, is_booked)
    │
    ├──< appointments (id, property_id, buyer_id, agent_id,
    │       buyer_name, buyer_email, buyer_phone, slot_id,
    │       appointment_date, appointment_time, status,
    │       buyer_confirmed, agent_confirmed, confirmation_deadline,
    │       created_at, sold_at)
    │
    ├──< chat_messages (id, property_id → properties, buyer_id,
    │       agent_id, sender [BUYER/AGENT/SYSTEM], message, seen, created_at)
    │
    ├──< favorites (id, user_id, property_id, created_at)
    │
    └──< property_views (id, user_id, property_id, viewed_at)

agencies (id, name, logo, verified, approved_by_admin)

agent_reviews (id, agent_id, buyer_id, property_id, rating, review_text)

pincode_scores (id, city, pincode, price_score, demand_score,
    market_activity_score, inventory_score, buyer_opportunity_score,
    active_listings, total_views, total_favorites, total_inquiries)
```

### 4.2 Appointment Status State Machine

```
[No appointment]
      │
      ▼ Buyer clicks "Request Appointment"
  [PENDING] ──── Agent assigns a slot ────► [CONFIRMED]
      │                                          │
      │                                          ▼ Agent clicks "Mark as Shown"
      │                                    [AWAITING_BUYER]
      │                                          │
      │                               Buyer confirms purchase?
      │                                   YES ▼     NO ▼
      │                           [AWAITING_AGENT] [EXPIRED]
      │                                   │
      │                         Agent approves sale?
      │                             YES ▼    NO ▼
      │                           [SOLD]   [EXPIRED]
      │
      └── Any party cancels ──────────────► [CANCELLED]
```

---

## 5. Backend Architecture

### 5.1 Package Structure

```
com.realestate.backend
├── BackendApplication.java         ← Spring Boot entry point
├── config/
│   └── SecurityConfig.java         ← CORS, JWT filter chain, OAuth2
├── controller/                     ← REST API endpoints (17 controllers)
│   ├── AuthController              ← Login, signup, OTP, Google OAuth
│   ├── PropertyController          ← CRUD + search + view tracking
│   ├── AppointmentController       ← Full booking workflow
│   ├── ChatController              ← Real-time-style messaging
│   ├── AgentSlotController         ← Slot management
│   ├── FavoriteController          ← Buyer wishlists
│   ├── AnalyticsController         ← Heatmap data
│   ├── AgencyController            ← Agency registration & approval
│   ├── AgentController             ← Agent profiles
│   ├── AdminController             ← Admin operations
│   ├── UserController              ← Profile management
│   ├── AgentReviewController       ← Rating system
│   └── UploadController            ← Cloudinary uploads
├── dto/                            ← Data Transfer Objects (API shapes)
├── entity/                         ← JPA entities (DB tables)
├── repository/                     ← Spring Data JPA interfaces
├── security/
│   ├── JwtUtil.java                ← Token generation & validation
│   └── JwtAuthenticationFilter     ← Per-request JWT check
├── service/
│   ├── AnalyticsService            ← Heatmap score computation
│   └── EmailService                ← Transactional email sending
└── util/
    └── SecurityUtils               ← Get current user from JWT context
```

### 5.2 Security Flow

```
HTTP Request
     │
     ▼
JwtAuthenticationFilter.doFilterInternal()
     │
     ├── Extract "Authorization: Bearer <token>" header
     ├── JwtUtil.validateToken(token)
     │       └── Verifies HMAC-SHA256 signature + expiry
     ├── Load user details from DB
     ├── Set SecurityContextHolder authentication
     │
     ▼
SecurityConfig route matchers
     ├── Public:  GET /api/properties/**, /api/agents/**, /api/auth/**
     └── Secured: POST/PUT/DELETE + all /dashboard, /appointments, /chat

Controller receives request
     └── SecurityUtils.getAuthenticatedUserId()
             └── Reads from SecurityContext → returns Long userId
```

### 5.3 API Endpoint Summary

| Resource | Method | Endpoint | Access |
|---|---|---|---|
| Auth | POST | `/api/auth/login` | Public |
| Auth | POST | `/api/auth/register` | Public |
| Auth | POST | `/api/auth/google` | Public |
| Auth | POST | `/api/auth/request-otp` | Public |
| Properties | GET | `/api/properties` | Public |
| Properties | GET | `/api/properties/{id}` | Public |
| Properties | POST | `/api/properties` | AGENT |
| Properties | GET | `/api/properties/featured` | Public |
| Properties | GET | `/api/properties/trending` | Public |
| Appointments | POST | `/api/appointments` | BUYER |
| Appointments | GET | `/api/appointments/buyer/me` | BUYER |
| Appointments | GET | `/api/appointments/agent/me` | AGENT |
| Appointments | POST | `/{id}/assign-slot` | AGENT |
| Appointments | POST | `/{id}/visit` | AGENT |
| Appointments | PUT | `/{id}/buyer-confirmation` | BUYER |
| Appointments | PUT | `/{id}/agent-confirmation` | AGENT |
| Chat | GET | `/api/chat/messages` | Auth |
| Chat | POST | `/api/chat/messages` | Auth |
| Chat | POST | `/api/chat/seen` | Auth |
| Slots | POST | `/api/slots` | AGENT |
| Slots | GET | `/api/slots/property/{id}` | Public |
| Favorites | POST | `/api/favorites` | BUYER |
| Analytics | GET | `/api/analytics/heatmap` | Public |
| Upload | POST | `/api/upload` | AGENT |
| Admin | GET | `/api/admin/users` | ADMIN |

---

## 6. Frontend Architecture

### 6.1 Project Structure

```
frontend/src/
├── App.jsx                   ← Route definitions (26 routes)
├── main.jsx                  ← React root, BrowserRouter
├── services/
│   └── api.js                ← Axios instances + JWT interceptor
├── context/
│   ├── CompareContext.jsx    ← Property comparison state
│   └── SearchContext.jsx     ← Global search bar state
├── utils/
│   ├── priceUtils.js         ← Format ₹ lakhs/crores
│   ├── imageUtils.js         ← Parse photo JSON/CSV
│   └── recentlyViewed.js    ← localStorage history
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx        ← Nav + search + profile drawer
│   │   ├── Footer.jsx
│   │   ├── BackToTop.jsx     ← Scroll-to-top FAB
│   │   └── ProfileDrawer.jsx ← Slide-in user menu
│   ├── property/
│   │   ├── SharedPropertyGrid.jsx ← Reusable property card grid
│   │   ├── ProjectDetailView.jsx  ← Premium project page
│   │   └── MapModal.jsx           ← Leaflet map popup
│   ├── dashboard/
│   │   └── AppointmentActionPanel.jsx ← Smart appointment widget
│   └── ui/
│       ├── CompareModal.jsx
│       └── CompareActionBanner.jsx
└── pages/
    ├── static/    Home, About, Contact, Terms, Privacy, NotFound
    ├── auth/      Login, Signup, ForgotPassword, VerifyEmail
    ├── property/  Properties, Buy, Rent, Projects, PropertyDetail, PostProperty
    ├── chat/      BuyerChats, AgentChats, BuyerPropertyChat, PropertyChat
    ├── directory/ Agents, Agencies, AgentProfile
    ├── user/      Dashboard, Profile, Favorites
    └── admin/     AdminDashboard
```

### 6.2 API Service Layer (api.js)

All HTTP calls go through typed Axios instances. The interceptor automatically:
- Attaches `Authorization: Bearer <token>` from `localStorage`
- Unwraps the standard `ApiResponse<T>` envelope: `{ success, data, error }`
- Redirects to `/login` on 401 Unauthorized

```javascript
// Example: appointmentApi usage
appointmentApi.getBuyerAppointments()   // GET /api/appointments/buyer/me
appointmentApi.post("", { propertyId }) // POST /api/appointments
appointmentApi.put(`/${id}/visit`, {})  // PUT /api/appointments/{id}/visit
```

### 6.3 Route Protection

```javascript
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
```

All buyer, agent, and admin pages are wrapped in `<ProtectedRoute>`.

---

## 7. Key Feature Workflows

### 7.1 User Registration & Authentication

```
1. User visits /signup
2. Fills name, email, password, role (BUYER or AGENT)
3. POST /api/auth/register → backend hashes password (BCrypt)
4. OTP sent via email (Brevo SMTP)
5. User verifies OTP → account activated
6. POST /api/auth/login → returns JWT token (24hr expiry)
7. Frontend stores token + user object in localStorage
8. All subsequent requests carry JWT in Authorization header
```

**Google OAuth2 flow:**
```
1. User clicks "Sign in with Google"
2. Google redirects with OAuth code
3. POST /api/auth/google with credential
4. Backend validates with Google, creates/finds user
5. Returns same JWT token as normal login
```

### 7.2 Property Discovery & Search

```
1. Buyer visits /buy or /rent
2. Frontend calls GET /api/properties with query params:
   ?type=Apartment&purpose=Buy&minPrice=5000000&city=Ahmedabad
3. Backend applies filters in Java stream pipeline
4. Returns List<PropertyListDTO> (lightweight, no full data)
5. Cards rendered in SharedPropertyGrid
6. Buyer clicks card → /property/:id
7. GET /api/properties/{id} returns PropertyDetailDTO (full data)
8. Backend increments view count (unique per user, via PropertyView table)
```

### 7.3 Property Listing by Agent

```
1. Agent visits /post-property (must be verified agent)
2. Fills form: title, type, price, area, BHK, amenities, location
3. Images uploaded: POST /api/upload → Cloudinary → returns URL
4. POST /api/properties with full property data + Cloudinary URLs
5. Backend sets property as active=true, featured=false by default
6. Property appears in listings immediately
```

### 7.4 Appointment Booking Flow

This is the most complex workflow in the system:

```
PHASE 1 — Buyer Requests Appointment
─────────────────────────────────────
1. Buyer opens property page → clicks "Book Appointment"
2. System shows available agent slots (GET /api/slots/property/{id})
3a. If buyer picks a slot:
    POST /api/appointments { propertyId, slotId }
    → status = "confirmed", slot.isBooked = true
    → Email sent to buyer with date/time
    → Auto chat: "🗓️ Appointment Booked! at HH:MM on YYYY-MM-DD"

3b. If no slot selected (pending request):
    POST /api/appointments { propertyId }
    → status = "pending"
    → Auto chat (BUYER): "🗓️ Appointment Requested"
    → Auto chat (SYSTEM): "✅ Request Received! Agent has been notified."

PHASE 2 — Agent Assigns Slot (for pending)
───────────────────────────────────────────
4. Agent sees 🔔 banner in Dashboard → "Appointments & Requests"
5. Agent opens property → AppointmentActionPanel shows "Assign Slot"
6. Agent picks a slot → POST /api/appointments/{id}/assign-slot { slotId }
7. Status → "confirmed", slot locked, buyer email sent

PHASE 3 — Site Visit & Sale Confirmation
─────────────────────────────────────────
8. After appointment date, agent clicks "Mark as Shown"
   POST /api/appointments/{id}/visit
   → status = "awaiting_buyer"

9. Buyer sees "Did you buy this?" in their dashboard
   PUT /api/appointments/{id}/buyer-confirmation { answer: "YES" }
   → status = "awaiting_agent"

10. Agent sees "Buyer confirmed purchase. Verify?"
    PUT /api/appointments/{id}/agent-confirmation { answer: "YES" }
    → status = "sold"
    → property.isSold = true, property.active = false
    → All other pending appointments for this property → CANCELLED
    → System chat broadcast to all other interested buyers: "Property SOLD"
    → Email to buyer confirming purchase
    → Email to other inquirers notifying sold status
```

### 7.5 Chat System

```
Architecture: Polling-based (5-second interval), not WebSocket

1. Buyer clicks "Chat with Agent" → navigates to /buyer/chat/{propertyId}/{agentId}
2. GET /api/chat/messages?propertyId=X&agentId=Y
   → Returns all messages for this buyer-agent-property thread
3. Buyer types message → POST /api/chat/messages { propertyId, agentId, sender, message }
4. Polling interval (setInterval 5s) refreshes messages
5. On open, POST /api/chat/seen marks messages as read
6. Agent sees unread count badge on their chat list
7. SYSTEM messages (appointment events) appear as distinct styled bubbles

Sender types:
- "BUYER"  → right-aligned teal bubble
- "AGENT"  → left-aligned dark bubble
- "SYSTEM" → centered gray notification strip
```

### 7.6 Heatmap Analytics

```
1. Buyer opens /buy → clicks "Map" in Navbar → MapModal opens
2. User selects city → GET /api/analytics/heatmap?city=Ahmedabad&mode=demand
3. Backend queries PincodeScore table (pre-computed on startup + property changes)
4. Score modes: price, demand, market_activity, inventory, buyer_opportunity
5. Frontend colors map circles by score (green=low → red=high)
6. Scores are computed by AnalyticsService:
   - Views per listing (engagement)
   - Favorites per listing
   - Median price per sqft
   - Avg days on market
   - Active listings ratio
   → Normalized 0–100 via percentile ranking
```

---

## 8. Data Flow Diagrams

### 8.1 Request Lifecycle

```
Browser                   Frontend (React)              Backend (Spring)           DB
  │                              │                             │                    │
  │──── User Action ────────────►│                             │                    │
  │                              │── Axios.post(...) ─────────►│                    │
  │                              │   Bearer: <JWT>             │                    │
  │                              │                    JwtFilter validates token     │
  │                              │                             │── findById(userId)─►│
  │                              │                             │◄── AppUser ────────│
  │                              │                    Controller logic              │
  │                              │                             │── save(entity) ───►│
  │                              │                             │◄── saved entity ───│
  │                              │◄── ApiResponse<T> ─────────│                    │
  │                   Interceptor unwraps .data                │                    │
  │                   setState(result)                         │                    │
  │◄─── UI re-renders ───────────│                             │                    │
```

### 8.2 Image Upload Flow

```
Agent selects image
       │
       ▼
Frontend: FormData with file
       │
       ▼
POST /api/upload
       │
       ▼
UploadController → Cloudinary SDK → Upload to "urban-nest" folder
       │
       ▼
Returns: { url: "https://res.cloudinary.com/..." }
       │
       ▼
Frontend stores URL, includes in POST /api/properties
       │
       ▼
Property.photos stored as comma-separated Cloudinary URLs in DB
```

---

## 9. Frontend State Management

UrbanNest uses **React's built-in state** (no Redux/Zustand) with:

| Mechanism | Used For |
|---|---|
| `useState` | Local component state (forms, UI toggles) |
| `useEffect` | Data fetching on mount / dependency change |
| `useRef` | Chat scroll-to-bottom, DOM refs |
| `useParams` | Read URL params (propertyId, agentId) |
| `useNavigate` | Programmatic routing |
| `localStorage` | JWT token + user object persistence |
| `CompareContext` | Cross-page property comparison (up to 3) |
| `SearchContext` | Global search bar state shared across Navbar |

---

## 10. Email Notifications

All transactional emails are sent via **Brevo (Sendinblue) SMTP** in production, with a Gmail SMTP fallback for local development.

| Trigger | Recipient | Content |
|---|---|---|
| Appointment booked (slot) | Buyer | Confirmation with date/time |
| Slot assigned by agent | Buyer | New slot details |
| Property sold | Winning buyer | Purchase confirmation |
| Property sold | Other inquirers | "Property no longer available" |
| Account registration | User | OTP verification code |
| Password reset | User | OTP for reset |

---

## 11. Security Considerations

| Concern | Implementation |
|---|---|
| Password storage | BCrypt hashing (strength 10) |
| Authentication | JWT (HS256, 24hr expiry) |
| Authorization | Role-checked in every controller method |
| User isolation | `SecurityUtils.getAuthenticatedUserId()` — never trusts client-provided userId |
| CORS | Configured to allow only `APP_FRONTEND_URL` |
| File uploads | Type + size validated (max 10MB) |
| SQL injection | Prevented by JPA/Hibernate parameterized queries |
| Agent verification | Agent must be approved by verified Agency before posting |

---

## 12. Deployment Architecture

```
Production:
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Vercel /    │────►│  Spring Boot JAR     │────►│  Neon PostgreSQL  │
│  Netlify     │     │  (Railway / Render)  │     │  (Cloud DB)       │
│  (React SPA) │     │  Port 8083           │     └──────────────────┘
└──────────────┘     └─────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │    Cloudinary CDN  │
                    │  (Image Storage)   │
                    └────────────────────┘

Environment Variables Required:
  JWT_SECRET                    ← HMAC signing key
  SPRING_DATASOURCE_URL         ← PostgreSQL connection string
  SPRING_DATASOURCE_USERNAME
  SPRING_DATASOURCE_PASSWORD
  SPRING_MAIL_USERNAME          ← Brevo SMTP credentials
  SPRING_MAIL_PASSWORD
  CLOUDINARY_URL                ← Cloudinary API credentials
  APP_FRONTEND_URL              ← CORS allowed origin
  VITE_API_URL                  ← Backend base URL (frontend)
```

---

## 13. Key Design Decisions

### 13.1 Why Polling Instead of WebSockets for Chat?
Chat uses a 5-second `setInterval` poll rather than WebSockets. This is intentional for simplicity — the app is a real estate platform where chat frequency is low, making WebSocket connection overhead unnecessary for a project scope.

### 13.2 Why Session-Based Appointment Lookup?
The `AppointmentActionPanel` always fetches from `/buyer/me` (session-based) rather than accepting a `buyerId` from the URL. This prevents a malicious actor from spoofing another buyer's appointment status by changing the URL parameter.

### 13.3 Why DTOs Instead of Raw Entities?
All API responses return `DTO` objects (Data Transfer Objects), not raw JPA entities. This:
- Prevents accidental exposure of password hashes
- Lets the API shape differ from the DB schema
- Avoids infinite JSON recursion from bidirectional JPA relationships

### 13.4 View Count Deduplication
Each property view is tracked in the `property_views` table (user + property). If a logged-in user revisits the same property, their `viewed_at` timestamp is updated but the public `views` counter is NOT incremented. Guest views always increment (anonymous tracking).

---

## 14. Glossary

| Term | Meaning |
|---|---|
| DTO | Data Transfer Object — API response shape |
| JPA | Java Persistence API — ORM standard |
| JWT | JSON Web Token — stateless auth mechanism |
| Slot | A specific agent availability window (date + time) |
| Pending | Appointment requested but no slot assigned yet |
| Confirmed | Appointment slot booked and locked |
| Awaiting Buyer | Site visit happened, awaiting buyer's purchase confirmation |
| Awaiting Agent | Buyer confirmed purchase, awaiting agent's final approval |
| Sold | Full sale lifecycle completed, property deactivated |
| PincodeScore | Pre-computed analytics score per area pincode |
| Heatmap | Visual map overlay showing area scores |
