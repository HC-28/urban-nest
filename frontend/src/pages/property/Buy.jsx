import React from "react";
import SharedPropertyGrid from "../../components/property/SharedPropertyGrid";

export default function Buy() {
  return (
    <SharedPropertyGrid
      baseFilters={{ purpose: "Sale" }}
      hideFilters={["purpose"]}
      pageTitle="Properties for Sale"
      pageSubtitle="Find your dream home and make it yours"
      seoDescription="Browse properties available for sale in prime locations."
    />
  );
}



