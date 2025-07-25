import React from "react";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f7f7f7' }}>
        <nav style={{ background: '#222', color: '#fff', padding: '1rem', display: 'flex', gap: '2rem' }}>
          <Link href="/contract-analyzer" style={{ color: '#fff', textDecoration: 'none' }}>Sözleşme Analiz</Link>
          <Link href="/meeting-summarizer" style={{ color: '#fff', textDecoration: 'none' }}>Toplantı Notu Özeti</Link>
          <Link href="/document-summarizer" style={{ color: '#fff', textDecoration: 'none' }}>Belge Özeti</Link>
          <Link href="/setup-guide-extractor" style={{ color: '#fff', textDecoration: 'none' }}>Kurulum Klavuzu</Link>
        </nav>
        <main style={{ maxWidth: 800, margin: '2rem auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 32 }}>
          {children}
        </main>
      </body>
    </html>
  );
} 