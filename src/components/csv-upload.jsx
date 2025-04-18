"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import Papa from "papaparse";
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Download,
} from "lucide-react";
import {
  createNewProductNotification,
  createLowStockNotification,
  shouldNotifyLowStock,
} from "@/utils/notification-utils";
import { useInventory } from "@/contexts/inventory-context";
import { useCurrency } from "@/contexts/currency-context";
import { CurrencyFormatter } from "@/components/currency-formatter";

export function CsvUpload() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [mappedFields, setMappedFields] = useState({});
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  
  // Get businessId from inventory context
  const { businessId } = useInventory();

  const { formatCurrency } = useCurrency();

  // Required fields for product data
  const requiredFields = ["name", "price", "quantity", "category"];

  // All possible fields
  const allFields = [
    "id",
    "name",
    "category",
    "price",
    "quantity",
    "threshold",
    "barcode",
  ];

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setErrors([]);
    setWarnings([]);
    setParsedData([]);
    setMappedFields({});
    setUploadSummary(null);

    // Validate file type
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setErrors(["Please upload a valid CSV file"]);
        return;
      }

      // Parse CSV file
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          handleParsedData(results);
        },
        error: (error) => {
          setErrors([`Error parsing CSV: ${error.message}`]);
        },
      });
    }
  };

  // Process parsed CSV data
  const handleParsedData = (results) => {
    const { data, errors: parseErrors, meta } = results;

    if (parseErrors.length > 0) {
      setErrors(
        parseErrors.map(
          (err) => `Parse error: ${err.message} at row ${err.row}`
        )
      );
      return;
    }

    if (data.length === 0) {
      setErrors(["The CSV file is empty"]);
      return;
    }

    // Get headers from the CSV
    const headers = meta.fields;

    // Map CSV headers to our expected fields
    const fieldMapping = {};
    const missingRequiredFields = [];

    // Auto-map fields by name (case-insensitive)
    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().trim();
      const matchedField = allFields.find(
        (field) => field.toLowerCase() === normalizedHeader
      );

      if (matchedField) {
        fieldMapping[header] = matchedField;
      }
    });

    // Check for missing required fields
    requiredFields.forEach((field) => {
      if (!Object.values(fieldMapping).includes(field)) {
        missingRequiredFields.push(field);
      }
    });

    if (missingRequiredFields.length > 0) {
      setErrors([
        `Missing required fields: ${missingRequiredFields.join(", ")}`,
      ]);
      return;
    }

    // Map the data using the field mapping
    const mappedData = data.map((row, index) => {
      const mappedRow = {};

      Object.entries(fieldMapping).forEach(([csvHeader, appField]) => {
        let value = row[csvHeader];

        // Convert numeric fields
        if (appField === "price") {
          value = parseFloat(value);
          if (isNaN(value) || value < 0) {
            setWarnings((prev) => [
              ...prev,
              `Invalid price at row ${index + 1}: ${row[csvHeader]}`,
            ]);
            value = 0;
          }
        } else if (appField === "quantity" || appField === "threshold") {
          value = parseInt(value);
          if (isNaN(value) || value < 0) {
            setWarnings((prev) => [
              ...prev,
              `Invalid ${appField} at row ${index + 1}: ${row[csvHeader]}`,
            ]);
            value = 0;
          }
        }

        mappedRow[appField] = value;
      });

      // Add row number for reference
      mappedRow._rowNumber = index + 1;

      return mappedRow;
    });

    // Validate each row
    const validationErrors = [];
    mappedData.forEach((row) => {
      requiredFields.forEach((field) => {
        if (!row[field] || row[field] === "") {
          validationErrors.push(`Missing ${field} at row ${row._rowNumber}`);
        }
      });
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Set the parsed and mapped data
    setParsedData(mappedData);
    setMappedFields(fieldMapping);

    // Show preview dialog
    setShowPreview(true);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const templateData = [
      {
        name: "Sample Product 1",
        description: "This is a sample product description",
        category: "Category A",
        price: "19.99",
        quantity: "100",
        threshold: "10",
        barcode: "123456789012",
      },
      {
        name: "Sample Product 2",
        description: "Another sample product",
        category: "Category B",
        price: "29.99",
        quantity: "50",
        threshold: "5",
        barcode: "223456789012",
      },
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process the upload to Firestore
  const processUpload = async () => {
    if (!businessId) {
      toast({
        title: "Error",
        description: "Business ID not found",
        variant: "destructive",
      });
      return;
    }

    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No data to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const batchSize = 20; // Process in batches of 20 for better performance
      const totalItems = parsedData.length;
      let processedItems = 0;
      let updatedCount = 0;
      let createdCount = 0;
      let errorCount = 0;

      // Process in batches
      for (let i = 0; i < totalItems; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = parsedData.slice(i, i + batchSize);
        const batchPromises = [];

        // Process each item in the current batch
        for (const item of currentBatch) {
          try {
            // Remove internal tracking field
            const { _rowNumber, ...productData } = item;

            // Add business ID and timestamps
            productData.businessId = businessId;
            productData.updatedAt = serverTimestamp();

            if (productData.id) {
              // Update existing product
              const productRef = doc(db, "products", productData.id);
              const productDoc = await getDoc(productRef);

              if (productDoc.exists()) {
                batch.update(productRef, productData);
                updatedCount++;
              }  else {
                errorCount++;
                console.warn(`Invalid product ID at row ${item._rowNumber}. Skipping update.`);
              }
            } else {
              // Create new product
              const newProductRef = await addDoc(collection(db, "products"), {
                ...productData,
                createdAt: serverTimestamp(),
              });
              productData.id = newProductRef.id;
              createdCount++;

              // Create notification for new product
              batchPromises.push(
                createNewProductNotification(
                  { id: newProductRef.id, ...productData },
                  businessId
                )
              );

              // Check for low stock
              if (shouldNotifyLowStock(productData)) {
                batchPromises.push(
                  createLowStockNotification(
                    { id: newProductRef.id, ...productData },
                    businessId
                  )
                );
              }
            }
          } catch (error) {
            console.error(
              `Error processing item at row ${item._rowNumber}:`,
              error
            );
            errorCount++;
          }
        }

        // Commit the batch
        await batch.commit();

        // Process notifications
        await Promise.all(batchPromises);

        // Update progress
        processedItems += currentBatch.length;
        setProgress(Math.round((processedItems / totalItems) * 100));
      }

      // Create bulk update notification
      if (updatedCount > 0 || createdCount > 0) {
        // Create a notification for the bulk update
        await addDoc(collection(db, "notifications"), {
          title: "Bulk Inventory Update",
          message: `${totalItems} products processed: ${createdCount} created, ${updatedCount} updated.`,
          type: "bulk_update",
          businessId,
          read: false,
          timestamp: serverTimestamp(),
        });
      }

      // Set upload summary
      setUploadSummary({
        total: totalItems,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
      });

      toast({
        title: "Upload Complete",
        description: `Processed ${totalItems} items: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`,
      });
    } catch (error) {
      console.error("Error processing upload:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setShowPreview(false);
    }
  };

  // Reset the file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFile(null);
    setErrors([]);
    setWarnings([]);
    setParsedData([]);
    setMappedFields({});
    setUploadSummary(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>CSV Inventory Upload</span>
          <Button variant="outline" size="sm" onClick={() => setShowTemplate(true)}>
            View Template
          </Button>
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk update your inventory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <div className="flex gap-2">
            <Input
                id="csv-file"
              type="file"
              accept=".csv"
                ref={fileInputRef}
              onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button variant="outline" size="icon" onClick={resetFileInput}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* <div className="flex justify-between text-sm text-muted-foreground">
              <p>
                File must be in CSV format with headers. Required fields: name,
                price, quantity, category.
              </p>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={downloadTemplate}>
                Download Template
              </Button>
            </div> */}
          </div>

          {/* File Info */}
          {file && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {parsedData.length > 0 && (
                <Badge variant="outline">{parsedData.length} items</Badge>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Upload Summary */}
          {uploadSummary && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Upload Complete</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  <p className="text-sm">
                    Total items processed:{" "}
                    <span className="font-medium">{uploadSummary.total}</span>
                  </p>
                  <p className="text-sm">
                    New products created:{" "}
                    <span className="font-medium">{uploadSummary.created}</span>
                  </p>
                  <p className="text-sm">
                    Existing products updated:{" "}
                    <span className="font-medium">{uploadSummary.updated}</span>
                  </p>
                  {uploadSummary.errors > 0 && (
                    <p className="text-sm text-red-500">
                      Errors encountered:{" "}
                      <span className="font-medium">
                        {uploadSummary.errors}
                      </span>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={() => setShowPreview(true)}
          disabled={parsedData.length === 0 || errors.length > 0 || isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload to Inventory
        </Button>
      </CardFooter>

      {/* Template Dialog */}
      <Dialog open={showTemplate} onOpenChange={setShowTemplate}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>CSV Template Format</DialogTitle>
            <DialogDescription>
              Your CSV file should include these columns. Download the template for a ready-to-use example.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {allFields.map(field => (
                    <TableHead key={field} className={requiredFields.includes(field) ? "font-bold" : ""}>
                      {field} {requiredFields.includes(field) && "*"}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Leave empty for new products</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category name</TableCell>
                  <TableCell>19.99</TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>123456789012</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">* Required fields</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplate(false)}>
                Close
              </Button>
              <Button onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
            <DialogTitle>Preview Data</DialogTitle>
              <DialogDescription>
              Review all rows of your data before uploading.
              </DialogDescription>
            </DialogHeader>

          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.values(mappedFields).map((field) => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Object.values(mappedFields).map((field, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {field === "price"
                          ? <CurrencyFormatter value={parseFloat(row[field])} />
                          : row[field]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

            <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button onClick={processUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <span className="mr-2">Uploading...</span>
                  {progress}%
                </>
              ) : (
                "Confirm Upload"
              )}
            </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </Card>
  );
}
