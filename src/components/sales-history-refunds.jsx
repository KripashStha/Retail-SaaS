"use client";

import { useState, useEffect, useRef } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  Calendar,
  Receipt,
  ArrowUpDown,
  RotateCcw,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { format, subDays, parseISO } from "date-fns";
import { useInventory } from "@/contexts/inventory-context";
import { CurrencyFormatter } from "@/components/currency-formatter";
import { useCurrency } from "@/contexts/currency-context";

export function SalesHistoryRefunds() {
  // State variables
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundItems, setRefundItems] = useState([]);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const { toast } = useToast();
  const { products, businessId } = useInventory();
  const { currency, getCurrencySymbol } = useCurrency();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [isSearchingReceipt, setIsSearchingReceipt] = useState(false);

  // Load initial transactions
  useEffect(() => {
    fetchTransactions();
  }, [businessId, dateFilter]);

  // Filter transactions when search term changes
  useEffect(() => {
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredTransactions(
        transactions.filter(
          (transaction) =>
            transaction.id.toLowerCase().includes(lowercaseSearch) ||
            transaction.cashierEmail.toLowerCase().includes(lowercaseSearch) ||
            transaction.items.some((item) =>
              item.name.toLowerCase().includes(lowercaseSearch)
            )
        )
      );
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchTerm, transactions]);

  // Fetch transactions from Firestore
  const fetchTransactions = async (isLoadMore = false) => {
    try {
      setIsLoading(true);
      let salesQuery;

      // Create base query with business ID
      salesQuery = query(
        collection(db, "sales"),
        where("businessId", "==", businessId),
        orderBy("timestamp", "desc")
      );

      // Apply date filter if not showing all
      if (dateFilter !== "all") {
        let startDate;
        const now = new Date();
        if (dateFilter === "today") {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === "week") {
          startDate = subDays(new Date(now.setHours(0, 0, 0, 0)), 7);
        } else if (dateFilter === "month") {
          startDate = subDays(new Date(now.setHours(0, 0, 0, 0)), 30);
        }
        salesQuery = query(
          salesQuery,
          where("timestamp", ">=", Timestamp.fromDate(startDate))
        );
      }

      // Paginate results
      salesQuery = query(salesQuery, limit(10));

      // If loading more, start after last visible document
      if (isLoadMore && lastVisible) {
        salesQuery = query(salesQuery, startAfter(lastVisible));
      } else if (isLoadMore && !lastVisible) {
        setIsLoading(false);
        return;
      }

      const querySnapshot = await getDocs(salesQuery);
      const sales = [];

      querySnapshot.forEach((doc) => {
        const saleData = doc.data();
        sales.push({
          id: doc.id,
          ...saleData,
          timestamp:
            saleData.timestamp instanceof Timestamp
              ? saleData.timestamp.toDate()
              : new Date(saleData.timestamp) || new Date(),
        });
      });

      // Update last visible document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === 10);
      } else {
        setHasMore(false);
      }

      if (isLoadMore) {
        setTransactions((prevTransactions) => [...prevTransactions, ...sales]);
      } else {
        setTransactions(sales);
      }
    } catch (error) {
      console.error("Error fetching sales history:", error);
      toast({
        title: "Error",
        description: "Failed to load sales history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load more transactions when scrolling
  const loadMoreTransactions = () => {
    if (hasMore && !isLoading) {
      fetchTransactions(true);
    }
  };

  // Handle refund process
  const handleRefund = (transaction) => {
    // Get already refunded items if any
    const refundedItems = transaction.refundedItems || [];

    // Initialize refund items with all items from the transaction
    const items = transaction.items.map((item) => {
      // Calculate how many of this item have already been refunded
      const alreadyRefundedQuantity = refundedItems
        .filter((refunded) => refunded.id === item.id)
        .reduce((total, refunded) => total + refunded.quantity, 0);

      // Calculate remaining quantity available for refund
      const remainingQuantity = item.quantity - alreadyRefundedQuantity;

      return {
        ...item,
        selected: false,
        refundQuantity: remainingQuantity,
        maxQuantity: remainingQuantity,
        alreadyRefunded: alreadyRefundedQuantity > 0,
        alreadyRefundedQuantity,
        originalQuantity: item.quantity,
      };
    });

    setSelectedTransaction(transaction);
    setRefundItems(items);
    setRefundReason("");
    setShowRefundDialog(true);
  };

  // Handle selection of all items for refund
  const handleSelectAllItems = (checked) => {
    setRefundItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        selected: checked,
        refundQuantity: checked ? item.maxQuantity : 0,
      }))
    );
  };

  // Handle changing refund quantity for an item
  const handleRefundQuantityChange = (index, quantity) => {
    setRefundItems((prevItems) => {
      const newItems = [...prevItems];
      const parsedQuantity = parseInt(quantity);

      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        newItems[index].refundQuantity = 0;
      } else if (parsedQuantity > newItems[index].maxQuantity) {
        newItems[index].refundQuantity = newItems[index].maxQuantity;
      } else {
        newItems[index].refundQuantity = parsedQuantity;
      }

      newItems[index].selected = newItems[index].refundQuantity > 0;
      return newItems;
    });
  };

  // Handle item selection for refund
  const handleItemSelect = (index, checked) => {
    setRefundItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index].selected = checked;
      if (checked && newItems[index].refundQuantity === 0) {
        newItems[index].refundQuantity = newItems[index].maxQuantity;
      } else if (!checked) {
        newItems[index].refundQuantity = 0;
      }
      return newItems;
    });
  };

  // Calculate total refund amount
  const calculateRefundTotal = () => {
    return refundItems
      .filter((item) => item.selected)
      .reduce((total, item) => {
        return total + item.price * item.refundQuantity;
      }, 0);
  };

  // Process the refund
  const processRefund = async () => {
    try {
      setIsProcessingRefund(true);

      const selectedItems = refundItems.filter(
        (item) => item.selected && item.refundQuantity > 0
      );

      if (selectedItems.length === 0) {
        toast({
          title: "No Items Selected",
          description: "Please select at least one item to refund.",
          variant: "destructive",
        });
        setIsProcessingRefund(false);
        return;
      }

      // Create refund record
      const refundData = {
        originalSaleId: selectedTransaction.id,
        businessId,
        items: selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.refundQuantity,
          total: item.price * item.refundQuantity,
        })),
        subtotal: calculateRefundTotal(),
        total: calculateRefundTotal(), // No tax on refunds typically
        timestamp: serverTimestamp(),
        processedById: auth.currentUser.uid,
        processedByEmail: auth.currentUser.email,
        reason: refundReason || "No reason provided",
        type: "refund",
      };

      // Save refund to database
      const refundRef = await addDoc(collection(db, "refunds"), refundData);

      // Update inventory - add refunded items back
      for (const item of selectedItems) {
        try {
          // Get current product from database
          const productRef = doc(db, "products", item.id);
          const productDoc = await getDoc(productRef);

          if (productDoc.exists()) {
            const currentQuantity = productDoc.data().quantity;

            // Update product quantity
            await updateDoc(productRef, {
              quantity: currentQuantity + item.refundQuantity,
              updatedAt: serverTimestamp(),
            });
          } else {
            console.warn(`Product ${item.id} not found, may have been deleted`);
            // Could create a notification about this
          }
        } catch (error) {
          console.error(`Error updating inventory for ${item.name}:`, error);
          // Continue processing other items even if one fails
        }
      }

      // Append refund info to original sale with detailed refunded items
      const saleRef = doc(db, "sales", selectedTransaction.id);

      // Get existing refunded items if any
      const saleDoc = await getDoc(saleRef);
      const saleData = saleDoc.data();

      // Create or update the refundedItems array to track which items have been refunded
      const existingRefundedItems = saleData.refundedItems || []; // Build new refundedItems entry that tracks which items were refunded in this transaction
      const newRefundedItems = selectedItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.refundQuantity,
        refundId: refundRef.id,
        reason: refundReason || "No reason provided",
        timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
      }));

      // Update the sale document with:
      // 1. Array of refund IDs (for backward compatibility)
      // 2. Detailed refundedItems array with item-specific refund data
      await updateDoc(saleRef, {
        refunds: saleData.refunds
          ? [...saleData.refunds, refundRef.id]
          : [refundRef.id],
        refundedItems: [...existingRefundedItems, ...newRefundedItems],
        updatedAt: serverTimestamp(),
      });

      // Success message and refresh data
      toast({
        title: "Refund Processed",
        description: `Refunded: ${selectedItems
          .map((item) => `${item.name} (${item.refundQuantity})`)
          .join(", ")}`,
      });

      // Close dialog and refresh transactions
      setShowRefundDialog(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Refund Failed",
        description:
          error.message || "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Handle receipt number search
  const searchByReceiptNumber = async () => {
    if (!receiptNumber.trim()) {
      toast({
        title: "Receipt Number Required",
        description: "Please enter a receipt number to search.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearchingReceipt(true);

      // First try direct ID match
      try {
        const saleDoc = await getDoc(doc(db, "sales", receiptNumber));
        if (saleDoc.exists() && saleDoc.data().businessId === businessId) {
          const saleData = saleDoc.data();
          const transaction = {
            id: saleDoc.id,
            ...saleData,
            timestamp:
              saleData.timestamp instanceof Timestamp
                ? saleData.timestamp.toDate()
                : new Date(saleData.timestamp) || new Date(),
          };

          // Found the transaction
          setSelectedTransaction(transaction);
          setShowReceiptDialog(false);
          handleRefund(transaction);
          setIsSearchingReceipt(false);
          return;
        }
      } catch (error) {
        console.log("Direct ID match failed, trying partial match", error);
      }

      // If not found by direct ID, try partial match
      const salesQuery = query(
        collection(db, "sales"),
        where("businessId", "==", businessId),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(salesQuery);
      const matchingSales = [];

      querySnapshot.forEach((doc) => {
        // Only add documents that include the receipt number in their ID
        if (doc.id.toLowerCase().includes(receiptNumber.toLowerCase())) {
          const saleData = doc.data();
          matchingSales.push({
            id: doc.id,
            ...saleData,
            timestamp:
              saleData.timestamp instanceof Timestamp
                ? saleData.timestamp.toDate()
                : new Date(saleData.timestamp) || new Date(),
          });
        }
      });

      if (matchingSales.length === 1) {
        // One exact match, use it directly
        setSelectedTransaction(matchingSales[0]);
        setShowReceiptDialog(false);
        handleRefund(matchingSales[0]);
      } else if (matchingSales.length > 1) {
        // Multiple matches, update the filtered list to show all matches
        setTransactions(matchingSales);
        setFilteredTransactions(matchingSales);
        setShowReceiptDialog(false);
        toast({
          title: "Multiple Matches Found",
          description: `Found ${matchingSales.length} receipts matching "${receiptNumber}". Please select the correct one.`,
        });
      } else {
        // No matches found
        toast({
          title: "Receipt Not Found",
          description: `No receipt found with number "${receiptNumber}". Please check and try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching receipt:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search for receipt. Please try again.",
      });
    } finally {
      setIsSearchingReceipt(false);
    }
  };

  // View receipt details
  const viewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptDialog(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="md:w-auto grid-cols-2">
          <TabsTrigger value="history">Sales History</TabsTrigger>
          <TabsTrigger value="refund">Process Refund</TabsTrigger>
        </TabsList>

        {/* Sales History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by receipt number, cashier, or items..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-row space-x-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => fetchTransactions()}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Transactions Table */}
              <ScrollArea className="h-[600px]">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Receipt #</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Cashier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Loading transactions...
                          </TableCell>
                        </TableRow>
                      ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                              {format(
                                transaction.timestamp,
                                "MMM d, yyyy h:mm a"
                              )}
                            </TableCell>
                            <TableCell>
                              {transaction.items.length} item
                              {transaction.items.length !== 1 ? "s" : ""}
                            </TableCell>
                            <TableCell>
                              <CurrencyFormatter value={transaction.total} />
                            </TableCell>
                            <TableCell>{transaction.cashierEmail}</TableCell>
                            <TableCell>
                              {transaction.refundedItems ? (
                                (() => {
                                  // Check if all items are fully refunded
                                  const isFullyRefunded =
                                    transaction.items.every((item) => {
                                      const refundedQuantity = (
                                        transaction.refundedItems || []
                                      )
                                        .filter(
                                          (refund) => refund.id === item.id
                                        )
                                        .reduce(
                                          (total, refund) =>
                                            total + refund.quantity,
                                          0
                                        );

                                      return refundedQuantity >= item.quantity;
                                    });

                                  if (isFullyRefunded) {
                                    return (
                                      <Badge
                                        variant="outline"
                                        className="bg-red-50 text-red-700 border-red-200"
                                      >
                                        <span>Fully Refunded</span>
                                      </Badge>
                                    );
                                  } else if (
                                    transaction.refundedItems.length > 0
                                  ) {
                                    return (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-200"
                                      >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        <span>Partially Refunded</span>
                                      </Badge>
                                    );
                                  }
                                })()
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  <span>Completed</span>
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewReceipt(transaction)}
                              >
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefund(transaction)}
                                // Disable the refund button if the transaction is fully refunded
                                disabled={
                                  transaction.refundedItems
                                    ? transaction.items.every((item) => {
                                        const refundedQuantity = (
                                          transaction.refundedItems || []
                                        )
                                          .filter(
                                            (refund) => refund.id === item.id
                                          )
                                          .reduce(
                                            (total, refund) =>
                                              total + refund.quantity,
                                            0
                                          );
                                        return (
                                          refundedQuantity >= item.quantity
                                        );
                                      })
                                    : false
                                }
                              >
                                <RotateCcw className="h-4 w-4" />
                                <span className="sr-only">Refund</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            {searchTerm
                              ? "No transactions match your search."
                              : "No transactions found for the selected period."}
                          </TableCell>
                        </TableRow>
                      )}

                      {hasMore &&
                        !isLoading &&
                        filteredTransactions.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-2">
                              <Button
                                variant="outline"
                                onClick={loadMoreTransactions}
                              >
                                Load More Transactions
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Refund Tab */}
        <TabsContent value="refund" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Receipt for Refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="receipt-number">Receipt Number</Label>
                  <Input
                    id="receipt-number"
                    placeholder="Enter receipt number from customer receipt"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                  />
                </div>
                <Button
                  onClick={searchByReceiptNumber}
                  disabled={isSearchingReceipt || !receiptNumber.trim()}
                >
                  {isSearchingReceipt ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Find Receipt"
                  )}
                </Button>
              </div>

              <div className="rounded-md p-4 text-muted-foreground flex items-start">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-1.5" />
                <div className="text-sm">
                  <p className="font-medium ">Instructions:</p>
                  <p>1. Enter the receipt number from the customer's receipt</p>
                  <p>
                    2. Select the items being returned and specify quantities
                  </p>
                  <p>
                    3. Process the refund to update inventory and create a
                    refund record
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Receipt #{selectedTransaction?.id.substring(0, 8)} •{" "}
              {selectedTransaction?.timestamp.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                onCheckedChange={handleSelectAllItems}
                checked={refundItems.every(
                  (item) =>
                    item.selected && item.refundQuantity === item.maxQuantity
                )}
              />
              <Label htmlFor="select-all">Select All Items</Label>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {refundItems.map((item, index) => (
                <div key={item.id} className="py-2 border-b last:border-b-0">
                  <div className="flex items-start">
                    <div className="pt-1 pr-2">
                      <Checkbox
                        id={`item-${index}`}
                        checked={item.selected}
                        onCheckedChange={(checked) =>
                          handleItemSelect(index, checked)
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`item-${index}`} className="font-medium">
                        {item.name}
                      </Label>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          <CurrencyFormatter value={item.price} /> each ×{" "}
                          {item.maxQuantity} purchased
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label
                            htmlFor={`quantity-${index}`}
                            className="whitespace-nowrap"
                          >
                            Refund Qty:
                          </Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="0"
                            max={item.maxQuantity}
                            value={item.refundQuantity}
                            onChange={(e) =>
                              handleRefundQuantityChange(index, e.target.value)
                            }
                            className="w-20"
                            disabled={!item.selected}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>

            <div>
              <Label htmlFor="refund-reason">Reason for Refund</Label>
              <textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full min-h-[80px] p-2 rounded-md border border-gray-300 mt-1"
                placeholder="Enter reason for the refund..."
              />
            </div>

            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Refund Amount:</span>
                <span>
                  <CurrencyFormatter value={calculateRefundTotal()} />
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {refundItems.filter((item) => item.selected).length} item
                {refundItems.filter((item) => item.selected).length !== 1
                  ? "s"
                  : ""}{" "}
                selected for refund
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={isProcessingRefund}
            >
              Cancel
            </Button>
            <Button
              onClick={processRefund}
              disabled={
                isProcessingRefund ||
                refundItems.filter(
                  (item) => item.selected && item.refundQuantity > 0
                ).length === 0
              }
            >
              {isProcessingRefund ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              Transaction #{selectedTransaction?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(selectedTransaction.timestamp, "PPP p")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier:</span>
                  <span>{selectedTransaction.cashierEmail}</span>
                </div>
                <Separator />
              </div>{" "}
              <div className="space-y-2">
                <h4 className="font-medium">Items</h4>
                <div className="h-[200px] overflow-y-auto border rounded-md p-2">
                  {selectedTransaction.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-1 border-b last:border-b-0"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>
                        <CurrencyFormatter value={item.total} />
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    <CurrencyFormatter value={selectedTransaction.subtotal} />
                  </span>
                </div>
                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>
                      -
                      <CurrencyFormatter value={selectedTransaction.discount} />
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>
                    <CurrencyFormatter value={selectedTransaction.tax} />
                  </span>
                </div>{" "}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>
                    <CurrencyFormatter value={selectedTransaction.total} />
                  </span>
                </div>
              </div>
              {selectedTransaction.refundedItems &&
              selectedTransaction.refundedItems.length > 0 ? (
                <div className="bg-amber-50 rounded-md border border-amber-200 text-amber-800">
                  <div className="flex items-start gap-3 p-4 pb-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-base">
                          Refund History
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-amber-100 border-amber-300 text-amber-800"
                        >
                          {selectedTransaction.refundedItems.length}{" "}
                          {selectedTransaction.refundedItems.length === 1
                            ? "item"
                            : "items"}{" "}
                          refunded
                        </Badge>
                      </div>
                    </div>
                  </div>{" "}
                  <ScrollArea className="h-[250px] w-full rounded-md">
                    <div className="px-4 pb-4 pl-8 pr-2">
                      {/* Group refunds by refundId to show reasons per refund transaction */}
                      {(() => {
                        // Group items by refund transaction
                        const refundGroups =
                          selectedTransaction.refundedItems.reduce(
                            (acc, item) => {
                              if (!acc[item.refundId]) {
                                acc[item.refundId] = {
                                  items: [],
                                  reason: item.reason || "No reason provided",
                                  timestamp: item.timestamp,
                                  refundId: item.refundId,
                                };
                              }
                              acc[item.refundId].items.push(item);
                              return acc;
                            },
                            {}
                          );

                        // Convert to array and sort by timestamp (most recent first)
                        return Object.values(refundGroups)
                          .sort((a, b) => {
                            const dateA = a.timestamp
                              ? new Date(a.timestamp)
                              : new Date(0);
                            const dateB = b.timestamp
                              ? new Date(b.timestamp)
                              : new Date(0);
                            return dateB - dateA; // Most recent first
                          })
                          .map((refund, groupIndex) => (
                            <div
                              key={refund.refundId}
                              className="mb-4 pb-3 border-b border-amber-200 last:border-b-0 last:mb-0 last:pb-0"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                                  Refund #{groupIndex + 1} •{" "}
                                  {refund.timestamp
                                    ? new Date(
                                        refund.timestamp
                                      ).toLocaleString()
                                    : "Date unknown"}
                                </div>
                              </div>
                              <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                                <div className="text-sm font-medium mb-1.5">
                                  Items Returned:
                                </div>
                                {refund.items.map((item, i) => (
                                  <div
                                    key={i}
                                    className="text-sm py-0.5 flex justify-between items-center"
                                  >
                                    <span>• {item.name}</span>
                                    <span className="font-medium">
                                      {item.quantity}{" "}
                                      {item.quantity > 1 ? "units" : "unit"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-amber-100 p-2 rounded">
                                <div className="text-sm font-medium mb-1">
                                  Reason for Refund:
                                </div>
                                <div className="text-sm">{refund.reason}</div>
                              </div>{" "}
                            </div>
                          ));
                      })()}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}
              <div className="flex justify-between items-center">
                <div>
                  {selectedTransaction.refundedItems &&
                  selectedTransaction.items.some((item) => {
                    // Check if any items are still available for refund
                    const refundedQuantity = (
                      selectedTransaction.refundedItems || []
                    )
                      .filter((refund) => refund.id === item.id)
                      .reduce((total, refund) => total + refund.quantity, 0);
                    return refundedQuantity < item.quantity;
                  }) ? (
                    <span className="text-sm text-muted-foreground">
                      Some items are still eligible for refund
                    </span>
                  ) : selectedTransaction.refundedItems ? (
                    <span className="text-sm text-red-500 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      All items have been fully refunded
                    </span>
                  ) : null}
                </div>
                <Button
                  onClick={() => {
                    setShowReceiptDialog(false);
                    handleRefund(selectedTransaction);
                  }}
                  disabled={
                    selectedTransaction.refundedItems
                      ? selectedTransaction.items.every((item) => {
                          const refundedQuantity = (
                            selectedTransaction.refundedItems || []
                          )
                            .filter((refund) => refund.id === item.id)
                            .reduce(
                              (total, refund) => total + refund.quantity,
                              0
                            );
                          return refundedQuantity >= item.quantity;
                        })
                      : false
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
