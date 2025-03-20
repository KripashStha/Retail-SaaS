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
  const { toast } = useToast();

  // Helper function to safely convert timestamps
  const safelyConvertTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    // If it's a Firestore timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // If it's a JavaScript Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // If it's a timestamp number (seconds or milliseconds)
    if (typeof timestamp === 'number') {
      // Check if it's seconds (Firestore uses seconds) or milliseconds
      return new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    }
    
    // If it's a string, try to parse it
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    // Default case, return null
    return null;
  };

  // Listen for authentication state
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribeAuth = firebaseAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? user.email : "No user");
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch business ID and set up real-time listener when authentication changes
  useEffect(() => {
    console.log("Inventory context checking user:", currentUser?.email);
    let unsubscribeProducts = null;

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
        
        console.log("Processing for user:", currentUser.email);
        
        // Query for user data
        const userDoc = await getDocs(
          query(
            collection(db, "Users"),
            where("email", "==", currentUser.email)
          )
        );
        
        // Check if user document exists
        if (userDoc.empty) {
          console.log("User document not found for email:", currentUser.email);
          setError("User data not found");
          setLoading(false);
          return;
        }
        
        // Get business ID from user document
        const id = userDoc.docs[0].data().businessId;
        setBusinessId(id);
        
        // Set up real-time listener for products
        const productsQuery = query(
          collection(db, "products"),
          where("businessId", "==", id)
        );
        
        console.log("Setting up products listener for business:", id);
        
        unsubscribeProducts = onSnapshot(
          productsQuery,
          (snapshot) => {
            try {
              const productsData = snapshot.docs.map((doc) => {
                const data = doc.data();
                // Safely convert timestamps
                return {
                  id: doc.id,
                  ...data,
                  createdAt: safelyConvertTimestamp(data.createdAt),
                  updatedAt: safelyConvertTimestamp(data.updatedAt),
                  lastSold: safelyConvertTimestamp(data.lastSold),
                };
              });
              
              setProducts(productsData);
              setLoading(false);
              setInitialized(true);
            } catch (err) {
              setError("Failed to process product data");
              setLoading(false);
            }
          },
          (err) => {
            setError("Failed to load inventory data");
            setLoading(false);
            toast({
              title: "Error",
              description: "Failed to load inventory data in real-time",
              variant: "destructive",
            });
          }
        );
      } catch (err) {
        setError("Failed to load business data");
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchBusinessData();
    } else {
      setLoading(false);
    }

    // Clean up subscription on unmount or when user changes
    return () => {
      console.log("Cleaning up inventory listener");
      if (unsubscribeProducts) {
        unsubscribeProducts();
      }
    };
  }, [currentUser]);

  // Get a single product by ID (with real-time updates)
  const getProduct = (productId) => {
    return products.find((product) => product.id === productId) || null;
  };

  // Get products by category
  const getProductsByCategory = (category) => {
    return products.filter((product) => product.category === category);
  };

  // Get low stock products
  const getLowStockProducts = () => {
    return products.filter(
      (product) => product.quantity <= product.threshold
    );
  };

  // Search products by name, category, or barcode
  const searchProducts = (searchTerm) => {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        (product.name && product.name.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term)) ||
        (product.barcode && product.barcode.includes(term))
    );
  };

  console.log(`InventoryContext state: ${products.length} products, loading: ${loading}, initialized: ${initialized}, error: ${error}`);

  return (
    <InventoryContext.Provider
      value={{
        products,
        loading,
        error,
        initialized,
        businessId,
        getProduct,
        getProductsByCategory,
        getLowStockProducts,
        searchProducts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

// Custom hook to use the inventory context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}; 