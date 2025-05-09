"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  onAuthStateChanged,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged as firebaseAuthStateChanged } from "firebase/auth";

// Create context
const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false); // Track if auth has been initialized
  const { toast } = useToast();

  // Helper function to safely convert timestamps
  const safelyConvertTimestamp = (timestamp) => {
    if (!timestamp) return null;

    // If it's a Firestore timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }

    // If it's a JavaScript Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a timestamp number (seconds or milliseconds)
    if (typeof timestamp === "number") {
      // Check if it's seconds (Firestore uses seconds) or milliseconds
      return new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    }

    // If it's a string, try to parse it
    if (typeof timestamp === "string") {
      try {
        return new Date(timestamp);
      } catch (e) {
        console.error("Failed to parse timestamp string:", timestamp, e);
        return null;
      }
    }

    // Default case, return null
    console.warn("Unknown timestamp format:", timestamp);
    return null;
  };

  // Function to safely stringify products for comparison
  const safeProductsToString = (products) => {
    if (!products || !Array.isArray(products)) return "[]";

    try {
      // Create a simplified version of products for comparison
      // that avoids issues with date objects
      const simplifiedProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === "number" ? p.price.toFixed(2) : p.price,
        quantity: p.quantity,
        threshold: p.threshold,
        category: p.category,
        barcode: p.barcode,
        businessId: p.businessId,
        // Skip timestamps for comparison to avoid false negatives
      }));

      return JSON.stringify(simplifiedProducts);
    } catch (err) {
      console.error("Error stringifying products:", err);
      return "[]";
    }
  };

  // Listen for authentication state - use a single auth listener
  useEffect(() => {
    setLoading(true); // Set loading state when starting auth check
    console.log("Setting up auth listener");

    // This ensures we only complete initialization once auth state is fully determined
    const unsubscribeAuth = firebaseAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setCurrentUser(user);
      setAuthInitialized(true); // Mark auth as initialized regardless of result
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch business ID and set up real-time listener when authentication changes
  useEffect(() => {
    // Only proceed if auth is initialized, whether user is logged in or not
    if (!authInitialized) {
      console.log("Auth not yet initialized, waiting...");
      return;
    }

    let unsubscribeProducts = null;
    let retryCount = 0;
    const MAX_RETRIES = 15; // Maximum number of retries for fetching user data
    const RETRY_DELAY = 1500; // 1.5 seconds between retries

    const fetchBusinessData = async () => {
      // Reset states when user changes
      setProducts([]);
      setError(null);
      setBusinessId(null);
      setInitialized(false);
      setLoading(true);

      try {
        // Check if user is authenticated
        if (!currentUser) {
          console.log("No authenticated user found");
          setLoading(false);
          return;
        }

        // Query for user data
        const userDoc = await getDocs(
          query(
            collection(db, "Users"),
            where("email", "==", currentUser.email)
          )
        );

        // Check if user document exists
        if (userDoc.empty) {
          // Only log in development environment or as debug level
          if (process.env.NODE_ENV === "development") {
            console.debug(
              `User data not found (attempt ${retryCount + 1}/${MAX_RETRIES})`
            );
          }

          if (retryCount < MAX_RETRIES) {
            retryCount++;
            // Don't set error yet, just retry silently
            setTimeout(fetchBusinessData, RETRY_DELAY);
            return;
          } else {
            // Replace console.error with console.debug to avoid showing in console
            console.debug(
              "User data not found after maximum retries:",
              currentUser.email
            );
            // Store user email in a variable for better error message
            const userEmail = currentUser.email;
            // You could potentially trigger a redirect to setup page or show a UI notification here
            setError(
              `No business profile found for ${userEmail}. Please complete your business setup.`
            );
            setLoading(false);
            return;
          }
        }

        // Get business ID from user document
        const id = userDoc.docs[0].data().businessId;
        console.log("Business ID found:", id);
        setBusinessId(id);

        // Set up the products listener
        setUpProductsListener(id);
      } catch (err) {
        console.error("Error fetching business data:", err);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(
            `Retrying after error (attempt ${retryCount}/${MAX_RETRIES})`
          );
          setTimeout(fetchBusinessData, RETRY_DELAY);
        } else {
          setError("Error fetching data: " + err.message);
          setLoading(false);
        }
      }
    };

    // Extract the product listener setup to a separate function for reuse
    const setUpProductsListener = (businessId) => {
      try {
        // Set up real-time listener for products
        const productsQuery = query(
          collection(db, "products"),
          where("businessId", "==", businessId)
        );

        console.log("Setting up products listener for business:", businessId);

        unsubscribeProducts = onSnapshot(
          productsQuery,
          (snapshot) => {
            try {
              // Process all products
              const productsData = snapshot.docs.map((doc) => {
                const data = doc.data();

                // Parse numeric fields explicitly to ensure correct types
                // This is important for quantity comparisons
                return {
                  id: doc.id,
                  name: data.name || "",
                  price:
                    typeof data.price === "number"
                      ? data.price
                      : parseFloat(data.price || 0),
                  quantity:
                    typeof data.quantity === "number"
                      ? data.quantity
                      : parseInt(data.quantity || 0, 10),
                  threshold:
                    typeof data.threshold === "number"
                      ? data.threshold
                      : parseInt(data.threshold || 0, 10),
                  category: data.category || "",
                  barcode: data.barcode || "",
                  businessId: data.businessId,
                  // Handle timestamps properly
                  createdAt: safelyConvertTimestamp(data.createdAt),
                  updatedAt: safelyConvertTimestamp(data.updatedAt),
                  lastSold: safelyConvertTimestamp(data.lastSold),
                };
              });

              // Sort products by creation date (newest first)
              productsData.sort((a, b) => {
                // Primary sort by creation date (newest first)
                if (a.createdAt && b.createdAt) {
                  return b.createdAt - a.createdAt;
                }

                // If createdAt is missing for either product, use updatedAt as fallback
                if (a.updatedAt && b.updatedAt) {
                  return b.updatedAt - a.updatedAt;
                }

                // Last resort: sort by name
                return a.name.localeCompare(b.name);
              });

              console.log(
                `Loaded ${productsData.length} products successfully`
              );
              setProducts(productsData);
              setInitialized(true);
              setError(null);
              setLoading(false);
            } catch (err) {
              console.error("Error processing products snapshot:", err);
              setError("Failed to process inventory data");
              setLoading(false);
            }
          },
          (err) => {
            console.error("Error in products listener:", err);
            // Only set error if we haven't already unsubscribed
            setError("Error fetching inventory: " + err.message);
            setLoading(false);
          }
        );
      } catch (queryError) {
        console.error("Error creating products query:", queryError);
        setError("Error setting up inventory listener: " + queryError.message);
        setLoading(false);
      }
    };

    fetchBusinessData();

    return () => {
      // Cleanup the products listener when the component unmounts or when user changes
      if (unsubscribeProducts) {
        unsubscribeProducts();
      }
    };
  }, [currentUser, authInitialized]); // Only depend on currentUser and authInitialized

  // Function to get low stock products
  const getLowStockProducts = () => {
    return products.filter(
      (product) => product.quantity <= product.threshold && product.quantity > 0
    );
  };

  // Context value
  const value = {
    products,
    loading,
    error,
    getLowStockProducts,
    businessId,
    initialized,
    authInitialized,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

// Custom hook to use the inventory context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
