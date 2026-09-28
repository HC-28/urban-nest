# How to Run the Analytics Migration

## Prerequisites
- PostgreSQL database running
- Database name: `realestate`
- User: `postgres` (or your configured user)

## Step-by-Step Instructions

### Option 1: Using psql (Recommended)

```bash
# Navigate to backend directory
cd "g:\Users\HP\Downloads\urban-nest-main (2)\urban-nest-main\backend"

# Run the migration
psql -U postgres -d realestate -f FINAL_ANALYTICS_MIGRATION.sql
```

**Enter your PostgreSQL password when prompted.**

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Connect to your `realestate` database
3. Open Query Tool (Tools → Query Tool)
4. Open file: `FINAL_ANALYTICS_MIGRATION.sql`
5. Click Execute (F5)

### Option 3: Copy-Paste

1. Open `FINAL_ANALYTICS_MIGRATION.sql`
2. Copy all contents
3. Paste into your PostgreSQL client
4. Execute

## What This Migration Does

### Creates 3 New Tables:
1. **property_analytics** - Detailed engagement tracking per property
2. **pincode_scores** - Precomputed heatmap scores per pincode
3. **price_history** - Historical price tracking for growth analysis

### Modifies Existing Table:
- **property** - Adds 5 new columns:
  - `views` (INT) - View count
  - `favorites` (INT) - Favorite count  
  - `inquiries` (INT) - Inquiry count
  - `listed_date` (TIMESTAMP) - When property was listed
  - `last_viewed_at` (TIMESTAMP) - Last view timestamp

### Initializes Data:
- Sets `listed_date = CURRENT_TIMESTAMP` for all existing active properties
- Creates `property_analytics` records for all active properties
- Creates indexes for performance

## Verification

After running the migration, you should see output like:

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
ALTER TABLE
CREATE INDEX
CREATE INDEX
...
UPDATE 42
INSERT 0 42
CREATE FUNCTION
CREATE TRIGGER
```

The verification queries at the end will show:
- Row counts for each new table
- Confirmation that new columns exist
- Count of properties with `listed_date` set

## Troubleshooting

### Error: "relation already exists"
**Solution:** This is normal if you're running the migration again. The script uses `IF NOT EXISTS` so it's safe.

### Error: "column already exists"  
**Solution:** This is normal. The script uses `ADD COLUMN IF NOT EXISTS` so it's safe.

### Error: "password authentication failed"
**Solution:** Check your PostgreSQL password. You can also edit `pg_hba.conf` to use `trust` authentication locally.

### Error: "database does not exist"
**Solution:** Make sure you're connected to the `realestate` database, not `postgres`.

## After Migration

1. **Restart Backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Compute Initial Scores:**
   ```bash
   curl -X POST http://localhost:8080/api/analytics/compute/Mumbai
   curl -X POST http://localhost:8080/api/analytics/compute/Bangalore
   curl -X POST http://localhost:8080/api/analytics/compute/Ahmedabad
   ```

3. **Test Heatmap API:**
   ```bash
   curl "http://localhost:8080/api/analytics/heatmap/Mumbai?mode=price"
   ```

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove new tables
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS pincode_scores CASCADE;
DROP TABLE IF EXISTS property_analytics CASCADE;

-- Remove new columns from property
ALTER TABLE property 
    DROP COLUMN IF EXISTS views,
    DROP COLUMN IF EXISTS favorites,
    DROP COLUMN IF EXISTS inquiries,
    DROP COLUMN IF EXISTS listed_date,
    DROP COLUMN IF EXISTS last_viewed_at;

-- Remove function and trigger
DROP TRIGGER IF EXISTS trigger_update_days_on_market ON property_analytics;
DROP FUNCTION IF EXISTS update_days_on_market();
```

## Support

If you encounter any issues:
1. Check the error message carefully
2. Verify you're connected to the correct database
3. Ensure PostgreSQL is running
4. Check that the `property` table exists with `is_active` column
