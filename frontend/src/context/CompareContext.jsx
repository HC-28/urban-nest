import React, { createContext, useState, useContext } from 'react';
import toast from 'react-hot-toast';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
    const [compareList, setCompareList] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const toggleCompare = (property) => {
        setCompareList((prev) => {
            const exists = prev.find(p => p.id === property.id);
            if (exists) {
                return prev.filter(p => p.id !== property.id);
            } else {
                if (prev.length >= 4) {
                    toast.error("You can only compare up to 4 properties at a time.");
                    return prev;
                }
                return [...prev, property];
            }
        });
    };

    const removeFromCompare = (propertyId) => {
        setCompareList(prev => prev.filter(p => p.id !== propertyId));
    };

    const clearCompare = () => {
        setCompareList([]);
        setShowCompareModal(false);
    };

    const openCompareModal = () => {
        if (compareList.length > 1) {
            setShowCompareModal(true);
        } else {
            toast.error("Please select at least 2 properties to compare.");
        }
    };

    const closeCompareModal = () => {
        setShowCompareModal(false);
    };

    return (
        <CompareContext.Provider value={{
            compareList,
            toggleCompare,
            removeFromCompare,
            clearCompare,
            showCompareModal,
            openCompareModal,
            closeCompareModal
        }}>
            {children}
        </CompareContext.Provider>
    );
};


