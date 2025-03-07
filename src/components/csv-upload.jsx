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

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Upload</CardTitle>
        <CardDescription>
          Upload your inventory data using a CSV file
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
    </Card>
  );
}
