import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "QAA Admin Dashboard",
  description: "Qatar Aeronautical Academy - Agent Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-gray-100 min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
