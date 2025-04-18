"use client";

import { useCurrency } from "@/contexts/currency-context";
import { useEffect, useState } from "react";

/**
 * A reusable component for displaying monetary values with proper formatting
 * based on the user's selected currency.
 *
 * @param {Object} props - Component props
 * @param {number|string} props.value - The monetary value to format
 * @param {string} props.sourceCurrency - The original currency of the value (default: USD)
 * @param {boolean} props.convert - Whether to convert the value to the current selected currency
 * @param {boolean} props.showSign - Whether to show a plus/minus sign
 * @param {boolean} props.showCurrency - Whether to show the currency symbol
 * @param {number} props.minimumFractionDigits - Minimum fraction digits
 * @param {number} props.maximumFractionDigits - Maximum fraction digits
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Formatted currency display
 */
export function CurrencyFormatter({
  value,
  sourceCurrency = "USD",
  convert = true,
  showSign = false,
  showCurrency = true,
  minimumFractionDigits,
  maximumFractionDigits,
  className = "",
  ...props
}) {
  // Start with a stable default rendering for server side
  const [formattedDisplay, setFormattedDisplay] = useState("$0.00");
  const [isMounted, setIsMounted] = useState(false);

  const { formatCurrency, formatNumber, currency, convertCurrency } =
    useCurrency();

  // Update the formatted value after mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);

    // Convert the value if needed
    const convertedValue = convert
      ? convertCurrency(value, sourceCurrency, currency)
      : value;

    // Format options
    const options = {
      signDisplay: showSign ? "always" : "auto",
      minimumFractionDigits,
      maximumFractionDigits,
    };

    // Format the value based on showCurrency option
    const formatted = showCurrency
      ? formatCurrency(convertedValue, options)
      : formatNumber(convertedValue, options);

    setFormattedDisplay(formatted);
  }, [
    value,
    sourceCurrency,
    convert,
    showSign,
    showCurrency,
    minimumFractionDigits,
    maximumFractionDigits,
    formatCurrency,
    formatNumber,
    currency,
    convertCurrency,
  ]);

  // Use stable initial value for SSR, then update client-side
  return (
    <span className={className} {...props}>
      {isMounted ? formattedDisplay : `$${parseFloat(value || 0).toFixed(2)}`}
    </span>
  );
}

/**
 * A component for displaying price changes (e.g., +$10.00, -$5.00)
 *
 * @param {Object} props - Component props
 * @param {number|string} props.value - The monetary value to format
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Formatted price change with appropriate styling
 */
export function PriceChange({ value, className = "", ...props }) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const isPositive = numericValue > 0;
  const isNegative = numericValue < 0;

  // Dynamic styling based on positive/negative values
  const dynamicClass = isPositive
    ? "text-green-600"
    : isNegative
    ? "text-red-600"
    : "";

  return (
    <CurrencyFormatter
      value={value}
      showSign={true}
      className={`${dynamicClass} ${className}`}
      {...props}
    />
  );
}
