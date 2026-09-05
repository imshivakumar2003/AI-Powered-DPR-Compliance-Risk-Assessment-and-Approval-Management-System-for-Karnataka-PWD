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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (!saved) {
                    var m = document.cookie.match(/(?:^|;\\s*)portal_theme=([^;]*)/);
                    if (m) saved = m[1];
                  }
                  var effective = saved;
                  if (!effective || effective === 'system') {
                    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  var root = document.documentElement;
                  root.setAttribute('data-theme', effective);
                  if (effective === 'dark') {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
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
