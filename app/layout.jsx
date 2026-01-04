import React from "react";
import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export const metadata = {
  title: "TapTap Matrix - Music For The Future",
  description: "The ultimate music platform with AI discovery, social features, and Music For The Future collection",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TapTap Matrix"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "TapTap Matrix",
    "application-name": "TapTap Matrix",
    "msapplication-TileColor": "#14b8a6"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#14b8a6"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="matrix-theme">
      <body className="relative bg-black text-white overflow-hidden matrix-body">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
