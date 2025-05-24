"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { CurrencyFormatter } from "@/components/currency-formatter";
import { formatAsCurrency } from "@/utils/currency-utils";
import { getAuth } from "firebase/auth";
import { useCurrency } from "@/contexts/currency-context";

export function CashierSummary() {
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    orderCount: 0,
    averageOrderValue: 0,
    transactions: [],
  });
  const [businessData, setBusinessData] = useState({
    businessName: "",
    taxRate: 0,
    currency: "USD",
  });
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("loading"); // 'loading', 'authenticated', or 'unauthenticated'
  // Use the currency context at component level, not inside effects
  const { currency, setCurrency, CURRENCY_CONFIG } = useCurrency();
  // useEffect for any future business logic without console logs
  useEffect(() => {
    // Currency and business data tracking logic can go here if needed
  }, [currency, businessData.currency, CURRENCY_CONFIG]);

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        // Wait for auth state to be determined
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (!user) {
            console.log("Waiting for user authentication...");
            setAuthStatus("unauthenticated");
            setLoading(false);
            return;
          }

          setAuthStatus("authenticated");
          // Now we have a user, we can fetch data
          fetchUserSalesData(user);
        });

        // Clean up the listener
        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        setLoading(false);
      }
    }; // Separate function to fetch sales data once we have a user
    const fetchUserSalesData = async (currentUser) => {
      try {
        // First, get the user's document using their email
        const userQuery = query(
          collection(db, "Users"),
          where("email", "==", currentUser.email)
        );

        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          console.error(
            "User document not found for email:",
            currentUser.email
          );
          setLoading(false);
          return;
        }

        // Get the first matching user document
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const businessId = userData.businessId;

        if (!businessId) {
          console.error("User has no associated business");
          setLoading(false);
          return;
        } // Fetch business details
        const businessDocRef = doc(db, "businesses", businessId);
        const businessDoc = await getDoc(businessDocRef);

        if (businessDoc.exists()) {
          const business = businessDoc.data();
          // Normalize the currency to handle any case issues
          const businessCurrency = (business.currency || "USD").toUpperCase();

          setBusinessData({
            businessName: business.businessName || "",
            taxRate: business.taxRate || 0,
            currency: businessCurrency,
          });

          // Update the currency in the context - this is crucial for proper conversion
          setCurrency(businessCurrency);
        } // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tomorrow's date at midnight
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Convert to Firestore Timestamps
        const startOfDay = Timestamp.fromDate(today);
        const endOfDay = Timestamp.fromDate(tomorrow);
        try {
          // Query for sales transactions today by this cashier
          // Check for possible cashierId fields in the sales records
          // Let's try multiple possible values that might be stored as cashierId
          const possibleCashierIds = [
            userDoc.id, // Firebase document ID
            userData.id, // Any ID field in the user data
            currentUser.uid, // Firebase auth UID
            currentUser.email, // User's email
            userData.email, // Email from user document
          ].filter(Boolean); // Remove any undefined values

          // We'll need to run multiple queries since Firestore doesn't support OR conditions
          let allTransactions = [];
          let totalAmount = 0; // First try the compound query with the document ID
          const mainQuery = query(
            collection(db, "sales"),
            where("cashierId", "==", userDoc.id),
            where("timestamp", ">=", startOfDay),
            where("timestamp", "<", endOfDay)
          );

          const mainQuerySnapshot = await getDocs(mainQuery);
          // Create a local transactions array
          let transactions = [];
          mainQuerySnapshot.forEach((doc) => {
            const sale = doc.data();

            // More robust parsing of totalAmount
            let saleAmount = 0;
            if (sale.totalAmount) {
              // Handle different possible formats of totalAmount
              if (typeof sale.totalAmount === "number") {
                saleAmount = sale.totalAmount;
              } else if (typeof sale.totalAmount === "string") {
                saleAmount =
                  parseFloat(sale.totalAmount.replace(/[^0-9.-]+/g, "")) || 0;
              }
            } else if (sale.total) {
              // Check if it's stored as 'total' instead of 'totalAmount'
              if (typeof sale.total === "number") {
                saleAmount = sale.total;
              } else if (typeof sale.total === "string") {
                saleAmount =
                  parseFloat(sale.total.replace(/[^0-9.-]+/g, "")) || 0;
              }
            } else if (sale.amount) {
              // Check if it's stored as 'amount'
              if (typeof sale.amount === "number") {
                saleAmount = sale.amount;
              } else if (typeof sale.amount === "string") {
                saleAmount =
                  parseFloat(sale.amount.replace(/[^0-9.-]+/g, "")) || 0;
              }
            } else {
              // If no direct amount field is found, try to calculate from items
              if (sale.items && Array.isArray(sale.items)) {
                saleAmount = sale.items.reduce((sum, item) => {
                  const itemPrice =
                    typeof item.price === "number"
                      ? item.price
                      : parseFloat(item.price || 0);
                  const itemQuantity =
                    typeof item.quantity === "number"
                      ? item.quantity
                      : parseFloat(item.quantity || 1);
                  return sum + itemPrice * itemQuantity;
                }, 0);
              }
            }

            totalAmount += saleAmount;

            transactions.push({
              id: doc.id,
              ...sale,
              // Ensure the transaction data has a numeric totalAmount
              totalAmount: saleAmount,
            });
          });
          const orderCount = transactions.length;
          const averageOrderValue =
            orderCount > 0 ? totalAmount / orderCount : 0;

          setSalesData({
            totalSales: totalAmount,
            orderCount,
            averageOrderValue,
            transactions,
          });
        } catch (error) {
          console.error("Error fetching sales data:", error);
          // If we get an index error, show a more user-friendly message
          if (
            error.code === "failed-precondition" ||
            error.message.includes("requires an index")
          ) {
            console.log(
              "This query requires a Firestore index. Please check the console for the index creation link."
            );
            console.log(
              "You need to create a composite index for sales collection with cashierId, timestamp fields"
            );
            console.log(
              "Visit Firebase console -> Firestore Database -> Indexes tab to create the required index"
            );

            // Show some default data instead of failing completely
            setSalesData({
              totalSales: 0,
              orderCount: 0,
              averageOrderValue: 0,
              transactions: [],
            });
          }
        }
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySales();
  }, [setCurrency]);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Today's Sales Summary</h1>
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/20 to-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                "Loading..."
              ) : (
                <CurrencyFormatter
                  value={salesData.totalSales}
                  sourceCurrency="USD"
                  convert={true}
                  showCurrency={true}
                  minimumFractionDigits={2}
                  maximumFractionDigits={2}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading transactions...</p>
          ) : salesData.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-2">
                        {transaction.timestamp
                          ? new Date(
                              transaction.timestamp.seconds * 1000
                            ).toLocaleTimeString()
                          : "N/A"}
                      </td>
                      <td className="py-2">{transaction.id.substring(0, 8)}</td>
                      <td className="py-2">
                        <CurrencyFormatter
                          value={transaction.totalAmount || 0}
                          sourceCurrency="USD"
                          convert={true}
                          showCurrency={true}
                          minimumFractionDigits={2}
                          maximumFractionDigits={2}
                        />
                      </td>
                      <td className="py-2">{transaction.items?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              {authStatus === "authenticated"
                ? "No transactions today"
                : "Please sign in to view your transactions"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
