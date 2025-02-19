import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const products = [
  { id: 1, name: "Product A", quantity: 5, threshold: 10 },
  { id: 2, name: "Product B", quantity: 15, threshold: 20 },
  { id: 3, name: "Product C", quantity: 8, threshold: 15 },
];

export function InventoryAlerts() {
  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.threshold
  );

  return (
    <div className="space-y-4">
      {lowStockProducts.map((product) => (
        <Alert key={product.id}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {product.name} is running low on stock. Current quantity:{" "}
            {product.quantity}, Threshold: {product.threshold}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
