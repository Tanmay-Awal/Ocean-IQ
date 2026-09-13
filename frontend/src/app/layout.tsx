import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OceanIQ • AI-Powered Oceanographic Telemetry & Analytics Platform",
  description: "Autonomous ARGO float profile telemetry, thermodynamic Mixed Layer Depth calculations, 3D bathymetric mapping, and conversational scientific AI intelligence.",
  keywords: ["ARGO float", "Oceanography", "Marine Science", "Telemetry", "Mixed Layer Depth", "Thermocline", "CTD profiles", "Plotly", "PostGIS", "AI Ocean Analytics"],
  icons: {
    icon: "/icon.svg",
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('oceaniq_theme_mode');
                if (savedTheme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-ocean-cyan/20 selection:text-ocean-cyan">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
