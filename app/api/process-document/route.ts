import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(buffer, 'tur');
  return text;
}

async function extractTextFromURL(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $('p,li').map((_, el) => $(el).text()).get().join('\n');
    return text;
  } catch (e) {
    return `[URL'den metin çekilemedi: ${e}]`;
  }
}

function detectFileType(buffer: Buffer): 'pdf' | 'image' | 'unknown' {
  if (buffer.slice(0, 4).toString() === '%PDF') return 'pdf';
  if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image'; // PNG
  if (buffer.slice(0, 2).toString('hex') === 'ffd8') return 'image'; // JPG
  return 'unknown';
}

function getPrompt(processType: string, text: string): string {
  if (processType === 'contract-analyzer')
    return `Aşağıdaki sözleşmenin en önemli maddelerini ve risklerini madde madde özetle:\n\n${text}`;
  if (processType === 'meeting-summarizer')
    return `Aşağıdaki toplantı notlarını kısa ve anlaşılır şekilde özetle:\n\n${text}`;
  if (processType === 'document-summarizer')
    return `Aşağıdaki metni (kitap, makale veya belge) kısa ve öz şekilde özetle:\n\n${text}`;
  if (processType === 'setup-guide-extractor')
    return `Aşağıdaki metinden kullanım veya kurulum adımlarını madde madde çıkar:\n\n${text}`;
  return `Aşağıdaki metni özetle:\n\n${text}`;
}

async function callGeminiLLM(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return '[GOOGLE_API_KEY ortam değişkeni tanımlı değil!]';
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '[LLM cevabı alınamadı]';
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { file_content_base64, url, text_content, process_type } = data;
    let extracted_text = '';
    if (file_content_base64) {
      const buffer = Buffer.from(file_content_base64, 'base64');
      const fileType = detectFileType(buffer);
      if (fileType === 'pdf') {
        extracted_text = await extractTextFromPDF(buffer);
      } else if (fileType === 'image') {
        extracted_text = await extractTextFromImage(buffer);
      } else {
        extracted_text = '[Desteklenmeyen dosya türü veya metin çıkarılamadı.]';
      }
    } else if (url) {
      extracted_text = await extractTextFromURL(url);
    } else if (text_content) {
      extracted_text = text_content;
    } else {
      return NextResponse.json({ error: 'Geçerli bir giriş bulunamadı.' }, { status: 400 });
    }
    const prompt = getPrompt(process_type, extracted_text);
    const llm_result = await callGeminiLLM(prompt);
    return NextResponse.json({ extracted_text, llm_result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 