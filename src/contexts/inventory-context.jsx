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
      const simplifiedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === 'number' ? p.price.toFixed(2) : p.price,
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
        // Note: We're using the try/catch without the orderBy to account for possible missing indices
        let productsQuery;
        try {
          productsQuery = query(
            collection(db, "products"),
            where("businessId", "==", id)
          );
          
          // We'll sort in-memory if needed rather than rely on Firestore orderBy
          // which can fail if there's no index
        } catch (queryError) {
          console.error("Error creating products query:", queryError);
          productsQuery = query(
            collection(db, "products"),
            where("businessId", "==", id)
          );
        }
        
        console.log("Setting up products listener for business:", id);
        
        unsubscribeProducts = onSnapshot(
          productsQuery,
          (snapshot) => {
            try {
              console.log("Products snapshot received, changes:", snapshot.docChanges().length);
              
              // Process document changes
              if (snapshot.docChanges().length > 0) {
                snapshot.docChanges().forEach(change => {
                  const changeType = change.type;
                  const docData = change.doc.data();
                  console.log(`Document ${change.doc.id} ${changeType}:`, 
                    docData.name, 
                    docData.quantity, 
                    docData.updatedAt);
                });
              }
              
              // Process all products
              const productsData = snapshot.docs.map((doc) => {
                const data = doc.data();
                
                // Parse numeric fields explicitly to ensure correct types
                // This is important for quantity comparisons
                return {
                  id: doc.id,
                  name: data.name || '',
                  price: typeof data.price === 'number' ? data.price : parseFloat(data.price || 0),
                  quantity: typeof data.quantity === 'number' ? data.quantity : parseInt(data.quantity || 0, 10),
                  threshold: typeof data.threshold === 'number' ? data.threshold : parseInt(data.threshold || 0, 10),
                  category: data.category || '',
                  barcode: data.barcode || '',
                  businessId: data.businessId,
                  // Handle timestamps properly
                  createdAt: safelyConvertTimestamp(data.createdAt),
                  updatedAt: safelyConvertTimestamp(data.updatedAt),
                  lastSold: safelyConvertTimestamp(data.lastSold),
                };
              });
              
              // Store the original timestamps for display purposes
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
                
                // Fall back to category and name if no timestamps available
                if (a.category !== b.category) {
                  return a.category.localeCompare(b.category);
                }
                
                return a.name.localeCompare(b.name);
              });
              
              console.log("Processed product data:", productsData.length);
              
              // Use functional update to ensure we're working with the latest state
              setProducts(currentProducts => {
                // Compare if anything actually changed to prevent unnecessary rerenders
                const currentString = safeProductsToString(currentProducts);
                const newString = safeProductsToString(productsData);
                
                if (currentString !== newString) {
                  console.log("Products data has changed, updating state");
                  return productsData;
                }
                
                console.log("Products unchanged, maintaining current state");
                return currentProducts;
              });
              
              setLoading(false);
              setInitialized(true);
            } catch (err) {
              console.error("Error processing product data:", err);
              setError("Failed to process product data: " + err.message);
              setLoading(false);
            }
          },
          (err) => {
            console.error("Firestore listener error:", err);
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
        console.error("Error fetching business data:", err);
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
  }, [currentUser, toast]);

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