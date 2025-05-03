import { auth, db } from "@/firebase/dbConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDoc, doc } from "firebase/firestore";

/**
 * Gets the current currency symbol from the business settings
 * @param {string} businessId - The business ID
 * @returns {Promise<string>} - Promise resolving to the currency symbol
 */
export const getCurrencySymbol = async (businessId) => {
  try {
    if (!businessId) return "$"; // Default fallback
    
    const businessDoc = await getDoc(doc(db, "businesses", businessId));
    if (businessDoc.exists()) {
      const { currency = "USD" } = businessDoc.data();
      
      // Currency symbol mapping - simplified version
      const symbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        CAD: "C$",
        AUD: "A$",
        INR: "₹",
        NPR: "रू",
      };
      
      return symbols[currency] || "$";
    }
    
    return "$"; // Default fallback
  } catch (error) {
    console.error("Error getting currency symbol:", error);
    return "$"; // Default fallback
  }
};

/**
 * Creates a low stock notification for a product
 * @param {Object} product - The product object
 * @param {string} businessId - The business ID
 * @returns {Promise} - Promise resolving to the created notification
 */
export const createLowStockNotification = async (product, businessId) => {
  try {
    if (!product || !businessId) {
      console.error("Missing required parameters for notification");
      return null;
    }

    const isOutOfStock = product.quantity <= 0;
    const type = isOutOfStock ? "out_of_stock" : "low_stock";
    const title = isOutOfStock 
      ? `Out of Stock: ${product.name}`
      : `Low Stock Alert: ${product.name}`;
    const message = isOutOfStock
      ? `${product.name} is out of stock. Please restock as soon as possible.`
      : `${product.name} is running low on stock. Current quantity: ${product.quantity}, Threshold: ${product.threshold}`;

    const notification = await addDoc(collection(db, "notifications"), {
      title,
      message,
      type,
      businessId,
      productId: product.id,
      read: false,
      timestamp: serverTimestamp(),
    });

    return {
      id: notification.id,
      title,
      message,
      type,
      productId: product.id,
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

/**
 * Checks if a product needs a low stock notification
 * @param {Object} product - The product object
 * @returns {boolean} - Whether a notification should be created
 */
export const shouldNotifyLowStock = (product) => {
  if (!product || typeof product.quantity !== 'number' || typeof product.threshold !== 'number') {
    return false;
  }
  
  return product.quantity <= product.threshold;
};

/**
 * Creates a notification for new products
 */
export const createNewProductNotification = async (product, businessId) => {
  try {
    if (!product || !businessId) {
      console.error("Missing required parameters for new product notification");
      return null;
    }

    const currencySymbol = await getCurrencySymbol(businessId);
    const title = `New Product Added: ${product.name}`;
    const message = `A new product "${product.name}" has been added to inventory. Initial stock: ${product.quantity}, Price: ${currencySymbol}${product.price.toFixed(2)}`;

    console.log("Creating new product notification:", { title, message });

    const notification = await addDoc(collection(db, "notifications"), {
      title,
      message,
      type: "new_product",
      businessId,
      productId: product.id,
      read: false,
      timestamp: serverTimestamp(),
    });

    console.log("New product notification created with ID:", notification.id);

    return {
      id: notification.id,
      title,
      message,
      type: "new_product",
      productId: product.id,
    };
  } catch (error) {
    console.error("Error creating new product notification:", error);
    return null;
  }
};

/**
 * Creates a notification for inventory updates
 */
export const createInventoryUpdateNotification = async (product, changes, businessId) => {
  try {
    if (!product || !changes || !businessId) {
      console.error("Missing required parameters for inventory update notification");
      return null;
    }

    let title = `Inventory Updated: ${product.name}`;
    let message = `${product.name} inventory has been updated. `;
    
    const currencySymbol = await getCurrencySymbol(businessId);
    
    // Add specific details about what changed
    const changeDetails = [];
    
    // Process each changed field
    if (changes.quantity) {
      changeDetails.push(`Quantity: ${changes.quantity.from} → ${changes.quantity.to}`);
    }
    
    if (changes.price) {
      changeDetails.push(`Price: ${currencySymbol}${changes.price.from.toFixed(2)} → ${currencySymbol}${changes.price.to.toFixed(2)}`);
    }
    
    if (changes.threshold) {
      changeDetails.push(`Low Stock Threshold: ${changes.threshold.from} → ${changes.threshold.to}`);
    }
    
    if (changes.name) {
      changeDetails.push(`Name: ${changes.name.from} → ${changes.name.to}`);
    }
    
    if (changes.category) {
      changeDetails.push(`Category: ${changes.category.from || 'None'} → ${changes.category.to || 'None'}`);
    }
    
    if (changes.barcode) {
      changeDetails.push(`Barcode: ${changes.barcode.from || 'None'} → ${changes.barcode.to || 'None'}`);
    }
    
    // If no specific changes were tracked, provide a generic message
    if (changeDetails.length === 0) {
      message += "Product details have been modified.";
    } else {
      message += `Changes: ${changeDetails.join(", ")}`;
    }

    console.log("Creating inventory update notification:", { title, message });

    const notification = await addDoc(collection(db, "notifications"), {
      title,
      message,
      type: "inventory_update",
      businessId,
      productId: product.id,
      read: false,
      timestamp: serverTimestamp(),
    });

    console.log("Inventory update notification created with ID:", notification.id);

    return {
      id: notification.id,
      title,
      message,
      type: "inventory_update",
      productId: product.id,
    };
  } catch (error) {
    console.error("Error creating inventory update notification:", error);
    return null;
  }
};
