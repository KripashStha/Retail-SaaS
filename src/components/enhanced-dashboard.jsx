"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventory } from "@/contexts/inventory-context";
import { useCurrency } from "@/contexts/currency-context";
import { CurrencyFormatter } from "@/components/currency-formatter";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  differenceInDays,
} from "date-fns";

// UI Components
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  PackageOpen,
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  CircleAlert,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  PackagePlus,
  DollarSign,
  Clock,
  Info,
  ListFilter,
  Layers,
  Grid3x3,
  Boxes,
  BadgePercent,
  Warehouse,
} from "lucide-react";

// Visualization Components
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
} from "recharts";

const COLORS = [
  "#0ea5e9", // Sky blue - Primary
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#84cc16", // Lime
  "#14b8a6", // Teal
];

const ColoredBadge = ({
  value,
  threshold = 0,
  reverseColor = false,
  suffix = "%",
  ...props
}) => {
  let color;

  if (reverseColor) {
    if (value <= threshold) color = "bg-green-500";
    else if (value <= threshold + 30) color = "bg-amber-500";
    else color = "bg-red-500";
  } else {
    if (value >= threshold + 70) color = "bg-green-500";
    else if (value >= threshold + 30) color = "bg-amber-500";
    else color = "bg-red-500";
  }

  return (
    <Badge className={`${color}`} {...props}>
      {value}
      {suffix}
    </Badge>
  );
};

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  description,
  className = "",
}) => (
  <Card className={`overflow-hidden ${className}`}>
    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-6 translate-y--6 opacity-10 rounded-full bg-blue-500" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="rounded-md bg-primary/10 p-1">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <div className="mt-1 flex items-center text-xs">
          {trend === "up" ? (
            <ChevronUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-rose-500" />
          )}
          <span
            className={trend === "up" ? "text-emerald-500" : "text-rose-500"}
          >
            {change}
          </span>
          <span className="ml-1 text-muted-foreground">{description}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export function EnhancedDashboard() {
  const { products, loading, error } = useInventory();
  const { formatCurrency } = useCurrency();
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("insights");

  const [insights, setInsights] = useState({
    totalProducts: 0,
    totalValue: 0,
    avgPrice: 0,
    stockLevels: {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      total: 0,
    },
    categoryBreakdown: [],
    topProducts: [],
    inventoryHealth: 0,
    reorderSuggestions: [],
    salesTrend: [],
    productPerformance: [],
    inventoryDistribution: {
      byValue: [],
      byQuantity: [],
    },
    efficiencyMetrics: {
      turnoverRate: 0,
      stockCoverage: 0,
      inventoryAccuracy: 0,
    },
  });

  const datePeriod = useMemo(() => {
    const today = new Date();

    switch (timeRange) {
      case "week":
        return {
          start: subDays(today, 7),
          end: today,
          days: 7,
        };
      case "quarter":
        return {
          start: subDays(today, 90),
          end: today,
          days: 90,
        };
      case "year":
        return {
          start: subDays(today, 365),
          end: today,
          days: 365,
        };
      case "month":
      default:
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        return {
          start: monthStart,
          end: monthEnd,
          days: differenceInDays(monthEnd, monthStart) + 1,
        };
    }
  }, [timeRange]);

  // Generate date labels for the selected time range
  const generateDateLabels = () => {
    const dates = [];
    for (let i = datePeriod.days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      dates.push(format(date, "MMM dd"));
    }
    return dates;
  };

  // Generate sales trend data
  const generateSalesTrend = () => {
    const dates = generateDateLabels();
    return dates.map((date) => {
      // Random sales data with some pattern (higher on weekends)
      const day = new Date(date).getDay();
      const isWeekend = day === 0 || day === 6;
      const baseSales = Math.floor(Math.random() * 500) + 200;
      const sales = isWeekend ? baseSales * 1.5 : baseSales;

      return {
        date,
        sales: Math.round(sales),
        revenue: Math.round(sales * (Math.random() * 15 + 5)),
        profit: Math.round(sales * (Math.random() * 5 + 2)),
      };
    });
  };

  // Calculate all insights whenever product data changes
  useEffect(() => {
    if (!products.length) return;

    // Calculate basic metrics
    const totalProducts = products.length;
    let totalQuantity = 0;
    let totalValue = 0;

    // Stock level categorization
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.threshold
    );
    const outOfStock = products.filter((p) => p.quantity === 0);
    const inStock = products.filter((p) => p.quantity > p.threshold);

    // Calculate inventory value and quantity
    products.forEach((product) => {
      const value = product.price * product.quantity;
      totalValue += value;
      totalQuantity += product.quantity;
    });

    // Average price
    const avgPrice = totalProducts > 0 ? totalValue / totalQuantity : 0;

    // Inventory health score (weighs different factors)
    const stockRatio =
      totalProducts > 0 ? (inStock.length / totalProducts) * 100 : 0;

    // Calculate inventory turnover (simulated)
    const turnoverRate = Math.random() * 3 + 2; // Simulated between 2-5

    // Calculate stock coverage in days (simulated)
    const stockCoverage = Math.floor(Math.random() * 30) + 15; // 15-45 days

    // Calculate inventory accuracy (simulated)
    const inventoryAccuracy = Math.random() * 10 + 90; // 90-100%

    // Category breakdown
    const categoryMap = {};
    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryMap).map(
      (category, index) => ({
        name: category,
        value: categoryMap[category],
        fill: COLORS[index % COLORS.length],
      })
    );

    // Top products by value
    const topByValue = [...products]
      .sort((a, b) => b.price * b.quantity - a.price * a.quantity)
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        value: product.price * product.quantity,
        price: product.price,
        quantity: product.quantity,
        category: product.category || "Uncategorized",
      }));

    // Value distribution by category
    const valueByCategory = {};
    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      valueByCategory[category] =
        (valueByCategory[category] || 0) + product.price * product.quantity;
    });

    const valueCategoryData = Object.keys(valueByCategory).map(
      (category, index) => ({
        name: category,
        value: valueByCategory[category],
        fill: COLORS[index % COLORS.length],
      })
    );

    // Product performance (simulate sales data)
    const productPerformance = [...products].slice(0, 8).map((product) => {
      // Simulate sales velocity
      const salesVelocity = Math.floor(Math.random() * 10) + 1;
      const profitMargin = Math.random() * 0.4 + 0.1; // 10-50%

      return {
        name:
          product.name.length > 20
            ? `${product.name.substring(0, 20)}...`
            : product.name,
        sales: salesVelocity,
        profit: Math.round(product.price * salesVelocity * profitMargin),
        stock: product.quantity,
      };
    });

    // Set all calculated insights
    setInsights({
      totalProducts,
      totalValue,
      avgPrice,
      stockLevels: {
        inStock: inStock.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        total: totalProducts,
      },
      categoryBreakdown,
      topProducts: topByValue,
      reorderSuggestions: lowStock.slice(0, 3),
      salesTrend: generateSalesTrend(),
      productPerformance,
      inventoryHealth: Math.round(
        stockRatio * 0.5 +
          Math.min(inventoryAccuracy, 100) * 0.3 +
          Math.min(turnoverRate * 10, 50) * 0.2
      ),
      inventoryDistribution: {
        byValue: valueCategoryData,
        byQuantity: categoryBreakdown,
      },
      efficiencyMetrics: {
        turnoverRate,
        stockCoverage,
        inventoryAccuracy,
      },
    });
  }, [products, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading business insights...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-800">{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Date range selector and page title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Business Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive insights and analytics for your business
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-lg border bg-card text-card-foreground shadow-sm">
            <Button
              variant={timeRange === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("week")}
              className="rounded-r-none border-r"
            >
              Week
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("month")}
              className="rounded-none border-r"
            >
              Month
            </Button>
            <Button
              variant={timeRange === "quarter" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("quarter")}
              className="rounded-none border-r"
            >
              Quarter
            </Button>
            <Button
              variant={timeRange === "year" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("year")}
              className="rounded-l-none"
            >
              Year
            </Button>
          </div>

          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Inventory Value"
          value={<CurrencyFormatter value={insights.totalValue} />}
          icon={DollarSign}
          trend="up"
          change="12.5%"
          description="from last month"
        />

        <MetricCard
          title="Total Products"
          value={insights.totalProducts}
          icon={Boxes}
          trend="up"
          change="4 new"
          description="since last week"
        />

        <MetricCard
          title="Inventory Health"
          value={
            <div className="flex items-center space-x-2">
              <span>{insights.inventoryHealth}%</span>
              <ColoredBadge
                value={
                  insights.inventoryHealth > 80
                    ? "Good"
                    : insights.inventoryHealth > 60
                    ? "Average"
                    : "Poor"
                }
                threshold={60}
                suffix=""
              />
            </div>
          }
          icon={Activity}
          trend={insights.inventoryHealth >= 70 ? "up" : "down"}
          change={insights.inventoryHealth >= 70 ? "+5%" : "-3%"}
          description="from baseline"
        />

        <MetricCard
          title="Critical Items"
          value={
            <div className="flex items-center space-x-2">
              <span>
                {insights.stockLevels.lowStock +
                  insights.stockLevels.outOfStock}
              </span>
              <div className="flex space-x-1">
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600"
                >
                  {insights.stockLevels.lowStock} Low
                </Badge>
                <Badge
                  variant="outline"
                  className="border-red-500 text-red-600"
                >
                  {insights.stockLevels.outOfStock} Out
                </Badge>
              </div>
            </div>
          }
          icon={AlertTriangle}
          trend={insights.stockLevels.lowStock > 5 ? "up" : "down"}
          change={insights.stockLevels.lowStock > 5 ? "+3" : "-2"}
          description="since last week"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main column - 3/4 width */}
        <div className="lg:col-span-3 grid gap-6">
          <Tabs
            defaultValue={activeTab}
            className="w-full"
            onValueChange={setActiveTab}
          >
            <div className="flex justify-between items-center">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="insights">
                  <Zap className="mr-2 h-4 w-4" /> Insights
                </TabsTrigger>
                <TabsTrigger value="inventory">
                  <Warehouse className="mr-2 h-4 w-4" /> Inventory
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <BarChart3 className="mr-2 h-4 w-4" /> Performance
                </TabsTrigger>
                <TabsTrigger value="forecasts">
                  <TrendingUp className="mr-2 h-4 w-4" /> Forecasts
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6 mt-6">
              {/* Key Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-primary" />
                    Business Performance
                  </CardTitle>
                  <CardDescription>
                    Revenue, sales and profit trends for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insights.salesTrend}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        fontSize={11}
                        tickFormatter={(value) => value.split(" ")[1]}
                      />
                      <YAxis fontSize={11} />
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          borderRadius: "6px",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value, name) => [
                          name === "sales"
                            ? `${value} units`
                            : formatCurrency(value),
                          name === "sales"
                            ? "Units Sold"
                            : name === "revenue"
                            ? "Revenue"
                            : "Profit",
                        ]}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0ea5e9"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        strokeWidth={2}
                        name="Profit"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Product Performance
                    </CardTitle>
                    <CardDescription>
                      Sales and profit margins by product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={insights.productPerformance}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          opacity={0.2}
                        />
                        <XAxis type="number" fontSize={11} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          fontSize={11}
                          tickMargin={5}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "6px",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value, name) => [
                            name === "sales"
                              ? `${value} units`
                              : formatCurrency(value),
                            name === "sales" ? "Units Sold" : "Profit",
                          ]}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar
                          dataKey="sales"
                          name="Units Sold"
                          fill="#6366f1"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="profit"
                          name="Profit"
                          fill="#10b981"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Inventory Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="mr-2 h-5 w-5 text-primary" />
                      Category Distribution
                    </CardTitle>
                    <CardDescription>
                      Inventory breakdown by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insights.inventoryDistribution.byValue}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {insights.inventoryDistribution.byValue.map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            )
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "6px",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          layout="horizontal"
                          align="center"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Efficiency Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-sky-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                      Inventory Turnover
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">
                      {insights.efficiencyMetrics.turnoverRate.toFixed(1)}x
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {insights.efficiencyMetrics.turnoverRate >= 4
                        ? "Excellent"
                        : insights.efficiencyMetrics.turnoverRate >= 2
                        ? "Good"
                        : "Needs improvement"}
                    </p>
                    <Progress
                      value={Math.min(
                        insights.efficiencyMetrics.turnoverRate * 20,
                        100
                      )}
                      className="h-1.5 mt-2 bg-blue-100"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-emerald-600" />
                      Stock Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-700">
                      {insights.efficiencyMetrics.stockCoverage} days
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      {insights.efficiencyMetrics.stockCoverage >= 30
                        ? "Well stocked"
                        : insights.efficiencyMetrics.stockCoverage >= 15
                        ? "Adequate"
                        : "Low coverage"}
                    </p>
                    <Progress
                      value={Math.min(
                        insights.efficiencyMetrics.stockCoverage * 2,
                        100
                      )}
                      className="h-1.5 mt-2 bg-emerald-100"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-violet-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-indigo-600" />
                      Inventory Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-700">
                      {insights.efficiencyMetrics.inventoryAccuracy.toFixed(1)}%
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">
                      {insights.efficiencyMetrics.inventoryAccuracy >= 98
                        ? "Excellent"
                        : insights.efficiencyMetrics.inventoryAccuracy >= 95
                        ? "Good"
                        : "Needs improvement"}
                    </p>
                    <Progress
                      value={insights.efficiencyMetrics.inventoryAccuracy}
                      className="h-1.5 mt-2 bg-indigo-100"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock Level Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Layers className="mr-2 h-5 w-5 text-primary" />
                      Stock Level Status
                    </CardTitle>
                    <CardDescription>
                      Current inventory stock level distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "In Stock",
                              value: insights.stockLevels.inStock,
                              fill: "#10b981",
                            },
                            {
                              name: "Low Stock",
                              value: insights.stockLevels.lowStock,
                              fill: "#f97316",
                            },
                            {
                              name: "Out of Stock",
                              value: insights.stockLevels.outOfStock,
                              fill: "#f43f5e",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        ></Pie>
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          layout="horizontal"
                          formatter={(value, entry) => (
                            <span style={{ color: entry.color }}>
                              {value} (
                              {Math.round(
                                (entry.payload.value /
                                  insights.stockLevels.total) *
                                  100
                              )}
                              %)
                            </span>
                          )}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} products (${Math.round(
                              (value / insights.stockLevels.total) * 100
                            )}%)`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "6px",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Products by Value */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-primary" />
                      Top Products by Value
                    </CardTitle>
                    <CardDescription>
                      Highest value inventory items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-white ${
                              index === 0
                                ? "bg-amber-500"
                                : index === 1
                                ? "bg-slate-400"
                                : index === 2
                                ? "bg-amber-700"
                                : "bg-slate-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between mb-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="font-semibold">
                                <CurrencyFormatter value={product.value} />
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <div>
                                {product.quantity} units at{" "}
                                <CurrencyFormatter value={product.price} />
                              </div>
                              <div>{product.category}</div>
                            </div>
                            <Progress
                              value={Math.min(
                                (product.value /
                                  insights.topProducts[0].value) *
                                  100,
                                100
                              )}
                              className="h-1 mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="outline" size="sm" className="ml-auto">
                      View All Products{" "}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Reorder Suggestions */}
              <Card>
                <CardHeader className="bg-amber-50 border-b">
                  <CardTitle className="flex items-center text-amber-800">
                    <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
                    Reorder Suggestions
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Products that need to be restocked soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  {insights.stockLevels.lowStock > 0 ? (
                    <div className="py-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium">
                          {insights.stockLevels.lowStock} products below minimum
                          stock level
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <PackagePlus className="h-4 w-4 mr-1" />
                          Create Purchase Order
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          ...Array(Math.min(4, insights.stockLevels.lowStock)),
                        ].map((_, i) => {
                          // Create some simulated low stock products if we don't have enough
                          const mockProduct = {
                            name: `Product ${i + 1}`,
                            category: [
                              "Electronics",
                              "Office Supplies",
                              "Furniture",
                            ][i % 3],
                            quantity: Math.floor(Math.random() * 5),
                            threshold: 10,
                          };

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between border rounded-lg p-3 bg-white"
                            >
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <PackageOpen className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="ml-3">
                                  <div className="font-medium">
                                    {mockProduct.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {mockProduct.category}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-amber-600">
                                  {mockProduct.quantity} /{" "}
                                  {mockProduct.threshold}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Current / Minimum
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <h3 className="text-lg font-medium">
                        All stock levels are healthy
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No products currently need reordering
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Sales Performance
                  </CardTitle>
                  <CardDescription>
                    Sales, revenue, and profit trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        fontSize={11}
                        tickFormatter={(value) => value.split(" ")[1]}
                      />
                      <YAxis yAxisId="left" fontSize={11} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "sales"
                            ? `${value} units`
                            : formatCurrency(value),
                          name === "sales"
                            ? "Units Sold"
                            : name === "revenue"
                            ? "Revenue"
                            : "Profit",
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          borderRadius: "6px",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        name="Units Sold"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BadgePercent className="mr-2 h-5 w-5 text-primary" />
                      Product Profitability
                    </CardTitle>
                    <CardDescription>
                      Top products by profit margin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        outerRadius={90}
                        width={730}
                        height={250}
                        data={insights.productPerformance
                          .slice(0, 5)
                          .map((item) => ({
                            name: item.name,
                            profitMargin: Math.round(
                              (item.profit / (item.sales * 100)) * 100
                            ),
                            salesVolume: Math.min(item.sales * 10, 100),
                            stockHealth: Math.min(item.stock * 5, 100),
                          }))}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" fontSize={11} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Profit Margin"
                          dataKey="profitMargin"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Sales Volume"
                          dataKey="salesVolume"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Stock Health"
                          dataKey="stockHealth"
                          stroke="#ffc658"
                          fill="#ffc658"
                          fillOpacity={0.6}
                        />
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Grid3x3 className="mr-2 h-5 w-5 text-primary" />
                      Inventory Value Map
                    </CardTitle>
                    <CardDescription>
                      Visual representation of inventory value
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={insights.inventoryDistribution.byValue}
                        dataKey="value"
                        ratio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                      >
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            borderRadius: "6px",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                          }}
                        />
                      </Treemap>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Forecasts Tab */}
            <TabsContent value="forecasts" className="mt-6">
              <div className="rounded-lg border p-6 flex flex-col items-center justify-center h-96 bg-muted/20">
                <Zap className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Predictive Analytics Coming Soon
                </h3>
                <p className="text-muted-foreground text-center max-w-lg mb-6">
                  Our advanced AI-based forecasting system will analyze your
                  inventory data to predict future trends, suggest optimal stock
                  levels, and help you make proactive business decisions.
                </p>
                <Button variant="outline">
                  Join Waiting List
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - 1/4 width */}
        <div className="space-y-6">
          {/* Health Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Health Score
                </div>
                <ColoredBadge value={insights.inventoryHealth} threshold={60} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <Progress value={insights.inventoryHealth} className="h-2" />
              </div>
              <div className="grid grid-cols-3 text-xs mt-4">
                <div className="text-center">
                  <div className="font-medium">Stock</div>
                  <div
                    className={`mt-1 ${
                      insights.stockLevels.lowStock > 5
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {insights.stockLevels.inStock >
                    insights.stockLevels.total / 2
                      ? "Good"
                      : "Low"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Turnover</div>
                  <div
                    className={`mt-1 ${
                      insights.efficiencyMetrics.turnoverRate >= 3
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {insights.efficiencyMetrics.turnoverRate.toFixed(1)}x
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Balance</div>
                  <div className="mt-1 text-green-600">Good</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card
            className={
              insights.stockLevels.outOfStock > 0 ? "border-red-200" : ""
            }
          >
            <CardHeader
              className={`pb-2 ${
                insights.stockLevels.outOfStock > 0 ? "bg-red-50" : ""
              }`}
            >
              <CardTitle className="flex items-center text-base">
                <CircleAlert className="mr-2 h-5 w-5 text-red-500" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {insights.stockLevels.outOfStock > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-start pb-2 border-b">
                    <div className="flex items-start">
                      <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {insights.stockLevels.outOfStock} Out-of-Stock Items
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Immediate action needed
                        </div>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Restock
                    </Button>
                  </div>
                  {insights.stockLevels.lowStock > 0 && (
                    <div className="flex justify-between items-start pb-2">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                        <div>
                          <div className="font-medium">
                            {insights.stockLevels.lowStock} Low Stock Items
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Order soon to avoid stockouts
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="font-medium">No critical alerts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All inventory items are at healthy levels
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 justify-center"
                >
                  <ShoppingBag className="mb-1 h-5 w-5" />
                  <div className="text-xs">New Order</div>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 justify-center"
                >
                  <PackagePlus className="mb-1 h-5 w-5" />
                  <div className="text-xs">Add Stock</div>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 justify-center"
                >
                  <RefreshCw className="mb-1 h-5 w-5" />
                  <div className="text-xs">Stock Count</div>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 justify-center"
                >
                  <ListFilter className="mb-1 h-5 w-5" />
                  <div className="text-xs">Reports</div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Business Insights */}
          <Card>
            <CardHeader className="pb-2 bg-blue-50/50">
              <CardTitle className="flex items-center text-base">
                <Zap className="mr-2 h-5 w-5 text-blue-500" />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-4">
                  <div className="flex items-start pb-2 border-b">
                    <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Price Optimization</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Your average product price is{" "}
                        <CurrencyFormatter value={insights.avgPrice} />, which
                        is {insights.avgPrice > 50 ? "above" : "below"} market
                        average. Consider{" "}
                        {insights.avgPrice > 50
                          ? "competitive pricing adjustments"
                          : "premium positioning"}
                        .
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start pb-2 border-b">
                    <TrendingUp className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Growth Opportunity</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {insights.categoryBreakdown[0]?.name} is your most
                        stocked category. Consider expanding your selection
                        based on current trends.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start pb-2 border-b">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Inventory Balance</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {insights.stockLevels.lowStock > 3
                          ? `${insights.stockLevels.lowStock} items are below optimal levels. Consider reordering to maintain service levels.`
                          : "Your inventory balance is healthy across categories."}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <RefreshCw className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Turnover Rate</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Your current turnover rate is{" "}
                        {insights.efficiencyMetrics.turnoverRate.toFixed(1)}x.{" "}
                        {insights.efficiencyMetrics.turnoverRate < 4
                          ? "Increasing this could improve cash flow."
                          : "This is excellent and indicates efficient inventory management."}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
