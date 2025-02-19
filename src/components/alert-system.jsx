import { Bell, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const products = [
  { id: 1, name: "Product A", quantity: 5, threshold: 10 },
  { id: 2, name: "Product B", quantity: 15, threshold: 20 },
  { id: 3, name: "Product C", quantity: 8, threshold: 15 },
  { id: 4, name: "Product D", quantity: 3, threshold: 5 },
  { id: 5, name: "Product E", quantity: 25, threshold: 20 },
];

function generateAlerts(products) {
  return products
    .filter((product) => product.quantity <= product.threshold)
    .map((product) => ({
      id: product.id,
      title: "Low Stock Alert",
      description: `${product.name} is running low on stock. Current quantity: ${product.quantity}, Threshold: ${product.threshold}`,
      type: product.quantity === 0 ? "error" : "warning",
    }));
}

export function AlertSystem() {
  const alerts = generateAlerts(products);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert System</CardTitle>
        <CardDescription>Recent alerts and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                {alert.type === "warning" ? (
                  <AlertTriangle className="text-yellow-500" />
                ) : alert.type === "error" ? (
                  <AlertTriangle className="text-red-500" />
                ) : (
                  <Bell className="text-blue-500" />
                )}
                <div>
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                  <CardDescription>{alert.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
          {alerts.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Alerts</CardTitle>
                <CardDescription>
                  All inventory levels are above their thresholds.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
