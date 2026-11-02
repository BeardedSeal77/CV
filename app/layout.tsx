import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getSite } from "@/lib/content"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  const title = `${site.name} | ${site.title}`
  const description = `${site.name}: ${site.tagline}. Experience, projects, skills and CV.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
