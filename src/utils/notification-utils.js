import { auth, db } from "@/firebase/dbConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
 * Creates a notification for a successful sale
 * @param {Object} saleData - The sale data
 * @param {string} businessId - The business ID
 * @returns {Promise} - Promise resolving to the created notification
 */
export const createSaleNotification = async (saleData, businessId) => {
  try {
    if (!saleData || !businessId) {
      console.error("Missing required parameters for sale notification");
      return null;
    }

    const itemCount = saleData.items.reduce((sum, item) => sum + item.quantity, 0);
    const title = `New Sale: $${saleData.total.toFixed(2)}`;
    const message = `A sale of $${saleData.total.toFixed(2)} was completed with ${itemCount} item(s).`;

    const notification = await addDoc(collection(db, "notifications"), {
      title,
      message,
      type: "sale",
      businessId,
      read: false,
      timestamp: serverTimestamp(),
    });

    return {
      id: notification.id,
      title,
      message,
      type: "sale",
    };
  } catch (error) {
    console.error("Error creating sale notification:", error);
    return null;
  }
};


 // Creates a notification for new products
 
export const createNewProductNotification = async (product, businessId) => {
  try {
    if (!product || !businessId) {
      console.error("Missing required parameters for new product notification");
      return null;
    }

    const title = `New Product Added: ${product.name}`;
    const message = `A new product "${product.name}" has been added to inventory. Initial stock: ${product.quantity}, Price: $${product.price.toFixed(2)}`;

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


// Creates a notification for inventory updates
 
export const createInventoryUpdateNotification = async (product, businessId) => {
  try {
    if (!product || !businessId) {
      console.error("Missing required parameters for inventory update notification");
      return null;
    }

    let title = `Inventory Updated: ${product.name}`;
    let message = `${product.name} inventory has been updated. `;
    
    // Add specific details about what changed
    const changeDetails = [];
    if (product.quantity !== undefined) {
      changeDetails.push(`Quantity: ${product.quantity}`);
    }
    if (product.price !== undefined) {
      changeDetails.push(`Price: $${product.price.toFixed(2)}`);
    }
    if (product.threshold !== undefined) {
      changeDetails.push(`Low Stock Threshold: ${product.threshold}`);
    }
    
    message += `Changes: ${changeDetails.join(", ")}`;

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
