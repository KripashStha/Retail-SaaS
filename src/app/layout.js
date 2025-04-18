import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { InventoryProvider } from "@/contexts/inventory-context"
import { CurrencyProvider } from "@/contexts/currency-context"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Easy Inventory',
  description: 'Simplify your inventory management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/package.svg" />
      </head>
      <body className={inter.className}>
        <CurrencyProvider>
          <InventoryProvider>
            {children}
            <Toaster />
          </InventoryProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}

