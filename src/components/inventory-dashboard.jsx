"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Package, DollarSign, BarChart2 } from "lucide-react";
import { useInventory } from "@/contexts/inventory-context";

export function InventoryDashboard() {
  const { products, loading, error, getLowStockProducts } = useInventory();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    categories: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState([]);

  // Calculate dashboard metrics whenever products change
  useEffect(() => {
    if (products.length > 0) {
      // Calculate total products
      const totalProducts = products.length;
      
      // Calculate total inventory value
      const totalValue = products.reduce(
        (sum, product) => sum + (product.price * product.quantity),
        0
      );
      
      // Get low stock products
      const lowStock = products.filter(
        product => product.quantity <= product.threshold
      );
      
      // Count unique categories
      const uniqueCategories = new Set(
        products.map(product => product.category).filter(Boolean)
      );
      
      // Set the stats
      setStats({
        totalProducts,
        totalValue,
        lowStockCount: lowStock.length,
        categories: uniqueCategories.size,
      });
      
      // Set low stock products
      setLowStockProducts(lowStock);
      
      // Get recently updated products (last 5)
      const sorted = [...products]
        .filter(p => p.updatedAt)
        .sort((a, b) => (b.updatedAt - a.updatedAt))
        .slice(0, 5);
      
      setRecentlyUpdated(sorted);
    }
  }, [products]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading inventory data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Items in inventory
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value of inventory
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categories
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">
              Unique product categories
            </p>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>
              Items that need to be restocked soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{product.threshold}</TableCell>
                    <TableCell>
                      {product.quantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning">Low Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Changes</CardTitle>
          <CardDescription>
            Products with recent inventory updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentlyUpdated.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyUpdated.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell 
                      className={product.quantity <= product.threshold 
                        ? "text-red-500" 
                        : ""}
                    >
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No recent updates found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 