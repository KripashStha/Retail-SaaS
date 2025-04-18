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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  Tag,
  Filter
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

export function InventoryTracking() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    id: null,
    type: null
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
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All"); // New state for category filter

  const itemsPerPage = 5;

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      setError(null);
    } catch (err) {
      setError(`Error loading products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (productData) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...productData,
        price: parseFloat(productData.price),
        quantity: parseInt(productData.quantity),
        threshold: parseInt(productData.threshold)
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }
    return response.json();
  };
  
  const updateProduct = async (id, updateData) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...updateData,
        price: parseFloat(updateData.price),
        quantity: parseInt(updateData.quantity),
        threshold: parseInt(updateData.threshold)
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }
    return response.json();
  };
  
  const deleteProduct = async (id) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    }
    return response.json();
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
      setIsCategoryDialogOpen(false);
    }
  };

  // Reset new product form when dialog opens
  // const handleOpenAddDialog = () => {
  //   setNewProduct({
  //     name: "",
  //     quantity: 0,
  //     price: 0,
  //     threshold: 0,
  //     category: "",
  //     barcode: "",
  //   });
  //   setIsDialogOpen(true);
  // };

  // Updated filtering logic to include category filter
  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  );

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
        category: value
      });
    } else {
      setNewProduct({
        ...newProduct,
        category: value
      });
    }
  };

  const handleAddProduct = async () => {
    setActionLoading({ id: 'new', type: 'add' });
    try {
      await createProduct(newProduct);
      await fetchProducts();
      setNewProduct({ name: "", quantity: 0, price: 0, threshold: 0, category: "", barcode: "" });
      setIsDialogOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleUpdateProduct = async () => {
    if (editingProduct) {
      setActionLoading({ id: editingProduct.id, type: 'update' });
      try {
        await updateProduct(editingProduct.id, editingProduct);
        await fetchProducts();
        setEditingProduct(null);
        setIsEditDialogOpen(false);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setActionLoading({ id: null, type: null });
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setActionLoading({ id, type: 'delete' });
    try {
      await deleteProduct(id);
      await fetchProducts();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleBulkEntry = async () => {
    try {
      setActionLoading({ id: 'bulk', type: 'add' });
      const newProducts = bulkEntryData.split("\n").map((line) => {
        const [name, quantity, price, threshold, category, barcode] = line.split(",");
        return {
          name: name.trim(),
          quantity: parseInt(quantity.trim()),
          price: parseFloat(price.trim()),
          threshold: parseInt(threshold.trim()),
          category: category?.trim() || "",
          barcode: barcode?.trim() || "",
        };
      });

      const validProducts = newProducts.filter(
        (p) =>
          p.name &&
          !isNaN(p.quantity) &&
          !isNaN(p.price) &&
          !isNaN(p.threshold)
      );

      if (validProducts.length === 0) {
        throw new Error("No valid products found. Please check your input format.");
      }

      // Process each product sequentially
      for (const product of validProducts) {
        await createProduct(product);
      }
      
      await fetchProducts();
      setBulkEntryData("");
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Add Category Button - Moved here */}
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
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
                    <Button onClick={addCategory}>
                      Add Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex space-x-2 w-full md:w-auto justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 text-white" onClick={handleOpenAddDialog}>
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
                      disabled={actionLoading.id === 'new'}
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
                      disabled={actionLoading.id === 'new'}
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
                        disabled={actionLoading.id === 'new'}
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
                      disabled={actionLoading.id === 'new'}
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
                      disabled={actionLoading.id === 'new'}
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
                      disabled={actionLoading.id === 'new'}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddProduct} disabled={actionLoading.id === 'new'}>
                    {actionLoading.id === 'new' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk Import Products</DialogTitle>
                  <DialogDescription>
                    Enter one product per line in the format: Name, Quantity, Price, Threshold, Category, Barcode
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Product A, 100, 19.99, 20, Electronics, BAR123              
                     Product B, 75, 29.99, 15, Groceries, BAR456"
                    value={bulkEntryData}
                    onChange={(e) => setBulkEntryData(e.target.value)}
                    rows={5}
                    disabled={actionLoading.id === 'bulk'}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkEntry} disabled={actionLoading.id === 'bulk'}>
                    {actionLoading.id === 'bulk' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Import Products
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Filter chip/badge when category is selected  */}
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
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found
            </span>
          </div>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
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
                    <TableCell>{product.barcode || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                    <TableCell>{product.threshold}</TableCell>
                    <TableCell>
                      {product.quantity <= product.threshold && (
                        <div className="flex items-center text-yellow-500">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Low Stock
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="mr-2"
                            onClick={() => setEditingProduct({...product})}
                            disabled={actionLoading.id === product.id}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                              Update the product details below.
                            </DialogDescription>
                          </DialogHeader>
                          {editingProduct && (
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
                                <div className="col-span-3">
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
                            <Button 
                              onClick={handleUpdateProduct}
                              disabled={actionLoading.id === product.id}
                            >
                              {actionLoading.id === product.id && actionLoading.type === 'update' && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Product
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={actionLoading.id === product.id}
                      >
                        {actionLoading.id === product.id && actionLoading.type === 'delete' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    {searchTerm || selectedCategory !== "All" 
                      ? 'No products match your filters.' 
                      : 'No products found. Add some to get started!'}
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