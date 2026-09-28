# 🏗️ Urban Nest — MNC Frontend Architecture Guide

## Current vs Target Structure

### ❌ Current Structure (File-Type Based — Anti-Pattern)
```
src/
  components/      ← Mixed concerns, no feature grouping
    dashboard/
    layout/
    property/
    ui/
  pages/          ← Separated from their components
    admin/
    auth/
    chat/
    directory/
    property/
    static/
    user/
  services/       ← Single massive api.js file
  context/        ← Global state scattered
  utils/
```

### ✅ Target Structure (Feature-Based — MNC Standard)
```
src/
  ├── features/                    # Feature modules (self-contained)
  │   ├── auth/                    # Authentication & Authorization
  │   │   ├── components/          # Login, Signup, OTP form components
  │   │   ├── pages/               # Login.jsx, Signup.jsx, VerifyEmail.jsx
  │   │   ├── hooks/               # useAuth.js, useOtp.js
  │   │   ├── services/            # authApi.js (only auth endpoints)
  │   │   ├── store/               # authContext.jsx / authSlice.js
  │   │   └── index.js             # Public exports from this feature
  │   │
  │   ├── properties/              # Property listings, search, browse
  │   │   ├── components/          # PropertyCard, SharedPropertyGrid
  │   │   ├── pages/               # Buy.jsx, Rent.jsx, Properties.jsx
  │   │   ├── hooks/               # useProperties.js, useSearch.js
  │   │   ├── services/            # propertyApi.js
  │   │   └── index.js
  │   │
  │   ├── property-detail/         # Single property view
  │   │   ├── components/          # Gallery, ContactForm, ReviewSection
  │   │   ├── pages/               # PropertyDetail.jsx
  │   │   ├── hooks/               # usePropertyDetail.js, useReviews.js
  │   │   └── index.js
  │   │
  │   ├── heatmap/                 # 🗺️ Map & Heatmap (isolated module)
  │   │   ├── components/
  │   │   │   ├── MapModal.jsx      # Main heatmap modal
  │   │   │   ├── MapToolbar.jsx    # City/mode/filter toolbar
  │   │   │   ├── HeatmapLegend.jsx # Legend widget
  │   │   │   ├── MiniPropertyPanel.jsx  # Right-side property drawer
  │   │   │   ├── RecenterMap.jsx   # Leaflet utility component
  │   │   │   └── PropertyPins.jsx  # Property marker layer
  │   │   ├── hooks/
  │   │   │   ├── useHeatmapData.js # Fetch + parse heatmap API
  │   │   │   └── useGeoJSON.js     # GeoJSON loader with path fix
  │   │   ├── services/
  │   │   │   └── analyticsApi.js   # Heatmap-specific API calls
  │   │   ├── utils/
  │   │   │   ├── colorUtils.js     # getColor(), palette definitions
  │   │   │   └── geoUtils.js       # getPolygonCentroid(), etc.
  │   │   ├── constants/
  │   │   │   └── heatmapConfig.js  # CITIES, PALETTES, SCORE_DESCRIPTIONS
  │   │   ├── styles/
  │   │   │   ├── Map.css           # Leaflet overrides
  │   │   │   └── MapModal.css      # Modal layout
  │   │   └── index.js              # export { MapModal }
  │   │
  │   ├── dashboard/               # Agent/Buyer dashboard
  │   │   ├── components/          # AppointmentActionPanel, AgencyManagement
  │   │   ├── pages/               # Dashboard.jsx, AdminDashboard.jsx
  │   │   ├── hooks/               # useDashboard.js
  │   │   └── index.js
  │   │
  │   ├── chat/                    # Messaging system
  │   │   ├── components/
  │   │   ├── pages/               # AgentChats.jsx, BuyerChats.jsx
  │   │   ├── hooks/               # useChat.js, useMessages.js
  │   │   ├── services/            # chatApi.js
  │   │   └── index.js
  │   │
  │   ├── agents/                  # Agent directory & profiles
  │   │   ├── components/
  │   │   ├── pages/               # Agents.jsx, AgentProfile.jsx
  │   │   └── index.js
  │   │
  │   ├── favorites/               # Saved properties ("cart")
  │   │   ├── pages/               # Favorites.jsx
  │   │   ├── hooks/               # useFavorites.js
  │   │   ├── services/            # favoritesApi.js
  │   │   └── index.js
  │   │
  │   ├── profile/                 # User profile management
  │   │   ├── pages/               # Profile.jsx
  │   │   ├── components/          # ProfileForm, ProfileDrawer
  │   │   └── index.js
  │   │
  │   └── projects/                # New development projects
  │       ├── components/          # ProjectDetailView
  │       ├── pages/               # Projects.jsx
  │       └── index.js
  │
  ├── shared/                      # Truly shared, feature-agnostic code
  │   ├── components/
  │   │   ├── layout/              # Navbar, Footer, BackToTop
  │   │   ├── ui/                  # SkeletonLoaders, ErrorBoundary, ThemeToggle
  │   │   ├── compare/             # CompareModal, CompareActionBanner
  │   │   └── common/              # EntityLink, StatusBadge
  │   ├── hooks/
  │   │   ├── useLocalStorage.js   # Safe localStorage with try-catch
  │   │   ├── useDebounce.js       # Input debouncing
  │   │   └── useIntersection.js   # Viewport detection
  │   ├── utils/
  │   │   ├── imageUtils.js
  │   │   ├── priceUtils.js
  │   │   ├── recentlyViewed.js
  │   │   └── constants.js
  │   └── styles/
  │       ├── themes.css           # CSS custom properties
  │       └── index.css            # Global reset
  │
  ├── services/                    # Shared API infrastructure only
  │   └── apiClient.js             # Axios instance factory, interceptors
  │                                # (Each feature has its own api.js using this)
  │
  ├── store/                       # Global application state
  │   ├── SearchContext.jsx
  │   ├── ThemeContext.jsx
  │   └── CompareContext.jsx
  │
  ├── router/                      # Route definitions
  │   └── AppRouter.jsx            # All route declarations in one place
  │
  ├── assets/                      # Static images
  ├── App.jsx
  └── main.jsx
```

## Why Feature-Based Architecture?

| Aspect | File-Type Based (Current) | Feature-Based (Target) |
|--------|--------------------------|------------------------|
| **Cohesion** | Low — related code spread across 5+ folders | High — all heatmap code in `features/heatmap/` |
| **Scalability** | Hard — adding a feature touches many folders | Easy — add a new folder under `features/` |
| **Team ownership** | Conflicts — multiple devs touch same folder | Clear — Team owns their feature folder |
| **Code splitting** | Manual setup needed | Natural — each feature = one chunk |
| **Testing** | Hard to isolate | Easy — test at feature boundary |
| **Onboarding** | "Where is the map code?" | "Look in `features/heatmap/`" |

## Heatmap Feature — Detailed Breakdown

The heatmap is the most complex feature and most benefits from isolation:

```
features/heatmap/
  components/
    MapModal.jsx          — Modal shell + state orchestrator
    MapToolbar.jsx        — City/mode/type/purpose filter bar (extract from MapModal)
    HeatmapLegend.jsx     — Color legend widget (extract from MapModal)
    MiniPropertyPanel.jsx — Right-side property drawer (extract from MapModal)
    RecenterMap.jsx       — Leaflet useMap hook wrapper
    PropertyPins.jsx      — Pin markers layer
  hooks/
    useHeatmapData.js     — useSWR/useQuery for /heatmap/{city}
    useGeoJSON.js         — fetch() with BASE_URL fix + null guard
  utils/
    colorUtils.js
      getColor(feature, heatmapData, mode, palette, staticBins)
      interpolateColor(t, colorA, colorB)
    geoUtils.js
      getPolygonCentroid(coordinates, type)
      buildPincodeFromGeoJSON(features)
  constants/
    heatmapConfig.js
      export const CITIES = [...]
      export const DYNAMIC_PALETTES = {...}
      export const SCORE_DESCRIPTIONS = {...}
      export const TILE_LAYERS = {...}
      export const STATIC_BINS_MAP = {...}
```

## Migration Priority (Phased)

### Phase 1 — Quick Wins (1-2 days)
- [ ] Extract heatmap constants to `features/heatmap/constants/heatmapConfig.js`
- [ ] Create `shared/hooks/useLocalStorage.js` with safe try-catch
- [ ] Create `services/apiClient.js` separating the factory from instances
- [ ] Create `router/AppRouter.jsx` consolidating all routes

### Phase 2 — Component Extraction (3-5 days)
- [ ] Extract `MapToolbar.jsx` from MapModal (reduce from 646 → ~200 lines)
- [ ] Extract `HeatmapLegend.jsx` from MapModal
- [ ] Extract `MiniPropertyPanel.jsx` from MapModal
- [ ] Create `features/heatmap/hooks/useHeatmapData.js`
- [ ] Create `features/heatmap/hooks/useGeoJSON.js`

### Phase 3 — Full Feature Migration (1-2 weeks)
- [ ] Move all files to feature structure
- [ ] Update all import paths
- [ ] Add barrel exports (`index.js` per feature)
- [ ] Set up lazy loading per feature route

## MNC Coding Standards

### Component Rules
1. **Single Responsibility** — One component = one job. MapModal (646 lines) violates this → extract sub-components
2. **Custom Hooks for Logic** — Business logic in hooks, not in JSX
3. **Named Exports** from `index.js` — `import { MapModal } from '@features/heatmap'`
4. **Prop Types or TypeScript** — All props documented
5. **Error Boundaries** — Every feature wrapped in `<ErrorBoundary>`

### API Layer Rules
1. **One API file per feature** — `features/heatmap/services/analyticsApi.js`
2. **Shared interceptors** — In `services/apiClient.js` only
3. **No direct axios in components** — Always through service layer
4. **URL encoding** — Always use `URLSearchParams` or `encodeURIComponent`

### State Management Rules
1. **Local state first** — useState for component-specific data
2. **Context for cross-feature** — SearchContext, ThemeContext
3. **No prop drilling beyond 2 levels** — Use Context or composition
