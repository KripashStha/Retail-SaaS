"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/firebase/dbConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Define currency config with symbols and formatting options
const CURRENCY_CONFIG = {
  USD: { symbol: "$", locale: "en-US", position: "before" },
  EUR: { symbol: "€", locale: "de-DE", position: "after" },
  GBP: { symbol: "£", locale: "en-GB", position: "before" },
  JPY: { symbol: "¥", locale: "ja-JP", position: "before" },
  CAD: { symbol: "C$", locale: "en-CA", position: "before" },
  AUD: { symbol: "A$", locale: "en-AU", position: "before" },
  INR: { symbol: "₹", locale: "en-IN", position: "before" },
  NPR: { symbol: "रू", locale: "ne-NP", position: "before" },
};

// Add exchange rates for currency conversion
// These are sample rates relative to USD (1 USD = X units of foreign currency)
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.8,
  JPY: 150.49,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.37,
  NPR: 132.55,
};

// Create the context
const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  // Initialize with a stable state for both server and client
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  // This effect only runs on the client side and sets up the client-specific state
  useEffect(() => {
    setIsClientSide(true);
    const savedCurrency = localStorage.getItem("preferredCurrency");
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Update localStorage when currency changes (only on client)
  useEffect(() => {
    if (isClientSide) {
      localStorage.setItem("preferredCurrency", currency);
    }
  }, [currency, isClientSide]);

  // Fetch the user's preferred currency from Firestore
  useEffect(() => {
    const fetchCurrencyPreference = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        // Get the business ID associated with the current user
        const userQuery = query(
          collection(db, "Users"),
          where("email", "==", auth.currentUser.email)
        );

        const userSnapshot = await getDocs(userQuery);
        if (userSnapshot.empty) {
          setLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data();
        const businessId = userData.businessId;
        setBusinessId(businessId);

        // Fetch business settings to get the currency
        const businessDoc = await getDoc(doc(db, "businesses", businessId));
        if (businessDoc.exists()) {
          const businessData = businessDoc.data();
          if (businessData.currency) {
            setCurrency(businessData.currency);
          }
        }
      } catch (error) {
        console.error("Error fetching currency preference:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyPreference();
  }, []);

  // Format a number as currency based on the current currency setting
  const formatCurrency = (amount, options = {}) => {
    if (amount === undefined || amount === null) return "";

    // Get the currency configuration
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;

    // Parse the amount to ensure it's a number
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    // Handle NaN
    if (isNaN(numericAmount)) return "";

    // Format the number using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits:
        options.minimumFractionDigits !== undefined
          ? options.minimumFractionDigits
          : 2,
      maximumFractionDigits:
        options.maximumFractionDigits !== undefined
          ? options.maximumFractionDigits
          : 2,
      ...options,
    });

    return formatter.format(numericAmount);
  };

  // Format a raw number without currency symbol
  const formatNumber = (amount, options = {}) => {
    if (amount === undefined || amount === null) return "";

    // Get the currency configuration for locale
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;

    // Parse the amount to ensure it's a number
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    // Handle NaN
    if (isNaN(numericAmount)) return "";

    // Format the number using Intl.NumberFormat without currency styling
    const formatter = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits:
        options.minimumFractionDigits !== undefined
          ? options.minimumFractionDigits
          : 2,
      maximumFractionDigits:
        options.maximumFractionDigits !== undefined
          ? options.maximumFractionDigits
          : 2,
      ...options,
    });

    return formatter.format(numericAmount);
  };

  // Get the symbol for the current currency
  const getCurrencySymbol = () => {
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
    return config.symbol;
  };

  // Convert an amount from one currency to another
  const convertCurrency = (
    amount,
    fromCurrency = "USD",
    toCurrency = currency
  ) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 0;

    // If the currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) return amount;

    // First convert to USD (base currency) if not already
    const amountInUSD =
      fromCurrency === "USD" ? amount : amount / EXCHANGE_RATES[fromCurrency];

    // Then convert from USD to target currency
    return amountInUSD * EXCHANGE_RATES[toCurrency];
  };

  const value = {
    currency,
    setCurrency,
    formatCurrency,
    formatNumber,
    getCurrencySymbol,
    convertCurrency,
    loading,
    CURRENCY_CONFIG,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Custom hook to use the currency context
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
