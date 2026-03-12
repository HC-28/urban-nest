package com.realestate.backend.service;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.PincodeScore;
import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.PropertyView;
import com.realestate.backend.repository.FavoriteRepository;
import com.realestate.backend.repository.PincodeScoreRepository;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.PropertyViewRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PincodeScoreRepository pincodeScoreRepository;

    @Autowired
    private com.realestate.backend.repository.UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private PropertyViewRepository propertyViewRepository;

    /**
     * Auto-compute scores for all cities on application startup
     */
    @PostConstruct
    public void computeScoresOnStartup() {
        try {
            // Get all distinct cities that have active properties
            List<String> cities = propertyRepository.findDistinctActiveCities();
            if (cities.isEmpty()) {
                // Fallback: try known cities even if no properties exist yet
                System.out.println("[Analytics] No active properties found for any city on startup.");
                return;
            }
            System.out.println("[Analytics] Auto-computing heatmap scores for cities: " + cities);
            for (String city : cities) {
                if (city != null && !city.trim().isEmpty()) {
                    computeScoresForCity(city);
                }
            }
            System.out.println("[Analytics] Heatmap scores computed successfully on startup.");
        } catch (Exception e) {
            System.err.println("[Analytics] Failed to compute scores on startup: " + e.getMessage());
        }
    }

    /**
     * Compute scores for all known cities (Ahmedabad, Mumbai, Bangalore)
     */
    @Transactional
    public void computeScoresForAllCities() {
        List<String> knownCities = Arrays.asList("Ahmedabad", "Mumbai", "Bangalore");
        for (String city : knownCities) {
            computeScoresForCity(city);
        }
    }

    /**
     * Compute all heatmap scores for a specific city
     */
    @Transactional
    public void computeScoresForCity(String city) {
        // Get all active, unsold properties for this city (case-insensitive)
        List<Property> properties = propertyRepository.findByCityIgnoreCaseAndIsActiveTrueAndIsSoldFalse(city);

        // ALWAYS load existing scores for this city to ensure we reset any that no
        // longer
        // have listings
        List<PincodeScore> existingScores = pincodeScoreRepository.findByCityIgnoreCase(city);
        Map<String, PincodeScore> existingScoresMap = existingScores.stream()
                .collect(Collectors.toMap(PincodeScore::getPincode, s -> s));

        // Reset all existing scores for this city first
        for (PincodeScore score : existingScores) {
            score.setActiveListings(0);
            score.setPriceScore(0.0);
            score.setMedianPricePerSqft(0.0);
            score.setMarketActivityScore(0.0);
            score.setInventoryScore(0.0);
            score.setDemandScore(0.0);
            score.setTotalViews(0);
            score.setTotalFavorites(0);
            score.setTotalInquiries(0);
        }

        if (properties.isEmpty()) {
            pincodeScoreRepository.saveAll(existingScores);
            return;
        }

        // Group properties by pincode
        Map<String, List<Property>> propertiesByPincode = properties.stream()
                .filter(p -> p.getPinCode() != null && !p.getPinCode().trim().isEmpty())
                .collect(Collectors.groupingBy(Property::getPinCode));

        // Compute scores for each pincode that HAS properties
        List<PincodeScore> scoresToSave = new ArrayList<>();

        for (Map.Entry<String, List<Property>> entry : propertiesByPincode.entrySet()) {
            String pincode = entry.getKey();
            List<Property> pincodeProperties = entry.getValue();

            // Reuse existing score or create new one
            PincodeScore score = existingScoresMap.getOrDefault(pincode, new PincodeScore(city, pincode));

            // Re-compute metrics (this will overwrite the reset values)
            score = computePincodeScore(city, pincode, pincodeProperties, properties);
            scoresToSave.add(score);
        }

        // Add back the reset scores for pincodes that NO LONGER have properties and
        // explicitly delete them
        List<PincodeScore> scoresToDelete = new ArrayList<>();
        for (PincodeScore es : existingScores) {
            if (!propertiesByPincode.containsKey(es.getPincode())) {
                scoresToDelete.add(es);
            }
        }

        if (!scoresToDelete.isEmpty()) {
            pincodeScoreRepository.deleteAll(scoresToDelete);
        }

        // Normalize scores across all pincodes
        normalizeScores(scoresToSave);

        // Save all scores
        pincodeScoreRepository.saveAll(scoresToSave);
    }

    /**
     * Compute raw scores for a single pincode
     */
    private PincodeScore computePincodeScore(String city, String pincode,
            List<Property> pincodeProperties,
            List<Property> allCityProperties) {
        PincodeScore score = pincodeScoreRepository
                .findByCityAndPincode(city, pincode)
                .orElse(new PincodeScore(city, pincode));

        // === RAW METRICS ===
        int activeListings = pincodeProperties.size();
        score.setActiveListings(activeListings);

        // Price metrics
        List<Double> pricesPerSqft = pincodeProperties.stream()
                .filter(p -> p.getArea() > 0)
                .map(p -> p.getPrice() / p.getArea())
                .sorted()
                .collect(Collectors.toList());

        if (!pricesPerSqft.isEmpty()) {
            score.setMedianPricePerSqft(getMedian(pricesPerSqft));
            score.setAvgPricePerSqft(pricesPerSqft.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0));
        }

        // Days on market
        List<Long> daysOnMarket = pincodeProperties.stream()
                .filter(p -> p.getListedDate() != null)
                .map(p -> ChronoUnit.DAYS.between(p.getListedDate(), LocalDateTime.now()))
                .collect(Collectors.toList());

        if (!daysOnMarket.isEmpty()) {
            score.setAvgDaysOnMarket(daysOnMarket.stream()
                    .mapToDouble(Long::doubleValue)
                    .average()
                    .orElse(0.0));
        }

        // Engagement metrics
        int totalViews = pincodeProperties.stream()
                .mapToInt(Property::getViews)
                .sum();
        score.setTotalViews(totalViews);

        // Count favorites for this pincode
        int totalFavorites = (int) pincodeProperties.stream()
                .mapToLong(p -> favoriteRepository.countByProperty_Id(p.getId()))
                .sum();
        score.setTotalFavorites(totalFavorites);

        int totalInquiries = pincodeProperties.stream()
                .mapToInt(Property::getInquiries)
                .sum();
        score.setTotalInquiries(totalInquiries);

        // Agent count
        long agentCount = pincodeProperties.stream()
                .map(Property::getAgentId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        score.setAgentCount((int) agentCount);

        // === BUYER SCORES ===

        // 1. Price Score (will be normalized later with log scale)
        if (score.getMedianPricePerSqft() != null && score.getMedianPricePerSqft() > 0) {
            score.setPriceScore(score.getMedianPricePerSqft()); // Raw value, normalized later
        }

        // 2. Inventory Score (simple ratio)
        int maxListings = allCityProperties.stream()
                .collect(Collectors.groupingBy(Property::getPinCode))
                .values()
                .stream()
                .mapToInt(List::size)
                .max()
                .orElse(1);

        score.setInventoryScore((activeListings / (double) maxListings) * 100.0);

        // 3. Market Activity Score (engagement + liquidity)
        double viewsPerListing = activeListings > 0 ? totalViews / (double) activeListings : 0;
        double favoritesPerListing = activeListings > 0 ? totalFavorites / (double) activeListings : 0;
        double avgDays = score.getAvgDaysOnMarket() != null ? score.getAvgDaysOnMarket() : 30.0;

        double demandComponent = (viewsPerListing + favoritesPerListing) / 2.0;
        double liquidityComponent = 100.0 / (1.0 + avgDays / 30.0);

        score.setMarketActivityScore((demandComponent * 0.5 + liquidityComponent * 0.5));

        // 4. Buyer Opportunity Score
        long uniquePincodeCount = allCityProperties.stream()
                .map(Property::getPinCode)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        double cityAvgListings = allCityProperties.size() / (double) (uniquePincodeCount > 0 ? uniquePincodeCount : 1);
        double inventoryLevel = activeListings / cityAvgListings;

        double daysComponent = Math.min(avgDays / 90.0, 1.0) * 40.0;
        double inventoryComponent = Math.min(inventoryLevel, 2.0) * 10.0;

        score.setBuyerOpportunityScore(Math.min(daysComponent + inventoryComponent, 100.0));

        // === AGENT SCORES ===

        // 1. Demand Score (engagement per listing)
        double totalEngagement = totalViews + totalFavorites + totalInquiries;
        double engagementPerListing = activeListings > 0 ? totalEngagement / activeListings : 0;
        score.setDemandScore(engagementPerListing); // Will be percentile-normalized later

        // 2. Liquidity Score
        score.setLiquidityScore(liquidityComponent);

        // 3. Growth Score (placeholder - requires historical data)
        score.setGrowthScore(50.0); // Neutral until we have price history

        // 4. Saturation Score
        double listingsPerAgent = agentCount > 0 ? activeListings / (double) agentCount : 0;
        score.setSaturationScore(100.0 - Math.min(listingsPerAgent * 10.0, 100.0));

        // 5. Conversion Score (placeholder - requires sold property tracking)
        score.setConversionScore(50.0); // Neutral until we track conversions

        score.setLastComputed(LocalDateTime.now());

        return score;
    }

    /**
     * Normalize scores across all pincodes using appropriate methods
     */
    private void normalizeScores(List<PincodeScore> scores) {
        if (scores.isEmpty())
            return;

        // 1. Normalize Price Score using log scale
        List<Double> prices = scores.stream()
                .map(PincodeScore::getPriceScore)
                .filter(Objects::nonNull)
                .filter(p -> p > 0)
                .collect(Collectors.toList());

        if (!prices.isEmpty()) {
            double minLog = Math.log(prices.stream().min(Double::compare).get());
            double maxLog = Math.log(prices.stream().max(Double::compare).get());
            double range = maxLog - minLog;

            if (range > 0) {
                for (PincodeScore score : scores) {
                    if (score.getPriceScore() != null && score.getPriceScore() > 0) {
                        double logPrice = Math.log(score.getPriceScore());
                        double normalized = ((logPrice - minLog) / range) * 100.0;
                        // Guard against NaN/Infinity
                        if (Double.isNaN(normalized) || Double.isInfinite(normalized)) {
                            normalized = 50.0;
                        }
                        score.setPriceScore(normalized);
                    } else {
                        score.setPriceScore(50.0); // Default for missing price data
                    }
                }
            } else {
                // All prices the same — set to 50
                for (PincodeScore score : scores) {
                    score.setPriceScore(50.0);
                }
            }
        } else {
            // No valid prices at all — set all to 50
            for (PincodeScore score : scores) {
                if (score.getPriceScore() == null || score.getPriceScore() <= 0) {
                    score.setPriceScore(50.0);
                }
            }
        }

        // 2. Normalize Market Activity Score using percentile ranking
        normalizeByPercentile(scores, PincodeScore::getMarketActivityScore, PincodeScore::setMarketActivityScore);

        // 3. Normalize Demand Score using percentile ranking
        normalizeByPercentile(scores, PincodeScore::getDemandScore, PincodeScore::setDemandScore);
    }

    /**
     * Normalize scores using percentile ranking
     */
    private void normalizeByPercentile(List<PincodeScore> scores,
            java.util.function.Function<PincodeScore, Double> getter,
            java.util.function.BiConsumer<PincodeScore, Double> setter) {
        List<PincodeScore> sorted = scores.stream()
                .filter(s -> getter.apply(s) != null)
                .sorted(Comparator.comparing(getter))
                .collect(Collectors.toList());

        int n = sorted.size();
        if (n == 0)
            return;
        if (n == 1) {
            setter.accept(sorted.get(0), 50.0); // Neutral when only one pincode (no comparison data)
            return;
        }
        for (int i = 0; i < n; i++) {
            double percentile = (i / (double) (n - 1)) * 100.0;
            setter.accept(sorted.get(i), percentile);
        }
    }

    /**
     * Get median value from a sorted list
     */
    private double getMedian(List<Double> sortedList) {
        int size = sortedList.size();
        if (size == 0)
            return 0.0;
        if (size % 2 == 0) {
            return (sortedList.get(size / 2 - 1) + sortedList.get(size / 2)) / 2.0;
        } else {
            return sortedList.get(size / 2);
        }
    }

    /**
     * Track a property view (Unique per user)
     */
    @Transactional
    public void trackView(Long propertyId, Long userId) {
        if (propertyId == null)
            return;
        propertyRepository.findById(propertyId).ifPresent(property -> {
            boolean isUniqueView = true;
            if (userId != null) {
                userRepository.findById(userId).ifPresent(user -> {
                    Optional<PropertyView> existingView = propertyViewRepository.findByUserAndProperty(user, property);
                    if (existingView.isPresent()) {
                        PropertyView view = existingView.get();
                        view.setViewedAt(LocalDateTime.now());
                        propertyViewRepository.save(view);
                    } else {
                        propertyViewRepository.save(new PropertyView(user, property));
                    }
                });
                isUniqueView = false; // Simplified logic, for guests it remains true
            }
            if (isUniqueView || userId == null) {
                property.setViews(property.getViews() + 1);
                property.setLastViewedAt(LocalDateTime.now());
                propertyRepository.save(property);
            }
        });
    }

    /**
     * Delegate for trackView with propertyId only
     */
    @Transactional
    public void trackView(Long propertyId) {
        trackView(propertyId, null);
    }

    /**
     * Get recently viewed properties for a user
     */
    public List<Property> getRecentlyViewedProperties(Long userId) {
        if (userId == null)
            return Collections.emptyList();
        return userRepository.findById(userId).map(user -> propertyViewRepository.findByUserOrderByViewedAtDesc(
                user, org.springframework.data.domain.PageRequest.of(0, 5)).stream()
                .map(PropertyView::getProperty)
                .collect(Collectors.toList())).orElse(Collections.emptyList());
    }

    /**
     * Track a property inquiry
     */
    @Transactional
    public void trackInquiry(Long propertyId) {
        if (propertyId == null)
            return;
        propertyRepository.findById(propertyId).ifPresent(p -> {
            p.setInquiries(p.getInquiries() + 1);
            propertyRepository.save(p);
        });
    }

    /**
     * Get pre-computed heatmap data for a city (No filters)
     */
    private List<Map<String, Object>> getPrecomputedHeatmapData(String city, String mode) {
        // Use case-insensitive lookup so "Ahmedabad" matches "ahmedabad" in DB
        List<PincodeScore> scores = pincodeScoreRepository.findByCityIgnoreCase(city);

        // If no scores exist yet, trigger computation on-the-fly
        if (scores.isEmpty()) {
            System.out.println("[Analytics] No scores found for city '" + city + "', computing now...");
            computeScoresForCity(city);
            scores = pincodeScoreRepository.findByCityIgnoreCase(city);
        }

        return scores.stream().map(score -> {
            Map<String, Object> data = new HashMap<>();
            data.put("pincode", score.getPincode());
            data.put("score", getScoreByMode(score, mode));
            data.put("activeListings", score.getActiveListings());
            data.put("medianPrice", score.getMedianPricePerSqft());
            return data;
        }).collect(Collectors.toList());
    }

    /**
     * Get the appropriate score based on mode.
     * Returns 0.0 instead of null to prevent NaN on the frontend.
     */
    private Double getScoreByMode(PincodeScore score, String mode) {
        Double value = switch (mode.toLowerCase()) {
            case "price" -> score.getPriceScore();
            case "market_activity" -> score.getMarketActivityScore();
            case "inventory" -> score.getInventoryScore();
            case "buyer_opportunity" -> score.getBuyerOpportunityScore();
            case "demand" -> score.getDemandScore();
            case "liquidity" -> score.getLiquidityScore();
            case "growth" -> score.getGrowthScore();
            case "saturation" -> score.getSaturationScore();
            case "conversion" -> score.getConversionScore();
            default -> score.getPriceScore();
        };
        // Never return null or NaN — frontend will display these as-is
        if (value == null || Double.isNaN(value) || Double.isInfinite(value)) {
            return 0.0;
        }
        return value;
    }

    /**
     * Get heatmap data for a city, optionally filtered by property type and purpose
     */
    public List<Map<String, Object>> getHeatmapData(String city, String mode, String type, String purpose) {
        if ((type != null && !type.equalsIgnoreCase("All") && !type.trim().isEmpty()) ||
                (purpose != null && !purpose.trim().isEmpty())) {
            return getDynamicHeatmapData(city, mode, type, purpose);
        }
        return getPrecomputedHeatmapData(city, mode);
    }

    /**
     * Generate heatmap data dynamically for a specific property type and purpose
     */
    private List<Map<String, Object>> getDynamicHeatmapData(String city, String mode, String type, String purpose) {
        boolean hasType = type != null && !type.equalsIgnoreCase("All") && !type.trim().isEmpty();
        boolean hasPurpose = purpose != null && !purpose.trim().isEmpty();

        List<Object[]> results;
        if (hasType && hasPurpose) {
            results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurposeAndTypeWithEngagement(city,
                    purpose, type);
        } else if (hasType) {
            results = propertyRepository.countActivePropertiesByPinCodeAndCityAndType(city, type);
        } else if (hasPurpose) {
            results = propertyRepository.countActivePropertiesByPinCodeAndCityAndPurposeWithEngagement(city, purpose);
        } else {
            return getPrecomputedHeatmapData(city, mode);
        }

        List<PincodeScore> dynamicScores = new ArrayList<>();

        int maxListings = 0;
        for (Object[] row : results) {
            Long count = (Long) row[1];
            if (count > maxListings)
                maxListings = count.intValue();
        }
        if (maxListings == 0)
            maxListings = 1;

        for (Object[] row : results) {
            String pincode = (String) row[0];
            Long count = (Long) row[1];
            Double avgPrice = row[2] != null ? (Double) row[2] : 0.0;
            Long views = row[3] != null ? (Long) row[3] : 0L;
            Long favorites = row[4] != null ? (Long) row[4] : 0L;
            Long inquiries = row[5] != null ? (Long) row[5] : 0L;

            PincodeScore score = new PincodeScore(city, pincode);
            score.setActiveListings(count.intValue());
            score.setMedianPricePerSqft(avgPrice); // Use Avg as proxy for Median in dynamic view

            // Inventory Score
            score.setInventoryScore((count / (double) maxListings) * 100.0);

            // Price Score (Raw, will be normalized)
            score.setPriceScore(avgPrice);

            // Demand Score (Raw Engagement per listing)
            double engagement = views + favorites + inquiries;
            double engagementPerListing = count > 0 ? engagement / count : 0;
            score.setDemandScore(engagementPerListing);

            // Market Activity (Use Demand as proxy since we lack liquidity/days data in
            // aggregate)
            score.setMarketActivityScore(engagementPerListing);

            // Buyer Opportunity (Simplified: Inventory Level)
            // We lack days-on-market stats in this view, so we rely on price/inventory
            // Lower price + Higher inventory = Better opportunity?
            // Let's use a simple inverted price * inventory metric for now, or just leave
            // as 50
            // Actually, let's omit complex scores and fallback to Price/Inventory/Demand
            score.setBuyerOpportunityScore(50.0);

            dynamicScores.add(score);
        }

        // Apply same normalization as pre-computed scores
        normalizeScores(dynamicScores);

        return dynamicScores.stream().map(score -> {
            Map<String, Object> data = new HashMap<>();
            data.put("pincode", score.getPincode());
            data.put("score", getScoreByMode(score, mode));
            data.put("activeListings", score.getActiveListings());
            data.put("medianPrice", score.getMedianPricePerSqft());
            return data;
        }).collect(Collectors.toList());
    }
}
