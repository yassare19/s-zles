import base64
import os
import tempfile
from fastapi import Request
from fastapi.responses import JSONResponse
from vercel_python import VercelRequest, VercelResponse, VercelFastAPI

# PDF için
import fitz  # PyMuPDF
# Resim için
from PIL import Image
import pytesseract
# Web sayfası için
import requests
from bs4 import BeautifulSoup

# Google Gemini
import google.generativeai as genai

app = VercelFastAPI()

def extract_text_from_pdf(file_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file.flush()
        doc = fitz.open(tmp_file.name)
        text = "\n".join([page.get_text() for page in doc])
        doc.close()
    os.unlink(tmp_file.name)
    return text

def extract_text_from_image(file_bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file.flush()
        image = Image.open(tmp_file.name)
        text = pytesseract.image_to_string(image, lang="tur")
    os.unlink(tmp_file.name)
    return text

def extract_text_from_url(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all(['p', 'li'])
        text = "\n".join([p.get_text() for p in paragraphs])
        return text
    except Exception as e:
        return f"[URL'den metin çekilemedi: {str(e)}]"

def detect_file_type(file_bytes):
    if file_bytes[:4] == b"%PDF":
        return "pdf"
    if file_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "image"
    if file_bytes[:2] == b"\xff\xd8":
        return "image"
    return "unknown"

def get_prompt(process_type, text):
    if process_type == "contract-analyzer":
        return f"Aşağıdaki sözleşmenin en önemli maddelerini ve risklerini madde madde özetle:\n\n{text}"
    elif process_type == "meeting-summarizer":
        return f"Aşağıdaki toplantı notlarını kısa ve anlaşılır şekilde özetle:\n\n{text}"
    elif process_type == "document-summarizer":
        return f"Aşağıdaki metni (kitap, makale veya belge) kısa ve öz şekilde özetle:\n\n{text}"
    elif process_type == "setup-guide-extractor":
        return f"Aşağıdaki metinden kullanım veya kurulum adımlarını madde madde çıkar:\n\n{text}"
    else:
        return f"Aşağıdaki metni özetle:\n\n{text}"

def call_gemini_llm(prompt):
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return "[GOOGLE_API_KEY ortam değişkeni tanımlı değil!]"
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    return response.text if hasattr(response, 'text') else str(response)

@app.post("")
async def process_document(request: Request):
    try:
        data = await request.json()
        file_content_base64 = data.get("file_content_base64")
        url = data.get("url")
        text_content = data.get("text_content")
        process_type = data.get("process_type")

        extracted_text = None
        file_type = None

        if file_content_base64:
            file_bytes = base64.b64decode(file_content_base64)
            file_type = detect_file_type(file_bytes)
            if file_type == "pdf":
                extracted_text = extract_text_from_pdf(file_bytes)
            elif file_type == "image":
                extracted_text = extract_text_from_image(file_bytes)
            else:
                extracted_text = "[Desteklenmeyen dosya türü veya metin çıkarılamadı.]"
        elif url:
            extracted_text = extract_text_from_url(url)
        elif text_content:
            extracted_text = text_content
        else:
            return JSONResponse({"error": "Geçerli bir giriş bulunamadı."}, status_code=400)

        prompt = get_prompt(process_type, extracted_text)
        llm_result = call_gemini_llm(prompt)

        result = {
            "extracted_text": extracted_text,
            "llm_result": llm_result
        }
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500) 