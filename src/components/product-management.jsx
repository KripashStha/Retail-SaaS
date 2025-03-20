"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  Filter,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// Import Firebase auth and db
import { auth, db } from "@/firebase/dbConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  shouldNotifyLowStock,
  createLowStockNotification,
  createNewProductNotification,
  createInventoryUpdateNotification,
} from "@/utils/notification-utils";
import { CsvUpload } from "@/components/csv-upload";

export function InventoryTracking() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    id: null,
    type: null,
  });
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    quantity: 0,
    price: 0,
    threshold: 0,
    category: "",
    barcode: "",
  });
  const [bulkEntryData, setBulkEntryData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  // Add state for current business
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const { toast } = useToast();

  const itemsPerPage = 11;

  // Fetch business ID
  const fetchBusinessId = async () => {
    try {
      // Get current user's business ID
      const userDoc = await getDocs(
        query(
          collection(db, "Users"),
          where("email", "==", auth.currentUser.email)
        )
      );
      if (userDoc.empty) {
        console.error("No user document found");
        setError("User not found. Please check authentication.");
        return null;
      }

      const businessId = userDoc.docs[0].data().businessId;
      setCurrentBusiness(businessId);
      return businessId;
    } catch (err) {
      console.error("Error fetching business ID:", err.message);
      setError(`Error loading business data: ${err.message}`);
      return null;
    }
  };

  // Updated fetch products to include businessId
  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Ensure we have a business ID
      const businessId = currentBusiness || (await fetchBusinessId());
      if (!businessId) {
        throw new Error("Business ID not available");
      }

      const response = await fetch(`/api/products?businessId=${businessId}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);

      setError(null);
    } catch (err) {
      setError(`Error loading products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (auth.currentUser) {
        await fetchBusinessId();
        await fetchCategories();
        await fetchProducts();
      } else {
        setError("User not authenticated");
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const createProduct = async (productData) => {
    if (!currentBusiness) {
      throw new Error("Business ID not available");
    }

    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...productData,
        businessId: currentBusiness,
        price: parseFloat(productData.price),
        quantity: parseInt(productData.quantity),
        threshold: parseInt(productData.threshold),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create product");
    }

    // Re-fetch categories to include the new category
    await fetchCategories(); // Call this to refresh categories

    toast({
      title: "Success",
      description: "Product added successfully",
      variant: "success",
    });

    return result;
  };

  const updateProduct = async (id, updateData) => {
    if (!currentBusiness) {
      throw new Error("Business ID not available");
    }

    const response = await fetch(`/api/products`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        businessId: currentBusiness,
        ...updateData,
        price: parseFloat(updateData.price),
        quantity: parseInt(updateData.quantity),
        threshold: parseInt(updateData.threshold),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update product");
    }

    toast({
      title: "Success",
      description: "Product updated successfully",
      variant: "success",
    });

    // After successful update, check if we need to create a notification
    const updatedProduct = { id, ...updateData };
    if (shouldNotifyLowStock(updatedProduct)) {
      await createLowStockNotification(updatedProduct, currentBusiness);
    }

    return result;
  };

  const deleteProduct = async (id) => {
    if (!currentBusiness) {
      throw new Error("Business ID not available");
    }

    const response = await fetch(`/api/products`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, businessId: currentBusiness }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete product");
    }

    toast({
      title: "Success",
      description: "Product deleted successfully",
      variant: "success",
    });

    return result;
  };

  // Updated fetchCategories to include businessId
  const fetchCategories = async () => {
    try {
      // Ensure we have a business ID
      const businessId = currentBusiness || (await fetchBusinessId());
      if (!businessId) {
        throw new Error("Business ID not available");
      }

      const response = await fetch(`/api/categories?businessId=${businessId}`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.map((category) => category.name));
    } catch (err) {
      console.error("Error loading categories:", err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Updated addCategory to include businessId
  const addCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      try {
        if (!currentBusiness) {
          throw new Error("Business ID not available");
        }

        setActionLoading({ id: "category", type: "add" });

        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newCategory.trim(),
            businessId: currentBusiness,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to add category");
        }

        await fetchCategories(); // Refresh categories from the server
        setNewCategory("");
        setIsCategoryDialogOpen(false);

        toast({
          title: "Success",
          description: "Category added successfully",
          variant: "success",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setActionLoading({ id: null, type: null });
      }
    } else {
      toast({
        title: "Error",
        description: "Category name already exists",
        variant: "destructive",
      });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        [name]:
          name === "price" || name === "quantity" || name === "threshold"
            ? parseFloat(value)
            : value,
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]:
          name === "price" || name === "quantity" || name === "threshold"
            ? parseFloat(value)
            : value,
      });
    }
  };

  const handleSelectChange = (value) => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        category: value,
      });
    } else {
      setNewProduct({
        ...newProduct,
        category: value,
      });
    }
  };

  const handleAddProduct = async () => {
    setActionLoading({ id: "new", type: "add" });
    try {
      const createdProduct = await createProduct(newProduct);
      await fetchProducts();
      await createNewProductNotification(
        createdProduct,
        currentBusiness 
      );
      setNewProduct({
        name: "",
        quantity: 0,
        price: 0,
        threshold: 0,
        category: "",
        barcode: "",
      });
      setIsDialogOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleUpdateProduct = async () => {
    if (editingProduct) {
      setActionLoading({ id: editingProduct.id, type: "update" });
      try {
        const updatedProduct = await updateProduct(editingProduct.id, editingProduct);
        await fetchProducts();
        await createInventoryUpdateNotification(
          updatedProduct,
          currentBusiness
        );
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        setError(null);
      } catch (err) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setActionLoading({ id: null, type: null });
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    setActionLoading({ id, type: "delete" });
    try {
      await deleteProduct(id);
      await fetchProducts();
      setError(null);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleBulkEntry = async () => {
    try {
      if (!currentBusiness) {
        throw new Error("Business ID not available");
      }

      setActionLoading({ id: "bulk", type: "add" });
      const newProducts = bulkEntryData.split("\n").map((line) => {
        const [name, quantity, price, threshold, category, barcode] =
          line.split(",");
        return {
          name: name.trim(),
          quantity: parseInt(quantity.trim()),
          price: parseFloat(price.trim()),
          threshold: parseInt(threshold.trim()),
          category: category?.trim() || "",
          barcode: barcode?.trim() || "",
          businessId: currentBusiness,
        };
      });

      const validProducts = newProducts.filter(
        (p) =>
          p.name && !isNaN(p.quantity) && !isNaN(p.price) && !isNaN(p.threshold)
      );

      if (validProducts.length === 0) {
        throw new Error(
          "No valid products found. Please check your input format."
        );
      }

      // Process each product sequentially
      for (const product of validProducts) {
        await createProduct(product);
      }

      await fetchProducts();
      setBulkEntryData("");
      setError(null);
      setIsBulkImportDialogOpen(false);

      toast({
        title: "Success",
        description: `${validProducts.length} products imported successfully`,
        variant: "success",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  // const handleFileChange = (event) => {
  //   if (event.target.files) {
  //     setFile(event.target.files[0]);
  //   }
  // };

  // const handleUpload = () => {
  //   if (file) {
  //     console.log(`Uploading file: ${file.name}`);
  //     toast({
  //       title: "CSV Upload",
  //       description: `File ${file.name} has been uploaded successfully.`,
  //     });
  //   }
  // };

  if (loading && !products.length) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
            </div>

            {/* Category Filter with Add Category Button */}
            <div className="flex-shrink-0 w-full sm:w-auto flex gap-2">
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

              {/* Add Category Button*/}
              <Dialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="Category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={addCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex space-x-2 w-full md:w-auto justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new product.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newProduct.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      disabled={actionLoading.id === "new"}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barcode" className="text-right">
                      Barcode
                    </Label>
                    <Input
                      id="barcode"
                      name="barcode"
                      value={newProduct.barcode}
                      onChange={handleInputChange}
                      className="col-span-3"
                      disabled={actionLoading.id === "new"}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newProduct.category}
                        onValueChange={handleSelectChange}
                        disabled={actionLoading.id === "new"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={newProduct.quantity}
                      onChange={handleInputChange}
                      className="col-span-3"
                      disabled={actionLoading.id === "new"}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      className="col-span-3"
                      disabled={actionLoading.id === "new"}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="threshold" className="text-right">
                      Threshold
                    </Label>
                    <Input
                      id="threshold"
                      name="threshold"
                      type="number"
                      value={newProduct.threshold}
                      onChange={handleInputChange}
                      className="col-span-3"
                      disabled={actionLoading.id === "new"}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddProduct}
                    disabled={actionLoading.id === "new"}
                  >
                    {actionLoading.id === "new" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isBulkImportDialogOpen}
              onOpenChange={setIsBulkImportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">Bulk Import</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk Import Products</DialogTitle>
                  <DialogDescription>
                    Enter one product per line in the format: Name, Quantity,
                    Price, Threshold, Category, Barcode
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Textarea
                    placeholder="Product A, 100, 19.99, 20, Electronics, BAR123              
                    Product B, 75, 29.99, 15, Groceries, BAR456"
                    value={bulkEntryData}
                    onChange={(e) => setBulkEntryData(e.target.value)}
                    rows={5}
                    disabled={actionLoading.id === "bulk"}
                  />
                </div>

                <Button
                  onClick={handleBulkEntry}
                  disabled={actionLoading.id === "bulk"}
                  className=" ml-auto"
                >
                  {actionLoading.id === "bulk" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Import Products
                </Button>

                <CsvUpload />

                {/* <DialogHeader className="mt-4">
                        <DialogTitle>CSV Upload</DialogTitle>
                        <DialogDescription>
                          Upload your inventory data using a CSV file
                        </DialogDescription>
                      </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="csv">CSV File</Label>
                            <Input
                              id="csv"
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                            />
                          </div>
                          <Button onClick={handleUpload} disabled={!file}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload CSV
                          </Button>
                        </div>   */}
              </DialogContent>
            </Dialog>
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
                <TableHead>Threshold</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
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
                      ${parseFloat(product.price).toFixed(2)}
                    </TableCell>
                    <TableCell>{product.threshold}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent align="end" className="w-36 p-2">
                      
                          <Dialog
                            open={
                              isEditDialogOpen &&
                              editingProduct?.id === product.id
                            }
                            onOpenChange={(open) => {
                              if (open) {
                                setEditingProduct(product);
                              }
                              setIsEditDialogOpen(open);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full flex items-center justify-start"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </DialogTrigger>

                            {/* Edit Dialog */}
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>
                                  Update the product details below.
                                </DialogDescription>
                              </DialogHeader>

                              {editingProduct && editingProduct.id === product.id && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">
                                  Name
                                </Label>
                                <Input
                                  id="edit-name"
                                  name="name"
                                  value={editingProduct.name}
                                  onChange={handleInputChange}
                                  className="col-span-3"
                                  disabled={actionLoading.id === product.id}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-barcode" className="text-right">
                                  Barcode
                                </Label>
                                <Input
                                  id="edit-barcode"
                                  name="barcode"
                                  value={editingProduct.barcode || ''}
                                  onChange={handleInputChange}
                                  className="col-span-3"
                                  disabled={actionLoading.id === product.id}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-category" className="text-right">
                                  Category
                                </Label>
                                <div className="col-span-3 flex space-x-2">
                                  <Select 
                                    value={editingProduct.category || ''} 
                                    onValueChange={handleSelectChange}
                                    disabled={actionLoading.id === product.id}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-quantity"
                                  className="text-right"
                                >
                                  Quantity
                                </Label>
                                <Input
                                  id="edit-quantity"
                                  name="quantity"
                                  type="number"
                                  value={editingProduct.quantity}
                                  onChange={handleInputChange}
                                  className="col-span-3"
                                  disabled={actionLoading.id === product.id}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-price"
                                  className="text-right"
                                >
                                  Price
                                </Label>
                                <Input
                                  id="edit-price"
                                  name="price"
                                  type="number"
                                  step="0.01"
                                  value={editingProduct.price}
                                  onChange={handleInputChange}
                                  className="col-span-3"
                                  disabled={actionLoading.id === product.id}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-threshold"
                                  className="text-right"
                                >
                                  Threshold
                                </Label>
                                <Input
                                  id="edit-threshold"
                                  name="threshold"
                                  type="number"
                                  value={editingProduct.threshold}
                                  onChange={handleInputChange}
                                  className="col-span-3"
                                  disabled={actionLoading.id === product.id}
                                />
                              </div>
                            </div>
                          )}

                              <DialogFooter>
                                <Button onClick={handleUpdateProduct}>
                                  Update Product
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full flex items-center justify-start text-red-500"
                          >
                              <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                          </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Delete</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to remove this
                                    product? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    disabled={actionLoading.id === product.id}
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    {searchTerm || selectedCategory !== "All"
                      ? "No products match your filters."
                      : "No products found. Add some to get started!"}
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
              <Button
                key={index}
                variant={currentPage === index + 1 ? "default" : "outline"}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InventoryTracking;
