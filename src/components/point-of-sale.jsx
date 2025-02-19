"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PointOfSale() {
  const [barcode, setBarcode] = useState("")
  const [quantity, setQuantity] = useState(1)

  const handleScan = () => {
    // Implement barcode scanning logic here
    console.log(`Scanned item: ${barcode}, Quantity: ${quantity}`)
    setBarcode("")
    setQuantity(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Point of Sale</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              placeholder="Scan or enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min={1}
            />
          </div>
          <Button onClick={handleScan}>Scan Item</Button>
        </div>
      </CardContent>
    </Card>
  )
}

 