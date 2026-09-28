# 🧮 Heatmap Scoring Formulas - Complete Reference

This document contains the exact mathematical formulas for all 9 heatmap modes, with implementation details and normalization strategies.

---

## 🎨 Color Scale Standards

All scores are normalized to 0-100 scale with consistent color mapping:

### For "Higher is Better" Metrics
```
0-20:   🔴 Red (Poor)
20-40:  🟠 Orange (Below Average)
40-60:  🟡 Yellow (Average)
60-80:  🟢 Light Green (Good)
80-100: 🟩 Dark Green (Excellent)
```

### For "Lower is Better" Metrics (Price)
```
0-20:   🟩 Dark Green (Affordable)
20-40:  🟢 Light Green (Good Value)
40-60:  🟡 Yellow (Average)
60-80:  🟠 Orange (Expensive)
80-100: 🔴 Red (Very Expensive)
```

---

## 💰 BUYER HEATMAPS

### 1. Price Score (Default for Buyers)

**What it shows:** Relative pricing across pincodes (log-scaled for fairness)

**Formula:**
```sql
-- Step 1: Calculate median price per sqft for each pincode
WITH pincode_prices AS (
    SELECT 
        pin_code,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price/NULLIF(area, 0)) as median_price_per_sqft
    FROM property
    WHERE city = ? AND active = true AND area > 0
    GROUP BY pin_code
),

-- Step 2: Log transform to handle wide price ranges
log_prices AS (
    SELECT 
        pin_code,
        median_price_per_sqft,
        LN(median_price_per_sqft) as log_price,
        MIN(LN(median_price_per_sqft)) OVER () as min_log,
        MAX(LN(median_price_per_sqft)) OVER () as max_log
    FROM pincode_prices
)

-- Step 3: Normalize to 0-100
SELECT 
    pin_code,
    median_price_per_sqft,
    ROUND(
        ((log_price - min_log) / NULLIF(max_log - min_log, 0)) * 100,
        2
    ) as price_score
FROM log_prices;
```

**Why log scale?**
- If prices range from ₹2K to ₹20K per sqft, linear scale would compress low-end differences
- Log scale makes ₹2K→₹4K change as visible as ₹10K→₹20K change

**Color:** Inverted (Green = Affordable, Red = Expensive)

---

### 2. Market Activity Score

**What it shows:** How competitive/hot the market is in each area

**Formula:**
```sql
WITH engagement_metrics AS (
    SELECT 
        pin_code,
        COUNT(*) as active_listings,
        SUM(views) as total_views,
        SUM(saves) as total_saves,
        AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - listed_date))) as avg_days_on_market
    FROM property
    WHERE city = ? AND active = true
    GROUP BY pin_code
),

demand_calc AS (
    SELECT 
        pin_code,
        active_listings,
        -- Demand component: engagement per listing
        (total_views + total_saves) / NULLIF(active_listings, 0) as engagement_per_listing,
        
        -- Liquidity component: inverse of days on market
        100 / (1 + avg_days_on_market/30.0) as liquidity_score
    FROM engagement_metrics
),

normalized AS (
    SELECT 
        pin_code,
        -- Combine demand and liquidity (50/50 weight)
        (engagement_per_listing * 0.5 + liquidity_score * 0.5) as raw_score,
        PERCENT_RANK() OVER (ORDER BY (engagement_per_listing * 0.5 + liquidity_score * 0.5)) as percentile
    FROM demand_calc
)

SELECT 
    pin_code,
    ROUND(percentile * 100, 2) as market_activity_score
FROM normalized;
```

**Interpretation:**
- High score = Competitive market, move fast
- Low score = Calm market, take your time

**Color:** Standard (Green = Hot, Red = Calm)

---

### 3. Inventory Score

**What it shows:** Where buyers have the most options

**Formula:**
```sql
WITH listing_counts AS (
    SELECT 
        pin_code,
        COUNT(*) as active_listings
    FROM property
    WHERE city = ? AND active = true
    GROUP BY pin_code
),

city_stats AS (
    SELECT MAX(active_listings) as max_listings
    FROM listing_counts
)

SELECT 
    lc.pin_code,
    lc.active_listings,
    ROUND(
        (lc.active_listings::DECIMAL / NULLIF(cs.max_listings, 0)) * 100,
        2
    ) as inventory_score
FROM listing_counts lc
CROSS JOIN city_stats cs;
```

**Simple and effective:**
- More listings = more choice = higher score

**Color:** Standard (Green = Many options, Red = Few options)

---

### 4. Buyer Opportunity Score ⭐ (Most Valuable)

**What it shows:** Where buyers have negotiation power

**Formula:**
```sql
WITH pincode_metrics AS (
    SELECT 
        pin_code,
        COUNT(*) as active_listings,
        AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - listed_date))) as avg_days_on_market,
        SUM(CASE WHEN price < original_price THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) as price_drop_rate
    FROM property p
    LEFT JOIN property_analytics pa ON p.id = pa.property_id
    WHERE p.city = ? AND p.active = true
    GROUP BY pin_code
),

city_avg AS (
    SELECT AVG(active_listings) as avg_listings
    FROM pincode_metrics
),

opportunity_calc AS (
    SELECT 
        pm.pin_code,
        pm.active_listings,
        pm.avg_days_on_market,
        pm.price_drop_rate,
        
        -- Component 1: Days on market (40% weight)
        -- Cap at 90 days for normalization
        LEAST(pm.avg_days_on_market / 90.0, 1.0) * 40 as days_component,
        
        -- Component 2: Price drop rate (40% weight)
        COALESCE(pm.price_drop_rate, 0) * 40 as price_drop_component,
        
        -- Component 3: Inventory level (20% weight)
        LEAST(pm.active_listings / NULLIF(ca.avg_listings, 0), 2.0) * 10 as inventory_component
    FROM pincode_metrics pm
    CROSS JOIN city_avg ca
)

SELECT 
    pin_code,
    ROUND(
        LEAST(days_component + price_drop_component + inventory_component, 100),
        2
    ) as buyer_opportunity_score
FROM opportunity_calc;
```

**Why this works:**
- High days on market = sellers getting desperate
- Price drops = sellers willing to negotiate
- High inventory = more competition among sellers

**Color:** Standard (Green = Buyer's market, Red = Seller's market)

---

## 👨‍💼 AGENT HEATMAPS

### 1. Demand Score (Default for Agents)

**What it shows:** Where buyer interest is highest

**Formula:**
```sql
WITH engagement AS (
    SELECT 
        pin_code,
        COUNT(*) as active_listings,
        SUM(views) as total_views,
        SUM(saves) as total_saves,
        SUM(inquiries) as total_inquiries
    FROM property
    WHERE city = ? AND active = true
    GROUP BY pin_code
),

demand_calc AS (
    SELECT 
        pin_code,
        active_listings,
        (total_views + total_saves + total_inquiries) / NULLIF(active_listings, 0) as engagement_per_listing,
        PERCENT_RANK() OVER (ORDER BY (total_views + total_saves + total_inquiries) / NULLIF(active_listings, 0)) as percentile
    FROM engagement
)

SELECT 
    pin_code,
    ROUND(percentile * 100, 2) as demand_score
FROM demand_calc;
```

**Interpretation:**
- High score = Buyers are very active here
- Low score = Low buyer interest

**Color:** Standard (Green = High demand, Red = Low demand)

---

### 2. Liquidity Score

**What it shows:** How fast properties sell

**Formula:**
```sql
WITH timing_metrics AS (
    SELECT 
        pin_code,
        AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - listed_date))) as avg_days_on_market
    FROM property
    WHERE city = ? AND active = true
    GROUP BY pin_code
)

SELECT 
    pin_code,
    avg_days_on_market,
    ROUND(
        100 / (1 + avg_days_on_market/30.0),
        2
    ) as liquidity_score
FROM timing_metrics;
```

**Math explanation:**
- 0 days on market → 100 score
- 30 days → 50 score
- 60 days → 33 score
- 90 days → 25 score

**Color:** Standard (Green = Fast, Red = Slow)

---

### 3. Growth Score

**What it shows:** Emerging price trends (requires historical data)

**Formula:**
```sql
WITH price_windows AS (
    SELECT 
        p.pin_code,
        -- Current period (last 30 days)
        AVG(CASE 
            WHEN ph.recorded_at >= CURRENT_DATE - INTERVAL '30 days' 
            THEN ph.price_per_sqft 
        END) as current_avg,
        
        -- Previous period (30-60 days ago)
        AVG(CASE 
            WHEN ph.recorded_at >= CURRENT_DATE - INTERVAL '60 days' 
            AND ph.recorded_at < CURRENT_DATE - INTERVAL '30 days'
            THEN ph.price_per_sqft 
        END) as previous_avg
    FROM property p
    JOIN price_history ph ON p.id = ph.property_id
    WHERE p.city = ?
    GROUP BY p.pin_code
),

growth_calc AS (
    SELECT 
        pin_code,
        current_avg,
        previous_avg,
        ((current_avg - previous_avg) / NULLIF(previous_avg, 0)) * 100 as growth_rate
    FROM price_windows
    WHERE current_avg IS NOT NULL AND previous_avg IS NOT NULL
)

SELECT 
    pin_code,
    growth_rate,
    ROUND(
        LEAST(GREATEST(50 + (growth_rate * 5), 0), 100),
        2
    ) as growth_score
FROM growth_calc;
```

**Interpretation:**
- 50 = Stable (0% growth)
- 60 = +2% growth
- 70 = +4% growth
- 80 = +6% growth
- 40 = -2% decline

**Color:** Diverging (Green = Growing, Yellow = Stable, Red = Declining)

---

### 4. Saturation Score

**What it shows:** Competition density among agents

**Formula:**
```sql
WITH agent_density AS (
    SELECT 
        pin_code,
        COUNT(*) as active_listings,
        COUNT(DISTINCT agent_id) as agent_count
    FROM property
    WHERE city = ? AND active = true
    GROUP BY pin_code
),

saturation_calc AS (
    SELECT 
        pin_code,
        active_listings,
        agent_count,
        active_listings / NULLIF(agent_count, 0) as listings_per_agent
    FROM agent_density
)

SELECT 
    pin_code,
    listings_per_agent,
    ROUND(
        100 - LEAST((listings_per_agent * 10), 100),
        2
    ) as saturation_score
FROM saturation_calc;
```

**Interpretation:**
- High score = Low competition, good opportunity
- Low score = Saturated market

**Color:** Standard (Green = Low competition, Red = Saturated)

---

### 5. Conversion Score

**What it shows:** Lead-to-deal efficiency (requires sold property tracking)

**Formula:**
```sql
WITH conversion_metrics AS (
    SELECT 
        p.pin_code,
        -- Properties sold in last 90 days
        COUNT(CASE WHEN pa.sold_date >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as closed_deals,
        
        -- Total inquiries for those properties
        SUM(CASE WHEN pa.sold_date >= CURRENT_DATE - INTERVAL '90 days' THEN p.inquiries ELSE 0 END) as total_inquiries
    FROM property p
    JOIN property_analytics pa ON p.id = pa.property_id
    WHERE p.city = ?
    GROUP BY p.pin_code
),

conversion_calc AS (
    SELECT 
        pin_code,
        closed_deals,
        total_inquiries,
        (closed_deals::DECIMAL / NULLIF(total_inquiries, 0)) * 100 as conversion_rate
    FROM conversion_metrics
    WHERE total_inquiries > 0
)

SELECT 
    pin_code,
    conversion_rate,
    ROUND(
        LEAST(conversion_rate * 2, 100),
        2
    ) as conversion_score
FROM conversion_calc;
```

**Interpretation:**
- 50% conversion rate = 100 score (excellent)
- 25% conversion rate = 50 score (average)
- 10% conversion rate = 20 score (poor)

**Color:** Standard (Green = High conversion, Red = Low conversion)

---

## 🔄 Normalization Strategies

### Percentile Ranking (Best for skewed distributions)
```sql
PERCENT_RANK() OVER (ORDER BY raw_value) * 100
```
- Ensures even distribution across 0-100
- Robust to outliers

### Min-Max Normalization (Best for bounded ranges)
```sql
((value - min_value) / (max_value - min_value)) * 100
```
- Preserves relative distances
- Sensitive to outliers

### Log Transformation (Best for exponential data)
```sql
((LN(value) - LN(min)) / (LN(max) - LN(min))) * 100
```
- Compresses wide ranges
- Makes multiplicative changes visible

---

## 📊 Data Quality Requirements

| Score | Minimum Data Required | Fallback |
|-------|----------------------|----------|
| Price | 3+ active listings | City median |
| Market Activity | 5+ listings with views | 50 (neutral) |
| Inventory | 1+ listing | 0 |
| Buyer Opportunity | 3+ listings, 7+ days old | 50 (neutral) |
| Demand | 5+ listings with engagement | 50 (neutral) |
| Liquidity | 3+ listings | City average |
| Growth | 30+ days of price history | 50 (stable) |
| Saturation | 2+ agents | City average |
| Conversion | 5+ inquiries in 90 days | City average |

---

## 🎯 Implementation Priority

### Phase 1 (Immediate - No historical data needed)
1. ✅ Price Score
2. ✅ Inventory Score
3. ✅ Demand Score
4. ✅ Saturation Score

### Phase 2 (Requires analytics tracking)
5. ⏳ Market Activity Score
6. ⏳ Liquidity Score
7. ⏳ Buyer Opportunity Score

### Phase 3 (Requires historical data)
8. ⏳ Growth Score
9. ⏳ Conversion Score

---

## 🧪 Testing Formulas

Use these queries to validate scores:

```sql
-- Check score distribution (should be roughly even)
SELECT 
    FLOOR(price_score/10)*10 as score_bucket,
    COUNT(*) as pincode_count
FROM pincode_scores
WHERE city = 'Mumbai'
GROUP BY score_bucket
ORDER BY score_bucket;

-- Find outliers
SELECT * FROM pincode_scores
WHERE price_score > 95 OR price_score < 5
ORDER BY price_score;

-- Validate against raw data
SELECT 
    ps.pincode,
    ps.price_score,
    ps.median_price_per_sqft,
    ps.active_listings
FROM pincode_scores ps
WHERE ps.city = 'Mumbai'
ORDER BY ps.price_score DESC
LIMIT 20;
```
