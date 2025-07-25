import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Ücretsiz Akıllı Metin İşleme Platformu</h1>
      <p>Yapay zeka destekli özetleme ve analiz araçlarıyla belgelerinizi kolayca işleyin.</p>
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link href="/contract-analyzer">Sözleşme Analiz</Link>
        <Link href="/meeting-summarizer">Toplantı Notu Özeti</Link>
        <Link href="/document-summarizer">Belge Özeti</Link>
        <Link href="/setup-guide-extractor">Kurulum Klavuzu</Link>
      </div>
    </div>
  );
} 