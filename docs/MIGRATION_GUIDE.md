# 🚀 Urban Nest — MNC Migration Guide

## Overview

This guide covers the upgrade from the current development-grade setup to a production MNC-grade architecture across three layers: Database, Frontend, and Backend.

---

## Step 1 — Database Migration (Do First)

### Prerequisites
- PostgreSQL 15+
- `pg_trgm` and `btree_gin` extensions available
- Database backup taken

### Run Migration
```bash
# 1. Take a backup first (ALWAYS)
pg_dump -U postgres urban_nest > backup_before_migration_$(date +%Y%m%d).sql

# 2. Run the MNC upgrade script
psql -U postgres -d urban_nest -f backend/schema_mnc_upgrade.sql

# 3. Verify migration was recorded
psql -U postgres -d urban_nest -c "SELECT * FROM db_migrations;"

# 4. Verify indexes were created
psql -U postgres -d urban_nest -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%' ORDER BY indexname;"

# 5. Verify views were created
psql -U postgres -d urban_nest -c "\dv vw_*"
```

### Rollback (if needed)
```bash
# Restore from backup
psql -U postgres -d urban_nest < backup_before_migration_YYYYMMDD.sql
```

> [!CAUTION]
> The migration adds columns and indexes. It does NOT drop any existing columns or data. Rolling back requires restoring the full backup.

---

## Step 2 — Frontend Bug Fixes (Already Applied)

The following critical bugs have been fixed in `MapModal.jsx`:

| Bug | Status |
|-----|--------|
| GeoJSON fetch path (`/geo/null` issue) | ✅ Fixed |
| API response double-unwrap | ✅ Fixed |
| selectedCity/currentCity divergence | ✅ Fixed |
| fetchMiniProperties URL encoding | ✅ Fixed |
| Area dropdown corner-point instead of centroid | ✅ Fixed |
| View All button shown when no properties | ✅ Fixed |
| Loading state shows text skeleton instead of spinner | ✅ Fixed |
| Mini panel shows skeleton while loading | ✅ Fixed |
| `aria-` accessibility labels added | ✅ Fixed |

---

## Step 3 — Backend Bug Fixes (Already Applied)

| Bug | Status |
|-----|--------|
| N+1 DB query in `computeScoresForCity` | ✅ Fixed |
| `@EnableScheduling` annotation verification | ✅ Checked |

---

## Step 4 — Feature Restructuring (Phased)

See `FRONTEND_STRUCTURE.md` and `BACKEND_STRUCTURE.md` for full details.

### Immediate (This Sprint)
- [ ] Move `Map.css` content into `MapModal.css` (remove duplicate CSS files)
- [ ] Create `shared/hooks/useLocalStorage.js`
- [ ] Create heatmap constants file

### Next Sprint
- [ ] Extract `MapToolbar.jsx` from `MapModal.jsx`
- [ ] Extract `HeatmapLegend.jsx`
- [ ] Extract `MiniPropertyPanel.jsx`
- [ ] Create `useHeatmapData` custom hook

### Future Sprints
- [ ] Full feature-based folder migration
- [ ] Backend service interface pattern
- [ ] Add city-stats API endpoint (to replace hardcoded Home page counts)
- [ ] Add heatmap score refresh scheduling (every 6 hours)

---

## Checklist — Production Readiness

### Security
- [ ] Remove `DebugController.java` before production
- [ ] Ensure all endpoints are properly authorized
- [ ] Remove `console.log("Fetched favorites:", ...)` debug logs
- [ ] Sanitize all user inputs (✅ mostly done via Spring validation)

### Performance
- [ ] Run `ANALYZE` after migration to update query planner statistics
- [ ] Configure HikariCP connection pool settings
- [ ] Add Redis caching for heatmap scores (avoid DB on every request)
- [ ] Enable Gzip compression in Spring Boot

### Monitoring
- [ ] Add Spring Actuator endpoints
- [ ] Configure structured logging (Logback JSON format)
- [ ] Add request ID to all logs
- [ ] Set up Sentry or similar error tracking
