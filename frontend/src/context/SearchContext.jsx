import React, { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useState({
        city: '',
        pinCode: '',
        type: 'All',
        purpose: 'All',
        minPrice: '',
        maxPrice: '',
        bhk: 'All'
    });

    // Helper to update specific fields
    const updateSearch = (newParams) => {
        setSearchParams(prev => ({ ...prev, ...newParams }));
    };

    // Helper to reset search
    const resetSearch = () => {
        setSearchParams({
            city: '',
            pinCode: '',
            type: 'All',
            purpose: 'All',
            minPrice: '',
            maxPrice: '',
            bhk: 'All'
        });
    };

    return (
        <SearchContext.Provider value={{ searchParams, updateSearch, resetSearch }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};

