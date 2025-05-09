"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Loader2, Search, Tag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import the inventory context
import { useInventory } from "@/contexts/inventory-context";
import { CurrencyFormatter } from "@/components/currency-formatter";
import { useCurrency } from "@/contexts/currency-context";

export default function InventoryLookUp() {
  // Use the inventory context for real-time data
  const {
    products,
    loading: inventoryLoading,
    error: inventoryError,
    businessId,
  } = useInventory();

  // Add currency context
  const { currency } = useCurrency();

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const itemsPerPage = 11;

  // Fetch categories when businessId changes
  useEffect(() => {
    if (businessId) {
      fetchCategories();
      setLoading(false);
    }
  }, [businessId]);

  // Updated fetchCategories to use businessId from context
  const fetchCategories = async () => {
    try {
      if (!businessId) {
        throw new Error("Business ID not available");
      }

      const response = await fetch(`/api/categories?businessId=${businessId}`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.map((category) => category.name));
    } catch (err) {
      console.error("Error loading categories:", err.message);
      setError(err.message);
    }
  };

  // Updated filtering logic to include category filter
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Reset to first page when changing filters
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading && inventoryLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Lookup</CardTitle>
      </CardHeader>
      <CardContent>
        {(error || inventoryError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || inventoryError}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Category Filter */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filter chip/badge when category is selected */}
        {selectedCategory !== "All" && (
          <div className="mb-4 flex items-center">
            <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
              <Tag className="mr-1 h-3 w-3" />
              {selectedCategory}
              <button
                className="ml-2 hover:text-blue-700"
                onClick={() => setSelectedCategory("All")}
              >
                ×
              </button>
            </div>
            <span className="ml-2 text-sm text-gray-500">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"} found
            </span>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium py-4">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <div className="flex items-center">
                          <Tag className="mr-2 h-4 w-4 text-blue-500" />
                          {product.category}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.barcode || (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`font-medium
                        ${
                          product.quantity < product.threshold
                            ? "text-destructive"
                            : "text-success"
                        }`}
                    >
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      <CurrencyFormatter value={product.price} />
                    </TableCell>
                    <TableCell>
                      {product.quantity <= 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">
                          Out of Stock
                        </span>
                      ) : product.quantity < product.threshold ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm || selectedCategory !== "All"
                      ? "No products match your filters."
                      : "No products found in inventory."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredProducts.length > itemsPerPage && (
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({
              length: Math.ceil(filteredProducts.length / itemsPerPage),
            }).map((_, index) => (
              <button
                key={index}
                className={`px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

