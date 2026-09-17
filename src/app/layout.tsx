import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Processing Tool",
  description: "Utility modular untuk pemrosesan TXT, JSON, dan PDF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-[#f5f7fb] text-[#172033]">
        <header className="bg-gray-900 text-white sticky top-0 z-20 border-b border-gray-700">
          <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between gap-5">
            <Link href="/" className="font-extrabold tracking-tight text-white hover:text-blue-300 transition-colors">
              Data Processing Tool
            </Link>
            <nav className="flex gap-1 flex-wrap">
              <Link href="/txt-to-json" className="px-3 py-1.5 rounded-lg text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors">
                TXT → JSON
              </Link>
              <Link href="/json-to-txt" className="px-3 py-1.5 rounded-lg text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors">
                JSON → TXT
              </Link>
              <Link href="/pdf-preview" className="px-3 py-1.5 rounded-lg text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors">
                PDF Preview
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}