"use client";

import { useState, useRef } from "react";
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

export function CsvUpload() {
  const { businessId } = useInventory();
  
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [mappedFields, setMappedFields] = useState({});
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Required fields for product data
  const requiredFields = ["name", "price", "quantity", "category"];

  // All possible fields
  const allFields = [
    "id",
    "name",
    "description",
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
            <p className="text-sm text-muted-foreground">
              File must be in CSV format with headers. Required fields: name,
              price, quantity, category.
            </p>
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
                          ? `$${parseFloat(row[field]).toFixed(2)}`
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
