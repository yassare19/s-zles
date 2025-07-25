"use client";
import React, { useState } from "react";
import UploaderComponent from "../../components/UploaderComponent";

export default function ContractAnalyzerPage() {
  const [result, setResult] = useState<any>(null);
  return (
    <div>
      <h2>Sözleşme Analiz</h2>
      <p>Bir sözleşme yükleyin veya bağlantı/metin girin. Yapay zeka en önemli maddeleri ve riskleri özetlesin.</p>
      <UploaderComponent processType="contract-analyzer" onResult={setResult} />
      {result && (
        <div style={{ marginTop: 32 }}>
          <h3>Özet</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result.llm_result}</pre>
          <h4>Çıkarılan Metin</h4>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888' }}>{result.extracted_text}</pre>
        </div>
      )}
    </div>
  );
} 