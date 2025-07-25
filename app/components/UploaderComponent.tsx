"use client";
import React, { useState } from "react";

interface Props {
  processType: string;
  onResult: (result: any) => void;
}

export default function UploaderComponent({ processType, onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUrl("");
      setText("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let payload: any = { process_type: processType };
    try {
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          payload.file_content_base64 = base64;
          await sendRequest(payload);
        };
        reader.readAsDataURL(file);
        return;
      } else if (url) {
        payload.url = url;
        await sendRequest(payload);
        return;
      } else if (text) {
        payload.text_content = text;
        await sendRequest(payload);
        return;
      } else {
        setError("Lütfen bir dosya, bağlantı veya metin girin.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError("Bir hata oluştu: " + err.message);
      setLoading(false);
    }
  };

  const sendRequest = async (payload: any) => {
    try {
      const res = await fetch("/api/process-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");
      onResult(data);
    } catch (err: any) {
      setError("API hatası: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label>
        Dosya Yükle (PDF, Görsel, TXT):
        <input type="file" accept=".pdf,image/*,.txt" onChange={handleFileChange} />
      </label>
      <label>
        veya Link:
        <input type="url" value={url} onChange={e => { setUrl(e.target.value); setFile(null); setText(""); }} placeholder="https://..." />
      </label>
      <label>
        veya Metin:
        <textarea value={text} onChange={e => { setText(e.target.value); setFile(null); setUrl(""); }} rows={4} placeholder="Metni buraya yapıştırın..." />
      </label>
      <button type="submit" disabled={loading}>{loading ? "Yükleniyor..." : "Gönder"}</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
} 