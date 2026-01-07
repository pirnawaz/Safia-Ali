import type { Metadata } from "next"
import { Inter, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Safia Ali - Boutique ERP & POS",
  description: "Luxury made-to-order fashion boutique management system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-PK">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

