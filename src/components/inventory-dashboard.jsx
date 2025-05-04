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
  Plus,
  Edit,
  ShoppingCart,
} from "lucide-react";
import { useInventory } from "@/contexts/inventory-context";
import { CurrencyFormatter } from "@/components/currency-formatter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/currency-context";
import { format, subDays } from "date-fns";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/dbConfig";

// Format timestamp to readable format
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Unknown date";

  // Try to convert to a Date object if it's not already
  let date;

  try {
    // Handle Firestore timestamp objects
    if (timestamp && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    }
    // Handle JS Date objects
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Handle timestamp numbers (milliseconds since epoch)
    else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    }
    // Handle timestamp objects with seconds and nanoseconds
    else if (
      timestamp &&
      typeof timestamp === "object" &&
      "seconds" in timestamp
    ) {
      date = new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
      );
    }
    // Handle timestamp strings (ISO format)
    else if (typeof timestamp === "string") {
      // Try parsing as ISO date first
      date = new Date(timestamp);

      // If invalid, try parsing as seconds since epoch
      if (isNaN(date.getTime())) {
        const seconds = parseFloat(timestamp);
        if (!isNaN(seconds)) {
          date = new Date(seconds * 1000); // Convert seconds to milliseconds
        }
      }
    } else {
      console.error("Unknown timestamp format:", timestamp);
      return "Invalid date";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date object created from timestamp:", timestamp);
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // If it's within the last minute
    if (diffSec < 60) {
      return diffSec <= 5 ? "Just now" : `${diffSec} seconds ago`;
    }

    // If it's within the last hour
    if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    }

    // If it's within the last 24 hours
    if (diffHour < 24) {
      return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
    }

    // If it's yesterday
    if (diffDay === 1) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    }

    // If it's within the last 7 days
    if (diffDay < 7) {
      return format(date, "EEEE") + ` at ${format(date, "h:mm a")}`;
    }

    // Otherwise show the full date
    return format(date, "MMM d, yyyy • h:mm a");
  } catch (e) {
    console.error(
      "Error formatting timestamp:",
      e,
      "Original value:",
      timestamp
    );
    return "Invalid date";
  }
};

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
  const { products, loading, error, getLowStockProducts, businessId } =
    useInventory();
  const { formatCurrency, convertCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categories: 0,
    avgPrice: 0,
    totalSalesValue: 0,
    salesTrend: [],
    categoryDistribution: [],
    stockDistribution: { inStock: 0, lowStock: 0, outOfStock: 0 },
    reorderSuggestions: [],
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);

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

  // Fetch real sales data from Firestore
  const fetchSalesData = async (businessId) => {
    try {
      if (!businessId) {
        console.error("No business ID available for filtering sales data");
        return {
          salesTrend: generateDateLabels().map((date) => ({
            date,
            sales: 0,
            value: 0,
          })),
          totalSalesValue: 0,
        };
      }

      const daysToShow =
        timeRange === "week"
          ? 7
          : timeRange === "month"
          ? 30
          : timeRange === "quarter"
          ? 90
          : 365;

      const startDate = subDays(new Date(), daysToShow);

      // Modified query approach to avoid composite index requirement
      // First filter by businessId only
      const salesCollection = collection(db, "sales");
      const salesQuery = query(
        salesCollection,
        where("businessId", "==", businessId)
      );

      const querySnapshot = await getDocs(salesQuery);

      // Create a map to store sales by date
      const salesByDate = {};
      const dateLabels = generateDateLabels();

      // Initialize all dates with zero values
      dateLabels.forEach((date) => {
        salesByDate[date] = { date, sales: 0, value: 0 };
      });

      // Calculate total sales value
      let totalSalesValue = 0;

      // Process sales data and filter by date in memory
      querySnapshot.forEach((doc) => {
        const saleData = doc.data();

        // Safely handle timestamp conversion
        const saleDate = saleData.timestamp
          ? typeof saleData.timestamp.toDate === "function"
            ? saleData.timestamp.toDate()
            : new Date(saleData.timestamp)
          : new Date();

        // Filter by date in memory instead of in the query
        if (saleDate >= startDate) {
          const dateKey = format(saleDate, "MMM dd");

          if (salesByDate[dateKey]) {
            // Count items quantity
            const itemsCount = saleData.items.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );

            // Update sales for the date
            salesByDate[dateKey].sales += itemsCount;
            salesByDate[dateKey].value += saleData.total || 0;

            // Add to total sales value
            totalSalesValue += saleData.total || 0;
          }
        }
      });

      // Convert map to array for the chart
      const salesTrend = Object.values(salesByDate);

      return { salesTrend, totalSalesValue };
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return {
        salesTrend: generateDateLabels().map((date) => ({
          date,
          sales: 0,
          value: 0,
        })),
        totalSalesValue: 0,
      };
    }
  };

  // Fetch top selling products
  const fetchTopSellingProducts = async (businessId) => {
    try {
      if (!businessId) {
        return [];
      }

      const salesCollection = collection(db, "sales");
      const salesQuery = query(
        salesCollection,
        where("businessId", "==", businessId)
      );

      const salesSnapshot = await getDocs(salesQuery);

      // Create a map to track sales counts by product
      const productSalesMap = {};

      // Process all sales data
      salesSnapshot.forEach((doc) => {
        const saleData = doc.data();

        // Check if the document has items array
        if (saleData.items && Array.isArray(saleData.items)) {
          saleData.items.forEach((item) => {
            // Try to use product name as key if no productId
            const key =
              item.productId || item.name || item.id || JSON.stringify(item);

            if (key) {
              if (!productSalesMap[key]) {
                productSalesMap[key] = {
                  id: item.productId || key,
                  name: item.name || "Product " + key.substring(0, 8),
                  category: item.category || "Uncategorized",
                  price: parseFloat(item.price) || 0,
                  totalSold: 0,
                  totalRevenue: 0,
                };
              }

              const quantity = parseInt(item.quantity) || 1;
              const price = parseFloat(item.price) || 0;

              productSalesMap[key].totalSold += quantity;
              productSalesMap[key].totalRevenue += price * quantity;
            }
          });
        }
      });

      // Convert map to array and sort by total sold (descending)
      const topSellingProducts = Object.values(productSalesMap)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      return topSellingProducts;
    } catch (error) {
      console.error("Error fetching top selling products:", error);
      return [];
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async (businessId) => {
    try {
      if (!businessId) {
        return [];
      }

      // Initialize the recentProductUpdates array
      const recentProductUpdates = [];

      // Fetch product updates
      const productUpdatesQuery = query(
        collection(db, "products"),
        where("businessId", "==", businessId)
      );

      // Fetch recent sales with improved timestamp handling
      const salesQuery = query(
        collection(db, "sales"),
        where("businessId", "==", businessId)
      );

      const salesSnapshot = await getDocs(salesQuery);

      // Process all sales with better timestamp handling
      const allSales = [];

      // Process all sales with better timestamp handling
      salesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        let timestamp;

        // Safely handle the Firestore timestamp conversion
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === "function") {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp instanceof Date) {
            timestamp = data.timestamp;
          } else if (typeof data.timestamp === "number") {
            timestamp = new Date(data.timestamp);
          } else if (
            typeof data.timestamp === "object" &&
            "seconds" in data.timestamp
          ) {
            timestamp = new Date(
              data.timestamp.seconds * 1000 +
                (data.timestamp.nanoseconds || 0) / 1000000
            );
          } else if (typeof data.timestamp === "string") {
            timestamp = new Date(data.timestamp);
          } else {
            timestamp = new Date();
            console.warn("Unknown sale timestamp format:", data.timestamp);
          }
        } else {
          timestamp = new Date();
        }

        // Validate timestamp
        if (isNaN(timestamp.getTime())) {
          console.error("Invalid sales timestamp:", data.timestamp);
          timestamp = new Date(); // Use current date as fallback
        }

        allSales.push({
          id: doc.id,
          type: "sale",
          name: `Sale #${doc.id.substring(0, 5)}`,
          timestamp: timestamp,
          details: {
            items: data.items?.length || 0,
            total: data.total || 0,
          },
        });
      });

      // Sort sales by timestamp and take only 5 most recent
      const recentSales = allSales
        .sort((a, b) => {
          // Ensure we're comparing timestamp objects correctly
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 5);

      // Combine and sort by timestamp
      const allActivities = [...recentProductUpdates, ...recentSales]
        .sort((a, b) => {
          // Ensure we're comparing timestamp objects correctly
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 8);

      return allActivities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  };

  // Render activity item
  const renderActivityItem = (activity) => {
    // Ensure timestamp is formatted to string before rendering
    const formattedTime =
      typeof activity.timestamp === "object"
        ? formatTimestamp(activity.timestamp)
        : formatTimestamp(new Date());

    return (
      <div key={activity.id} className="flex items-start space-x-3 py-2">
        {activity.type === "product" ? (
          <div className="bg-indigo-100 p-2 rounded-md">
            <Package className="h-4 w-4 text-indigo-600" />
          </div>
        ) : (
          <div className="bg-green-100 p-2 rounded-md">
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </div>
        )}
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">{activity.name}</p>
          <p className="text-xs text-muted-foreground">{formattedTime}</p>
          {activity.type === "sale" && (
            <p className="text-xs">
              {activity.details.items} items •{" "}
              <CurrencyFormatter value={activity.details.total} />
            </p>
          )}
        </div>
      </div>
    );
  };

  // Calculate dashboard metrics whenever products change
  useEffect(() => {
    const fetchData = async () => {
      if (loading) return; // Don't fetch data while loading

      try {
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

          const outOfStock = products.filter(
            (product) => product.quantity === 0
          );

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
          const categoryMap = {};
          products.forEach((product) => {
            const category = product.category || "Uncategorized";
            categoryMap[category] = (categoryMap[category] || 0) + 1;
          });

          const categoryDistribution = Object.keys(categoryMap).map(
            (category, index) => ({
              name: category,
              value: categoryMap[category],
              fill: COLORS[index % COLORS.length],
            })
          );

          // Fetch sales data
          const { salesTrend, totalSalesValue } = await fetchSalesData(
            businessId
          );

          // Fetch recent activities
          const recentActivities = await fetchRecentActivities(businessId);
          setRecentActivity(recentActivities);

          // Fetch top selling products
          const topSelling = await fetchTopSellingProducts(businessId);
          setTopSellingProducts(topSelling);

          // Set the stats
          setStats({
            totalProducts,
            totalValue,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            categories: uniqueCategories.size,
            avgPrice,
            totalSalesValue,
            salesTrend,
            categoryDistribution,
            stockDistribution,
            reorderSuggestions: lowStock.slice(0, 3),
          });

          // Set low stock products
          setLowStockProducts(lowStock);

          // Set top products (by value)
          const topByValue = [...products]
            .sort((a, b) => b.price * b.quantity - a.price * a.quantity)
            .slice(0, 5);

          setTopProducts(topByValue);
        } else {
          // Reset stats if no products
          setStats({
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            categories: 0,
            avgPrice: 0,
            totalSalesValue: 0,
            salesTrend: [],
            categoryDistribution: [],
            stockDistribution: { inStock: 0, lowStock: 0, outOfStock: 0 },
            reorderSuggestions: [],
          });
          setLowStockProducts([]);
          setTopProducts([]);
          setTopSellingProducts([]);
          setRecentActivity([]);
        }
      } catch (error) {
        console.error("Error calculating dashboard metrics:", error);
      }
    };

    fetchData();
  }, [products, timeRange, businessId, loading]);

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
    <div className="space-y-6 w-full max-w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between">
          <TabsList className="bg-indigo-50 rounded-md p-1 dark:bg-gray-800 dark:text-gray-300">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Layers className="mr-2 h-4 w-4" />
              Inventory Health
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          {/* Overview tab content */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-3xl font-bold break-words">
                  {stats.totalProducts}
                </div>
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
                <div className="text-3xl font-bold break-words min-w-0">
                  <CurrencyFormatter value={stats.totalValue} />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-md"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold break-words min-w-0">
                  <CurrencyFormatter value={stats.totalSalesValue} />
                </div>
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
                <div className="text-3xl font-bold break-words min-w-0">
                  {stats.lowStockCount + stats.outOfStockCount}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
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
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mt-4">
            {/* Sales Trend Chart */}
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Sales Trend
                    </CardTitle>
                    <CardDescription>
                      Sales performance over time
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
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
                  </div>
                </div>
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
                          `${formatCurrency(convertCurrency(value, "USD"))}`,
                          "Sales",
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          color: "#111",
                          backgroundColor: "#fff",
                        }}
                        labelStyle={{ color: "#111" }}
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
            <Card className="col-span-1 lg:col-span-3">
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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
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
                  <Clock className="h-5 w-5 text-indigo-600" />
                  Recent Sales
                </CardTitle>
                <CardDescription>
                  Latest sales transactions and revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  {recentActivity.length > 0 ? (
                    <div className="space-y-0 p-1">
                      {recentActivity
                        .filter((activity) => activity.type === "sale")
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 border-b border-muted py-3 px-2 last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            {/* Activity Icon */}
                            <div className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900/20">
                              <ShoppingCart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 space-y-1">
                              <div className="text-sm font-medium leading-none flex items-center">
                                {activity.name}
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                                >
                                  Sale
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {activity.details.items} items sold for{" "}
                                <CurrencyFormatter
                                  value={activity.details.total}
                                />
                              </p>

                              {/* Activity Timestamp */}
                              <p className="text-xs text-muted-foreground flex items-center mt-1 px-2 py-1 rounded">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTimestamp(activity.timestamp)}
                              </p>
                            </div>

                            {/* Activity Value */}
                            <div>
                              <CurrencyFormatter
                                value={activity.details.total}
                                className="text-sm font-medium"
                              />
                            </div>
                          </div>
                        ))}
                      {recentActivity.filter(
                        (activity) => activity.type === "sale"
                      ).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No recent sales found
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No recent sales found
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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                            <div className="font-medium py-2">
                              {product.name}
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
                        contentStyle={{
                          color: "#111",
                          backgroundColor: "#fff",
                        }}
                        labelStyle={{ color: "#111", fontWeight: "bold" }}
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

            {/* Top Selling Products Section */}
            <Card className="md:col-span-2 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Top Selling Products
                </CardTitle>
                <CardDescription>
                  Products with the highest sales volume
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingProducts.length > 0 ? (
                      topSellingProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="font-medium py-2">
                              {product.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category || "Uncategorized"}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {product.totalSold}
                          </TableCell>
                          <TableCell className="font-medium">
                            <CurrencyFormatter value={product.totalRevenue} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <p className="text-muted-foreground">
                            No sales data available yet
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
