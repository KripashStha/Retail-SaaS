"use client";

import { useState } from "react";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";

export function CSVUpload() {
  const [file, setFile] = useState(null);
  const [manualEntryData, setManualEntryData] = useState("");

  const handleFileChange = (event) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      console.log(`Uploading file: ${file.name}`);
      Toast({
        title: "CSV Upload",
        description: `File ${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleManualEntry = () => {
    const products = manualEntryData
      .split("\n")
      .map((line) => {
        const [name, sku, quantity, price, threshold] = line.split(",");
        return {
          name: name.trim(),
          sku: sku.trim(),
          quantity: parseInt(quantity.trim()),
          price: parseFloat(price.trim()),
          threshold: parseInt(threshold.trim()),
        };
      })
      .filter(
        (product) =>
          product.name &&
          product.sku &&
          !isNaN(product.quantity) &&
          !isNaN(product.price) &&
          !isNaN(product.threshold)
      );

    if (products.length > 0) {
      console.log("Manually entered products:", products);
      setManualEntryData("");
      Toast({
        title: "Manual Entry",
        description: `${products.length} products have been added successfully.`,
      });
    } else {
      Toast({
        title: "Manual Entry Error",
        description:
          "No valid products were entered. Please check your input and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Upload</CardTitle>
        <CardDescription>
          Upload your inventory data using a CSV file or manual entry
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        </div>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Product Entry</DialogTitle>
              <DialogDescription>
                Enter product details in CSV format: Name, SKU, Quantity, Price,
                Threshold (one product per line)
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Product A, SKU001, 100, 19.99, 20&#13;Product B, SKU002, 75, 29.99, 15"
              value={manualEntryData}
              onChange={(e) => setManualEntryData(e.target.value)}
              rows={10}
            />
            <DialogFooter>
              <Button onClick={handleManualEntry}>Add Products</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
