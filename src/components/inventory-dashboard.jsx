"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Package,
  DollarSign,
  BarChart2,
  BarChart3,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Layers,
  RefreshCw,
  ShoppingBag,
  ChevronRight,
  PieChart,
  CheckCircle2,
  XCircle,
  Tag,
  Calendar,
  History,
} from "lucide-react";
import { useInventory } from "@/contexts/inventory-context";
import { CurrencyFormatter } from "@/components/currency-formatter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/currency-context";
import { format, subDays } from "date-fns";

// Import React Charts
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f97316",
  "#f43f5e",
];

export function InventoryDashboard() {
  const { products, loading, error, getLowStockProducts } = useInventory();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categories: 0,
    avgPrice: 0,
    inventoryHealth: 0,
    topSellingProducts: [],
    salesTrend: [],
    categoryDistribution: [],
    stockDistribution: { inStock: 0, lowStock: 0, outOfStock: 0 },
    reorderSuggestions: [],
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Generate dates for the time range
  const generateDateLabels = () => {
    const dates = [];
    const daysToShow =
      timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      dates.push(format(date, "MMM dd"));
    }

    return dates;
  };

  // Generate mock sales data if needed
  const generateMockSalesData = () => {
    const dates = generateDateLabels();
    return dates.map((date) => ({
      date,
      sales: Math.floor(Math.random() * 500) + 100,
      value: Math.floor(Math.random() * 5000) + 1000,
    }));
  };

  // Calculate dashboard metrics whenever products change
  useEffect(() => {
    if (products.length > 0) {
      // Calculate total products
      const totalProducts = products.length;

      // Calculate total inventory value and average price
      let totalValue = 0;
      let totalQuantity = 0;

      products.forEach((product) => {
        const value = product.price * product.quantity;
        totalValue += value;
        totalQuantity += product.quantity;
      });

      const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

      // Get low stock and out of stock products
      const lowStock = products.filter(
        (product) =>
          product.quantity > 0 && product.quantity <= product.threshold
      );

      const outOfStock = products.filter((product) => product.quantity === 0);

      // Stock distribution
      const stockDistribution = {
        inStock: products.length - lowStock.length - outOfStock.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
      };

      // Count unique categories
      const uniqueCategories = new Set(
        products.map((product) => product.category).filter(Boolean)
      );

      // Calculate category distribution
      const categoryMap = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const categoryDistribution = Object.keys(categoryMap).map((category) => ({
        name: category,
        value: categoryMap[category],
        fill: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));

      // Generate top selling products (simulated in this case)
      const topSellingProducts = [...products]
        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
        .slice(0, 5)
        .map((product) => ({
          name: product.name,
          value: product.sold || Math.floor(Math.random() * 50) + 10,
          category: product.category || "Uncategorized",
        }));

      // Calculate inventory health (percentage of products not low/out of stock)
      const inventoryHealth =
        totalProducts > 0
          ? ((totalProducts - lowStock.length - outOfStock.length) /
              totalProducts) *
            100
          : 0;

      // Set the stats
      setStats({
        totalProducts,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        categories: uniqueCategories.size,
        avgPrice,
        inventoryHealth,
        topSellingProducts,
        salesTrend: generateMockSalesData(),
        categoryDistribution,
        stockDistribution,
        reorderSuggestions: lowStock.slice(0, 3),
      });

      // Set low stock products
      setLowStockProducts(lowStock);

      // Get recently updated products (last 5)
      const sorted = [...products]
        .filter((p) => p.updatedAt)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5);

      setRecentlyUpdated(sorted);

      // Set top products (by value)
      const topByValue = [...products]
        .sort((a, b) => b.price * b.quantity - a.price * a.quantity)
        .slice(0, 5);

      setTopProducts(topByValue);
    }
  }, [products, timeRange]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-muted-foreground">Loading inventory insights...</p>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between">
          <TabsList className="bg-indigo-50 rounded-md p-1">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Layers className="mr-2 h-4 w-4" />
              Inventory Health
            </TabsTrigger>
            {/* <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="recommendations">Insights</TabsTrigger> */}
          </TabsList>

          {/* <div className="flex gap-2">
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Week
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              Month
            </Button>
            <Button
              variant={timeRange === "quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("quarter")}
            >
              Quarter
            </Button>
          </div> */}
        </div>

        <TabsContent value="overview" className="mt-4">
          {/* Overview tab content */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* KPI Metrics */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-md"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+4.3%</span> from
                  last month
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-sky-500/5 rounded-md"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventory Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-sky-600" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">
                  <CurrencyFormatter value={stats.totalValue} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+2.1%</span> from
                  last month
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-md"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventory Health
                </CardTitle>
                <Layers className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    {stats.inventoryHealth.toFixed(1)}%
                  </div>
                  {stats.inventoryHealth > 80 ? (
                    <Badge className="bg-green-500">Good</Badge>
                  ) : stats.inventoryHealth > 50 ? (
                    <Badge className="bg-amber-500">Average</Badge>
                  ) : (
                    <Badge className="bg-red-500">Needs Attention</Badge>
                  )}
                </div>
                <Progress value={stats.inventoryHealth} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-md"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Critical Items
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">
                  {stats.lowStockCount + stats.outOfStockCount}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600"
                  >
                    {stats.lowStockCount} Low Stock
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-red-500 text-red-600"
                  >
                    {stats.outOfStockCount} Out of Stock
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Charts */}
          <div className="grid gap-4 md:grid-cols-7 mt-4">
            {/* Sales Trend Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Sales Trend
                </CardTitle>
                <CardDescription>
                  Sales performance over the past{" "}
                  {timeRange === "week"
                    ? "7"
                    : timeRange === "month"
                    ? "30"
                    : "90"}{" "}
                  days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.salesTrend}>
                      <defs>
                        <linearGradient
                          id="salesGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#4f46e5"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#4f46e5"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => value.split(" ")[1]}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value) => [
                          `${formatCurrency(value)}`,
                          "Sales",
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4f46e5"
                        fillOpacity={1}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category & Stock Distribution */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-indigo-600" />
                  Inventory Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown by category and stock status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-36">
                    <p className="text-xs font-medium text-center mb-2">
                      By Category
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={stats.categoryDistribution}
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {stats.categoryDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.fill || COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} items`, name]}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-36">
                    <p className="text-xs font-medium text-center mb-2">
                      By Stock Status
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={[
                            {
                              name: "In Stock",
                              value: stats.stockDistribution.inStock,
                              fill: "#10b981",
                            },
                            {
                              name: "Low Stock",
                              value: stats.stockDistribution.lowStock,
                              fill: "#f97316",
                            },
                            {
                              name: "Out of Stock",
                              value: stats.stockDistribution.outOfStock,
                              fill: "#f43f5e",
                            },
                          ]}
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        />
                        <Tooltip
                          formatter={(value, name) => [`${value} items`, name]}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: "#10b981" }}
                      ></div>
                      <span>In Stock</span>
                    </div>
                    <span className="font-medium">
                      {stats.stockDistribution.inStock} items
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: "#f97316" }}
                      ></div>
                      <span>Low Stock</span>
                    </div>
                    <span className="font-medium">
                      {stats.stockDistribution.lowStock} items
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: "#f43f5e" }}
                      ></div>
                      <span>Out of Stock</span>
                    </div>
                    <span className="font-medium">
                      {stats.stockDistribution.outOfStock} items
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row - Top Products and Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-indigo-600" />
                  Top Products by Value
                </CardTitle>
                <CardDescription>
                  Highest value items in your inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category || "Uncategorized"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <CurrencyFormatter value={product.price} />
                        </TableCell>
                        <TableCell
                          className={
                            product.quantity <= product.threshold
                              ? "text-amber-500"
                              : ""
                          }
                        >
                          {product.quantity}
                        </TableCell>
                        <TableCell className="font-medium">
                          <CurrencyFormatter
                            value={product.price * product.quantity}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest inventory changes and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  {recentlyUpdated.length > 0 ? (
                    <div className="space-y-0 p-1">
                      {recentlyUpdated.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-start gap-4 border-b border-muted py-3 px-2 last:border-0"
                        >
                          <div
                            className={`rounded-full p-2 ${
                              product.quantity <= product.threshold
                                ? "bg-amber-100"
                                : "bg-green-100"
                            }`}
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${
                                product.quantity <= product.threshold
                                  ? "text-amber-600"
                                  : "text-green-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium leading-none flex items-center">
                              {product.name}
                              {product.quantity <= product.threshold && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs border-amber-500 text-amber-600"
                                >
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Quantity: {product.quantity} | Category:{" "}
                              {product.category || "Uncategorized"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {product.updatedAt
                                ? new Date(product.updatedAt).toLocaleString()
                                : "Unknown date"}
                            </p>
                          </div>
                          <div>
                            <CurrencyFormatter
                              value={product.price * product.quantity}
                              className="text-sm font-medium"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No recent updates found
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          {/* Inventory Health tab content */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Low Stock Items
                </CardTitle>
                <CardDescription>
                  Products that need to be restocked soon
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {lowStockProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {product.id.substring(0, 8)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category || "Uncategorized"}
                          </TableCell>
                          <TableCell
                            className={
                              product.quantity === 0
                                ? "text-red-500"
                                : "text-amber-500"
                            }
                          >
                            {product.quantity}
                          </TableCell>
                          <TableCell>{product.threshold}</TableCell>
                          <TableCell>
                            {product.quantity === 0 ? (
                              <Badge
                                variant="destructive"
                                className="flex gap-1 items-center"
                              >
                                <XCircle className="h-3 w-3" /> Out of Stock
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-amber-500 text-amber-600"
                              >
                                Low Stock
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">No low stock items</p>
                    <p className="text-xs text-muted-foreground">
                      All your inventory levels are healthy
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-indigo-600" />
                  Category Analysis
                </CardTitle>
                <CardDescription>
                  Inventory distribution across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value) => [`${value} items`, "Count"]}
                      />
                      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                        {stats.categoryDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-indigo-600" />
                  Top Selling Products
                </CardTitle>
                <CardDescription>
                  Your most popular products by sales volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={stats.topSellingProducts}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        fontSize={12}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Units Sold"
                        fill="#4f46e5"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          {/* Sales Analytics tab content */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <CurrencyFormatter value={68943.45} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">
                    +12.5%
                  </span>{" "}
                  from previous period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Order Value
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <CurrencyFormatter value={128.76} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+3.2%</span> from
                  previous period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventory Turnover
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4.2</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  <span className="text-red-500 font-medium">-0.5</span> from
                  previous period
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Sales Performance
                </CardTitle>
                <CardDescription>
                  Trend analysis of sales over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => value.split(" ")[1]}
                        fontSize={12}
                      />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "sales"
                            ? `${value} units`
                            : formatCurrency(value),
                          name === "sales" ? "Units Sold" : "Sales Value",
                        ]}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        name="Units Sold"
                        stroke="#8b5cf6"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="value"
                        name="Sales Value"
                        stroke="#10b981"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          {/* Recommendations tab content */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Actionable Insights</CardTitle>
                <CardDescription>
                  Recommendations based on your inventory data
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {lowStockProducts.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-start gap-4 mb-2">
                        <div className="rounded-full bg-amber-100 p-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">
                            Restock Low Inventory
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {lowStockProducts.length} products are below their
                            minimum threshold.
                          </p>
                        </div>
                      </div>
                      <div className="ml-10 mt-2">
                        <Button variant="outline" size="sm" className="h-8">
                          Generate Purchase Orders
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start gap-4 mb-2">
                      <div className="rounded-full bg-indigo-100 p-2">
                        <BarChart2 className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          Optimize Inventory Distribution
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stats.categories > 1
                            ? `Your inventory is spread across ${stats.categories} categories. Consider balancing stock levels.`
                            : "Consider categorizing your inventory for better management."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-4 mb-2">
                      <div className="rounded-full bg-green-100 p-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          Pricing Strategy Review
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your average product price is{" "}
                          <CurrencyFormatter value={stats.avgPrice} />. Consider
                          reviewing pricing for optimal profitability.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-blue-100 p-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          Growth Opportunities
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Based on sales trends, consider expanding your
                          top-selling categories for increased revenue.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested Reorders</CardTitle>
                <CardDescription>
                  Items that should be reordered soon
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y">
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                product.quantity === 0
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {product.quantity} in stock
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Min: {product.threshold}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <Button variant="secondary" className="w-full">
                    View All Reorder Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Inventory Health Score</CardTitle>
                <CardDescription>
                  Overall assessment of your inventory management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center md:flex-row md:justify-between gap-6">
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-bold">
                            {Math.round(78)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            out of 100
                          </div>
                        </div>
                      </div>
                      {/* Score Circle */}
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="8"
                          strokeDasharray="283"
                          strokeDashoffset={283 - (283 * 78) / 100}
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 grid gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-100 rounded-md p-3">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          Stock Level
                        </div>
                        <div className="text-lg font-semibold">82%</div>
                        <Progress value={82} className="h-1 mt-2" />
                      </div>
                      <div className="bg-slate-100 rounded-md p-3">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          Turnover
                        </div>
                        <div className="text-lg font-semibold">65%</div>
                        <Progress value={65} className="h-1 mt-2" />
                      </div>
                      <div className="bg-slate-100 rounded-md p-3">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          Diversity
                        </div>
                        <div className="text-lg font-semibold">86%</div>
                        <Progress value={86} className="h-1 mt-2" />
                      </div>
                    </div>

                    <div className="bg-slate-100 rounded-md p-3">
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        Recommendations
                      </div>
                      <ul className="text-sm space-y-1 mt-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Diverse product mix
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Improve stock turnover rate
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Good overall stock levels
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="w-full md:w-1/4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Monthly Trend</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="h-24">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={[
                                { month: "Jan", score: 65 },
                                { month: "Feb", score: 68 },
                                { month: "Mar", score: 72 },
                                { month: "Apr", score: 78 },
                              ]}
                            >
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#4f46e5"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-center text-xs text-muted-foreground mt-2">
                          +13 points in last 3 months
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50">
                <div className="w-full flex justify-between items-center">
                  <div className="text-sm text-slate-500">
                    Last assessed: April 11, 2025
                  </div>
                  <Button size="sm">
                    Improve Score <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
