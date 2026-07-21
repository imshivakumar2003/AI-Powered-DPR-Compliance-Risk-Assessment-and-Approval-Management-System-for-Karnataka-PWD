// TOPLINE

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppLayoutWrapper } from "@/components/layout/AppLayoutWrapper";
import { ThemeProvider } from "@/lib/ThemeContext";
import { UserProvider } from "@/lib/UserContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI-Powered DPR Analysis | Karnataka PWD Portal",
  description:
    "AI-powered Detailed Project Report quality assessment and risk prediction platform for the Ministry of Development of North Eastern Region.",
  keywords: "Karnataka PWD, DPR, AI assessment, North East India, project management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <UserProvider>
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
