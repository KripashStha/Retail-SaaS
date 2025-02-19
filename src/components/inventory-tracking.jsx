"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
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
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

const initialProducts = [
  {
    id: 1,
    name: "Product A",
    
    quantity: 100,
    price: 19.99,
    threshold: 20,
  },
  {
    id: 2,
    name: "Product B",
    
    quantity: 75,
    price: 29.99,
    threshold: 15,
  },
  {
    id: 3,
    name: "Product C",
    
    quantity: 50,
    price: 39.99,
    threshold: 10,
  },
  {
    id: 4,
    name: "Product D",
    
    quantity: 120,
    price: 24.99,
    threshold: 25,
  },
  {
    id: 5,
    name: "Product E",
    
    quantity: 60,
    price: 34.99,
    threshold: 12,
  },
];

export function InventoryTracking() {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    
    quantity: 0,
    price: 0,
    threshold: 0,
  });
  const [bulkEntryData, setBulkEntryData] = useState("");

  const itemsPerPage = 5;

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) 
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

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

  const handleAddProduct = () => {
    const id = Math.max(...products.map((p) => p.id)) + 1;
    setProducts([...products, { id, ...newProduct }]);
    setNewProduct({ name: "",  quantity: 0, price: 0, threshold: 0 });
    Toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to the inventory.`,
    });
  };

  const handleUpdateProduct = () => {
    if (editingProduct) {
      setProducts(
        products.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
      setEditingProduct(null);
      Toast({
        title: "Product Updated",
        description: `${editingProduct.name} has been updated.`,
      });
    }
  };

  const handleDeleteProduct = (id) => {
    const productToDelete = products.find((p) => p.id === id);
    setProducts(products.filter((p) => p.id !== id));
    Toast({
      title: "Product Deleted",
      description: `${productToDelete?.name} has been removed from the inventory.`,
      variant: "destructive",
    });
  };

  const handleBulkEntry = () => {
    const newProducts = bulkEntryData.split("\n").map((line) => {
      const [name, sku, quantity, price, threshold] = line.split(",");
      return {
        name: name.trim(),
        sku: sku.trim(),
        quantity: parseInt(quantity.trim()),
        price: parseFloat(price.trim()),
        threshold: parseInt(threshold.trim()),
      };
    });

    const validProducts = newProducts.filter(
      (p) =>
        p.name &&
        p.sku &&
        !isNaN(p.quantity) &&
        !isNaN(p.price) &&
        !isNaN(p.threshold)
    );

    if (validProducts.length === newProducts.length) {
      const lastId = Math.max(...products.map((p) => p.id));
      const productsWithIds = validProducts.map((p, index) => ({
        ...p,
        id: lastId + index + 1,
      }));
      setProducts([...products, ...productsWithIds]);
      setBulkEntryData("");
      Toast({
        title: "Bulk Entry Successful",
        description: `${validProducts.length} products have been added to the inventory.`,
      });
    } else {
      Toast({
        title: "Bulk Entry Error",
        description:
          "Some entries were invalid. Please check your input and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="space-x-2">
            <Dialog>
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
                    />
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
                      value={newProduct.price}
                      onChange={handleInputChange}
                      className="col-span-3"
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
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddProduct}>Add Product</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>

                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
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
                          onClick={() => setEditingProduct(product)}
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
                              />
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
                                value={editingProduct.price}
                                onChange={handleInputChange}
                                className="col-span-3"
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
      </CardContent>
    </Card>
  );
}
