package com.realestate.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pincode_scores", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "city", "pincode" })
})
public class PincodeScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "pincode", nullable = false, length = 10)
    private String pincode;

    // === BUYER SCORES (0-100) ===
    @Column(name = "price_score")
    private Double priceScore;

    @Column(name = "market_activity_score")
    private Double marketActivityScore;

    @Column(name = "inventory_score")
    private Double inventoryScore;

    @Column(name = "buyer_opportunity_score")
    private Double buyerOpportunityScore;

    // === AGENT SCORES (0-100) ===
    @Column(name = "demand_score")
    private Double demandScore;

    @Column(name = "liquidity_score")
    private Double liquidityScore;

    @Column(name = "growth_score")
    private Double growthScore;

    @Column(name = "saturation_score")
    private Double saturationScore;

    @Column(name = "conversion_score")
    private Double conversionScore;

    // === RAW METRICS (for transparency/debugging) ===
    @Column(name = "active_listings")
    private Integer activeListings = 0;

    @Column(name = "median_price_per_sqft")
    private Double medianPricePerSqft;

    @Column(name = "avg_price_per_sqft")
    private Double avgPricePerSqft;

    @Column(name = "avg_days_on_market")
    private Double avgDaysOnMarket;

    @Column(name = "total_views")
    private Integer totalViews = 0;

    @Column(name = "total_favorites")
    private Integer totalFavorites = 0;

    @Column(name = "total_inquiries")
    private Integer totalInquiries = 0;

    @Column(name = "agent_count")
    private Integer agentCount = 0;

    @Column(name = "last_computed")
    private LocalDateTime lastComputed;

    // Constructors
    public PincodeScore() {
        this.lastComputed = LocalDateTime.now();
    }

    public PincodeScore(String city, String pincode) {
        this.city = city;
        this.pincode = pincode;
        this.lastComputed = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Double getPriceScore() {
        return priceScore;
    }

    public void setPriceScore(Double priceScore) {
        this.priceScore = priceScore;
    }

    public Double getMarketActivityScore() {
        return marketActivityScore;
    }

    public void setMarketActivityScore(Double marketActivityScore) {
        this.marketActivityScore = marketActivityScore;
    }

    public Double getInventoryScore() {
        return inventoryScore;
    }

    public void setInventoryScore(Double inventoryScore) {
        this.inventoryScore = inventoryScore;
    }

    public Double getBuyerOpportunityScore() {
        return buyerOpportunityScore;
    }

    public void setBuyerOpportunityScore(Double buyerOpportunityScore) {
        this.buyerOpportunityScore = buyerOpportunityScore;
    }

    public Double getDemandScore() {
        return demandScore;
    }

    public void setDemandScore(Double demandScore) {
        this.demandScore = demandScore;
    }

    public Double getLiquidityScore() {
        return liquidityScore;
    }

    public void setLiquidityScore(Double liquidityScore) {
        this.liquidityScore = liquidityScore;
    }

    public Double getGrowthScore() {
        return growthScore;
    }

    public void setGrowthScore(Double growthScore) {
        this.growthScore = growthScore;
    }

    public Double getSaturationScore() {
        return saturationScore;
    }

    public void setSaturationScore(Double saturationScore) {
        this.saturationScore = saturationScore;
    }

    public Double getConversionScore() {
        return conversionScore;
    }

    public void setConversionScore(Double conversionScore) {
        this.conversionScore = conversionScore;
    }

    public Integer getActiveListings() {
        return activeListings;
    }

    public void setActiveListings(Integer activeListings) {
        this.activeListings = activeListings;
    }

    public Double getMedianPricePerSqft() {
        return medianPricePerSqft;
    }

    public void setMedianPricePerSqft(Double medianPricePerSqft) {
        this.medianPricePerSqft = medianPricePerSqft;
    }

    public Double getAvgPricePerSqft() {
        return avgPricePerSqft;
    }

    public void setAvgPricePerSqft(Double avgPricePerSqft) {
        this.avgPricePerSqft = avgPricePerSqft;
    }

    public Double getAvgDaysOnMarket() {
        return avgDaysOnMarket;
    }

    public void setAvgDaysOnMarket(Double avgDaysOnMarket) {
        this.avgDaysOnMarket = avgDaysOnMarket;
    }

    public Integer getTotalViews() {
        return totalViews;
    }

    public void setTotalViews(Integer totalViews) {
        this.totalViews = totalViews;
    }

    public Integer getTotalFavorites() {
        return totalFavorites;
    }

    public void setTotalFavorites(Integer totalFavorites) {
        this.totalFavorites = totalFavorites;
    }

    public Integer getTotalInquiries() {
        return totalInquiries;
    }

    public void setTotalInquiries(Integer totalInquiries) {
        this.totalInquiries = totalInquiries;
    }

    public Integer getAgentCount() {
        return agentCount;
    }

    public void setAgentCount(Integer agentCount) {
        this.agentCount = agentCount;
    }

    public LocalDateTime getLastComputed() {
        return lastComputed;
    }

    public void setLastComputed(LocalDateTime lastComputed) {
        this.lastComputed = lastComputed;
    }
}
