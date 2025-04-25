"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Camera,
  X,
  Printer,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { BrowserMultiFormatReader } from "@zxing/library";
import debounce from "lodash/debounce";
import {
  createSaleNotification,
  createLowStockNotification,
  shouldNotifyLowStock,
} from "@/utils/notification-utils";
import { useInventory } from "@/contexts/inventory-context";
import { CurrencyFormatter } from "@/components/currency-formatter";
import { useCurrency } from "@/contexts/currency-context";

export function PointOfSale() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [stream, setStream] = useState(null);
  const [taxRate, setTaxRate] = useState(10); // 10% default tax rate
  const [discountType, setDiscountType] = useState("none"); // 'none', 'percentage', 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const { currency, getCurrencySymbol, convertCurrency } = useCurrency();

  // Get products and businessId from inventory context
  const { products, loading, error, businessId, searchProducts } =
    useInventory();

  // Create a debounced search function
  const debouncedSearchProducts = useRef(
    debounce((term) => {
      setSearchTerm(term);
    }, 300)
  ).current;

  // Update filtered products whenever search term or products change
  useEffect(() => {
    if (searchTerm) {
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode?.includes(searchTerm) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  // Initialize barcode scanner with improved error handling
  const initializeScanner = async () => {
    try {
      setShowScanner(true);
      setIsInitializing(true);

      const permission = await navigator.permissions.query({ name: "camera" });
      if (permission.state === "denied") {
        throw new Error(
          "Camera permission is denied. Please enable it in your browser settings."
        );
      }

      codeReader.current.reset();
      codeReader.current.timeBetweenScansMillis = 1000; // 1 second between scans

      codeReader.current.decodeFromConstraints(
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            console.log("Scanned barcode:", barcode);

            const product = products.find((p) => p.barcode === barcode);
            if (product) {
              // Check if the product is in stock
              if (product.quantity <= 0) {
                toast({
                  title: "Out of Stock",
                  description: `${product.name} is currently out of stock.`,
                  variant: "destructive",
                });
                return;
              }

              // Check if adding another would exceed available stock
              const cartItem = cart.find((item) => item.id === product.id);
              if (cartItem && cartItem.quantity >= product.quantity) {
                toast({
                  title: "Stock Limit Reached",
                  description: `Only ${product.quantity} units of ${product.name} available.`,
                  variant: "destructive",
                });
                return;
              }

              addToCart(product);
              toast({
                title: "Product Found",
                description: `Added ${product.name} to cart`,
              });
            } else {
              toast({
                title: "Product Not Found",
                description: `No product found for barcode: ${barcode}`,
                variant: "destructive",
              });
            }
          }
        }
      );

      setIsScannerReady(true);
    } catch (error) {
      console.error("Camera initialization error:", error);
      toast({
        title: "Camera Error",
        description: error.message,
        variant: "destructive",
      });
      cleanupScanner();
    } finally {
      setIsInitializing(false);
    }
  };

  // Fetch tax rate from business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        if (businessId) {
          const businessDoc = await getDoc(doc(db, "businesses", businessId));
          if (businessDoc.exists() && businessDoc.data().taxRate) {
            setTaxRate(businessDoc.data().taxRate);
          }
        }
      } catch (error) {
        console.error("Error fetching business tax rate:", error);
      }
    };

    fetchBusinessData();

    // Cleanup function to ensure camera is properly released when component unmounts
    return () => {
      cleanupScanner();
    };
  }, [businessId]);

  // Handle search input changes with debounce
  const handleSearchChange = (e) => {
    debouncedSearchProducts(e.target.value);
  };

  // Calculate totals with discounts
  const calculateTotals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discount = 0;
    if (discountType === "percentage") {
      discount = Math.min(subtotal * (discountValue / 100), subtotal); // Cap percentage discount at 100%
    } else if (discountType === "fixed") {
      discount = Math.min(discountValue, subtotal); // Cap fixed discount at subtotal
    }

    const discountedSubtotal = subtotal - discount;
    const tax = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + tax;

    return {
      subtotal,
      discount,
      discountedSubtotal,
      tax,
      total,
    };
  }, [cart, taxRate, discountType, discountValue]);

  // Add item to cart with stock validation
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        // Get the latest product data from context for stock validation
        const latestProductData = products.find((p) => p.id === product.id);

        // Check if adding another would exceed available stock
        if (existingItem.quantity >= latestProductData.quantity) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${latestProductData.quantity} units of ${latestProductData.name} available.`,
            variant: "destructive",
          });
          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Update cart item quantity with real-time stock validation
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    // Find the product using real-time data to check stock
    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.quantity) {
      toast({
        title: "Stock Limit Reached",
        description: `Only ${product.quantity} units of ${product.name} available.`,
        variant: "destructive",
      });
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Process sale with enhanced error handling and transaction security
  const processSale = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Validate stock levels one more time before processing using real-time data
      for (const item of cart) {
        const currentProduct = products.find((p) => p.id === item.id);

        if (!currentProduct) {
          throw new Error(
            `Product "${item.name}" no longer exists in the database.`
          );
        }

        if (currentProduct.quantity < item.quantity) {
          throw new Error(
            `Not enough stock for "${item.name}". Only ${currentProduct.quantity} available.`
          );
        }
      }

      // Create sale record with server timestamp
      const { subtotal, discount, discountedSubtotal, tax, total } =
        calculateTotals;

      const saleData = {
        businessId,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          total: item.price * item.quantity,
        })),
        subtotal,
        discount,
        discountType,
        discountValue,
        tax,
        total,
        timestamp: serverTimestamp(),
        cashierId: auth.currentUser.uid,
        cashierEmail: auth.currentUser.email,
        paymentMethod: "cash", // Default, could be expanded
      };

      const saleRef = await addDoc(collection(db, "sales"), saleData);

      // Update inventory
      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await getDoc(productRef);
        const currentQuantity = productDoc.data().quantity;
        await updateDoc(productRef, {
          quantity: currentQuantity - item.quantity,
          lastSold: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Generate receipt
      generateReceipt(saleRef.id, {
        ...saleData,
        timestamp: new Date().toISOString(),
      });

      // Create sale notification
      await createSaleNotification(saleData, businessId);

      // Check for low stock after updating inventory
      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await getDoc(productRef);
        const updatedProduct = {
          id: item.id,
          ...productDoc.data(),
        };

        if (shouldNotifyLowStock(updatedProduct)) {
          await createLowStockNotification(updatedProduct, businessId);
        }
      }

      // Clear cart and discounts
      setCart([]);
      setDiscountType("none");
      setDiscountValue(0);

      toast({
        title: "Sale Complete",
        description: `Sale processed successfully. Receipt #${saleRef.id}`,
      });
    } catch (error) {
      console.error("Sale processing error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to process sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate receipt with enhanced formatting
  const generateReceipt = async (saleId, saleData) => {
    const receiptWindow = window.open("", "_blank");

    const businessDoc = await getDoc(doc(db, "businesses", businessId));
    const businessName = businessDoc.data().name;

    receiptWindow.document.write(`
      <html>
        <head>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0;
              padding: 20px;
              max-width: 300px;
            }
            @page {
              margin: 0;
              size: auto;
              @top-left {
                content: "";
              }
              @top-right {
                content: "";
              }
            }

            .receipt { margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-details { flex-grow: 1; }
            .item-price { text-align: right; min-width: 60px; }
            .totals { margin-top: 10px; }
            .total-line { display: flex; justify-content: space-between; }
            .grand-total { font-weight: bold; font-size: 1.2em; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.9em; }
            .print-button { 
              display: block; 
              margin: 20px auto; 
              padding: 10px 20px; 
              background: #4CAF50; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>${businessName}</h2>
              <p>Receipt #${saleId.substring(0, 8)}</p>
              <p>Date: ${new Date(saleData.timestamp).toLocaleString()}</p>
              <p>Cashier: ${saleData.cashierEmail}</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="items">
              ${saleData.items
                .map(
                  (item) => `
                <div class="item">
                  <div class="item-details">
                    ${item.name} x ${item.quantity}
                  </div>
                  <div class="item-price">
                    $${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="divider"></div>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>$${saleData.subtotal.toFixed(2)}</span>
              </div>
              
              ${
                saleData.discount > 0
                  ? `
              <div class="total-line">
                <span>Discount (${
                  saleData.discountType === "percentage"
                    ? saleData.discountValue + "%"
                    : "Fixed"
                }):</span>
                <span>-$${saleData.discount.toFixed(2)}</span>
              </div>
              `
                  : ""
              }
              
              <div class="total-line">
                <span>Tax:</span>
                <span>$${saleData.tax.toFixed(2)}</span>
              </div>
              
              <div class="total-line grand-total">
                <span>Total:</span>
                <span>$${saleData.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Payment Method: ${saleData.paymentMethod}</p>
            </div>
          </div>
          
          <script>
              window.print();
          </script>
        </body>
      </html>
    `);
  };

  // Video stream setup with improved error handling
  useEffect(() => {
    let mounted = true;

    const setupVideo = async () => {
      if (showScanner && videoRef.current) {
        try {
          // Get user media to set up stream
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          if (!mounted) {
            // Component unmounted during async operation
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }

          setStream(mediaStream);
          videoRef.current.srcObject = mediaStream;

          // Wait for the video to be ready
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });

          if (mounted) {
            await videoRef.current.play();
            console.log("Video stream successfully initialized");
          }
        } catch (error) {
          console.error("Video setup error:", error);
          if (mounted) {
            toast({
              title: "Video Error",
              description: error.message || "Failed to initialize video stream",
              variant: "destructive",
            });
            cleanupScanner();
          }
        }
      }
    };

    if (showScanner) {
      setupVideo();
    }

    return () => {
      mounted = false;
      if (showScanner) {
        cleanupScanner();
      }
    };
  }, [showScanner]);

  // Enhanced cleanup scanner function
  const cleanupScanner = () => {
    try {
      setIsScannerReady(false);
      setIsInitializing(false);

      // Stop the continuous scanning
      codeReader.current.reset();

      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.error("Error stopping track:", e);
          }
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.onloadedmetadata = null;
      }

      setStream(null);
      setShowScanner(false);
    } catch (error) {
      console.error("Error in cleanup:", error);
    }
  };

  // Check camera permission before initializing
  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: "camera" });
      if (permission.state === "denied") {
        throw new Error(
          "Camera permission is denied. Please enable it in your browser settings."
        );
      }
      return true;
    } catch (error) {
      console.error("Permission check error:", error);
      toast({
        title: "Permission Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle scanner button click
  const handleScannerClick = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      await initializeScanner();
    }
  };

  // Show loading indicator while products are being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading product data...</p>
      </div>
    );
  }

  // Show error message if something went wrong
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
        <h3 className="text-lg font-semibold">Error loading products</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left side - Product Search and Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>Point of Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                onChange={handleSearchChange}
              />
              <Button onClick={handleScannerClick} disabled={isInitializing}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Scanner Dialog */}
            <Dialog
              open={showScanner}
              onOpenChange={(open) => {
                if (!open) cleanupScanner();
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Scan Barcode</DialogTitle>
                  <DialogDescription>
                    Position the barcode within the scanning area
                  </DialogDescription>
                </DialogHeader>
                <div className="relative">
                  <div className="aspect-video bg-muted rounded-md overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Show loading overlay while initializing */}
                    {isInitializing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                        <span>Initializing camera...</span>
                      </div>
                    )}
                  </div>
                  {isScannerReady && (
                    <div className="absolute inset-0 border-2 border-primary opacity-50 pointer-events-none">
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary"></div>
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary"></div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={cleanupScanner}
                    disabled={isInitializing}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Product List */}
            <div className="h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <CurrencyFormatter value={product.price || 0} />
                        </TableCell>
                        <TableCell>
                          {product.quantity <= 0 ? (
                            <span className="text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" /> Out of
                              stock
                            </span>
                          ) : product.quantity < 5 ? (
                            <span className="text-amber-500">
                              {product.quantity} left
                            </span>
                          ) : (
                            product.quantity
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(product)}
                            disabled={product.quantity <= 0}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {searchTerm
                          ? "No products match your search."
                          : "No products available."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right side - Cart */}
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cart.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value))
                          }
                          className="w-20"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <CurrencyFormatter value={item.price * item.quantity} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p>Your cart is empty</p>
              </div>
            )}

            {/* Discount Section */}
            {cart.length > 0 && (
              <div className="pt-4 border-t">
                <Label htmlFor="discount-type">Apply Discount</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger id="discount-type" className="w-[150px]">
                      <SelectValue placeholder="Discount Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">
                        Fixed Amount ({getCurrencySymbol()})
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {discountType !== "none" && (
                    <Input
                      type="number"
                      min="0"
                      max={
                        discountType === "percentage"
                          ? 100
                          : convertCurrency(calculateTotals.subtotal, "USD", currency).toFixed(2)
                      }
                      value={discountValue}
                      onChange={(e) =>
                        setDiscountValue(
                          Math.min(
                            parseFloat(e.target.value) || 0,
                            discountType === "percentage"
                              ? 100
                              : convertCurrency(calculateTotals.subtotal, "USD", currency).toFixed(2)
                          )
                        )
                      }
                      className="w-24"
                      placeholder={
                        discountType === "percentage"
                          ? "%"
                          : `${getCurrencySymbol()}`
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-4">
          <div className="text-right mt-4">
            <p>
              Subtotal: <CurrencyFormatter value={calculateTotals.subtotal} />
            </p>
            {calculateTotals.discount > 0 && (
              <p>
                Discount: -
                <CurrencyFormatter value={calculateTotals.discount} />
              </p>
            )}
            <p>
              Tax: <CurrencyFormatter value={calculateTotals.tax} />
            </p>
            <p className="text-lg font-bold">
              Total: <CurrencyFormatter value={calculateTotals.total} />
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Clear Cart
            </Button>
            <Button
              onClick={processSale}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? "Processing..." : "Process Sale"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
