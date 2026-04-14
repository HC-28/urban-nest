import React from "react";
import SharedPropertyGrid from "../../components/property/SharedPropertyGrid";

export default function Rent() {
  return (
    <SharedPropertyGrid
      baseFilters={{ purpose: "Rent" }}
      hideFilters={["purpose"]}
      pageTitle="Properties for Rent"
      pageSubtitle="Explore our curated list of rental homes and apartments"
      seoDescription="Browse properties available for rent in prime locations."
    />
  );
}



