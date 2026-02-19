package com.realestate.backend.service;

import com.realestate.backend.entity.PincodeScore;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.FavoriteRepository;
import com.realestate.backend.repository.PincodeScoreRepository;
import com.realestate.backend.repository.PropertyRepository;
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
    private FavoriteRepository favoriteRepository;

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
        // Get all active properties for this city (case-insensitive)
        List<Property> properties = propertyRepository.findByCityIgnoreCaseAndIsActive(city, true);

        if (properties.isEmpty()) {
            return; // No properties to analyze
        }

        // Group properties by pincode
        Map<String, List<Property>> propertiesByPincode = properties.stream()
                .filter(p -> p.getPinCode() != null && !p.getPinCode().trim().isEmpty())
                .collect(Collectors.groupingBy(Property::getPinCode));

        // Compute scores for each pincode
        List<PincodeScore> scores = new ArrayList<>();

        for (Map.Entry<String, List<Property>> entry : propertiesByPincode.entrySet()) {
            String pincode = entry.getKey();
            List<Property> pincodeProperties = entry.getValue();

            PincodeScore score = computePincodeScore(city, pincode, pincodeProperties, properties);
            scores.add(score);
        }

        // Normalize scores across all pincodes
        normalizeScores(scores);

        // Save all scores
        pincodeScoreRepository.saveAll(scores);
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
                        score.setPriceScore(normalized);
                    }
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
     * Track a property view
     */
    @Transactional
    public void trackView(Long propertyId) {
        propertyRepository.findById(propertyId).ifPresent(property -> {
            property.setViews(property.getViews() + 1);
            property.setLastViewedAt(LocalDateTime.now());
            propertyRepository.save(property);
        });
    }

    /**
     * Track a property inquiry
     */
    @Transactional
    public void trackInquiry(Long propertyId) {
        propertyRepository.findById(propertyId).ifPresent(property -> {
            property.setInquiries(property.getInquiries() + 1);
            propertyRepository.save(property);
        });
    }

    /**
     * Get heatmap data for a city
     */
    public List<Map<String, Object>> getHeatmapData(String city, String mode) {
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
     * Get the appropriate score based on mode
     */
    private Double getScoreByMode(PincodeScore score, String mode) {
        return switch (mode.toLowerCase()) {
            case "price" -> score.getPriceScore();
            case "market_activity" -> score.getMarketActivityScore();
            case "inventory" -> score.getInventoryScore();
            case "buyer_opportunity" -> score.getBuyerOpportunityScore();
            case "demand" -> score.getDemandScore();
            case "liquidity" -> score.getLiquidityScore();
            case "growth" -> score.getGrowthScore();
            case "saturation" -> score.getSaturationScore();
            case "conversion" -> score.getConversionScore();
            default -> score.getPriceScore(); // Default to price
        };
    }
}
