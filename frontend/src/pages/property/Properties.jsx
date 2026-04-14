import React from "react";
import SharedPropertyGrid from "../../components/property/SharedPropertyGrid";
import { useSearchParams } from "react-router-dom";

export default function Properties() {
  const [searchParams] = useSearchParams();
  const searchStr = searchParams.get("search");

  return (
    <SharedPropertyGrid
      pageTitle={searchStr ? `Search Results: "${searchStr}"` : "All Properties"}
      pageSubtitle="Browse our complete collection of real estate"
    />
  );
}



