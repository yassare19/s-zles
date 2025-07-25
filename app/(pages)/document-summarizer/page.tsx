import React, { useState } from "react";
import UploaderComponent from "../../components/UploaderComponent";

export default function DocumentSummarizerPage() {
  const [result, setResult] = useState<any>(null);
  return (
    <div>
      <h2>Belge Özeti</h2>
      <p>Kitap, makale veya belge yükleyin, bağlantı veya metin girin. Yapay zeka özetlesin.</p>
      <UploaderComponent processType="document-summarizer" onResult={setResult} />
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