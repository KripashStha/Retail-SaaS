import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { InventoryProvider } from "@/contexts/inventory-context"
import { CurrencyProvider } from "@/contexts/currency-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading experience
  variable: '--font-inter'
})

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.easyinventory.tech'),
  title: 'Easy Inventory',
  description: 'Simplify your inventory management with Easy Inventory - the complete solution for retail stores. Track stock, integrate with POS systems, and make data-driven decisions.',
  keywords: 'inventory management, retail software, stock management, POS system, inventory tracking, small business, retail store management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Easy Inventory',
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.easyinventory.tech/',
    site_name: 'Easy Inventory',
    title: 'Easy Inventory - Simplify Your Inventory Management',
    description: 'Easy Inventory helps retail stores effortlessly track stock, integrate with POS systems, and make data-driven decisions.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Easy Inventory Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Easy Inventory - Simplify Your Inventory Management',
    description: 'Easy Inventory helps retail stores effortlessly track stock, integrate with POS systems, and make data-driven decisions.',
    images: ['/og-image.jpg'],
    creator: '@easyinventory',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: 'cover',
  userScalable: true,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/package.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111827" />
        <meta name="color-scheme" content="dark light" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CurrencyProvider>
            <InventoryProvider>
              {children}
              <Toaster />
            </InventoryProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

