# server.py
import os
import io
import json
import hashlib
import sqlite3
import uuid
from datetime import datetime
from typing import List

import requests
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

# CONFIG
STORAGE_DIR = os.environ.get("STORAGE_DIR", "storage")
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
WEATHER_PROVIDER = os.environ.get("WEATHER_PROVIDER", "open-meteo")  # currently use Open-Meteo
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "pdfs"), exist_ok=True)

# Simple SQLite DB for demo
DB_PATH = os.path.join(STORAGE_DIR, "claims.db")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = conn.cursor()
cur.execute(
    """CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        data TEXT,
        pdf_path TEXT,
        pdf_hash TEXT,
        created_at TEXT
    )"""
)
conn.commit()

app = FastAPI(title="FarmSure Prototype API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------- Helpers --------
def save_uploaded_files(files: List[UploadFile], claim_id: str) -> List[str]:
    saved_paths = []
    for f in files:
        filename = f"{claim_id}_{uuid.uuid4().hex}_{os.path.basename(f.filename)}"
        out_path = os.path.join(STORAGE_DIR, "images", filename)
        with open(out_path, "wb") as out_f:
            out_f.write(f.file.read())
        saved_paths.append(out_path)
    return saved_paths


def fetch_open_meteo(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """
    Calls Open-Meteo archive endpoint to get daily rainfall/temps for date range.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "rain_sum,temperature_2m_max,temperature_2m_min",
        "timezone": "UTC",
    }
    resp = requests.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=20)
    resp.raise_for_status()
    print("Fetched weather data:", resp)
    return resp.json()

def summarize_weather_data(weather_data: dict) -> dict:
    """
    Take full Open-Meteo response and extract summarized values
    like total rainfall and average temperatures.
    """
    try:
        daily = weather_data.get("daily", {})
        rain_sum = daily.get("rain_sum", [])
        tmax = daily.get("temperature_2m_max", [])
        tmin = daily.get("temperature_2m_min", [])

        # Compute summary values
        rain_sum_total = round(sum(rain_sum), 2) if rain_sum else 0
        tmax_avg = round(sum(tmax) / len(tmax), 2) if tmax else None
        tmin_avg = round(sum(tmin) / len(tmin), 2) if tmin else None

        return {
            "provider": "open-meteo",
            "rain_sum_total": rain_sum_total,
            "tmax_avg": tmax_avg,
            "tmin_avg": tmin_avg,
            "raw": weather_data,
        }
    except Exception as e:
        return {"error": str(e)}



def fetch_satellite_image(lat: float, lon: float, zoom: int = 20, size: str = "640x400") -> bytes:
    """
    Fetch a static satellite image. Default: Google Static Maps.
    Set GOOGLE_MAPS_API_KEY in env to use; otherwise returns an empty image.
    """
    if not GOOGLE_MAPS_API_KEY:
        # Return a placeholder blank image bytes
        im = Image.new("RGB", (640, 400), (230, 230, 230))
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        return buf.getvalue()

    url = (
        f"https://maps.googleapis.com/maps/api/staticmap"
        f"?center={lat},{lon}&zoom={zoom}&size={size}&maptype=satellite&key={GOOGLE_MAPS_API_KEY}"
    )
    print("Fetching satellite:", url)

    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.content


def generate_pdf(claim_data: dict, uploaded_image_paths: List[str], satellite_bytes: bytes, out_pdf_path: str) -> str:
    """
    Generate a professional, structured claim PDF report.
    """
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    width, height = A4

    # --- Colors and styling ---
    from reportlab.lib import colors

    def draw_section_header(y, title):
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.rect(40, y - 16, width - 80, 22, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, y - 10, title)
        c.setFillColor(colors.black)

    def draw_line(y):
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.setLineWidth(0.5)
        c.line(40, y, width - 40, y)

    # --- Header ---
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height - 60, "FarmSure – Crop Damage Claim Report")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.gray)
    c.drawString(40, height - 78, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    c.setFillColor(colors.black)
    draw_line(height - 84)

    # --- Claim & Farmer Details ---
    y = height - 110
    draw_section_header(y + 10, "Farmer & Claim Details")
    y -= 25
    c.setFont("Helvetica", 10)
    fields = [
        ("Claim ID", claim_data.get("id", "-")),
        ("Farmer Name", claim_data.get("name", "-")),
        ("Aadhaar", claim_data.get("aadhaar", "-")),
        ("Phone", claim_data.get("phone", "-")),
        ("Email", claim_data.get("email", "-")),
        ("Farm Location", claim_data.get("farmLocation", "-")),
        ("Farm Size", claim_data.get("farmSize", "-")),
        ("Crop Type", claim_data.get("cropType", "-")),
        ("Damage Description", claim_data.get("damageDescription", "-")),
        ("Date Range", f"{claim_data.get('dateFrom', '-')} to {claim_data.get('dateTo', '-')}"),
        ("Reported Rainfall", claim_data.get("rainfallRange", "-")),
    ]

    for label, value in fields:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, f"{label}:")
        c.setFont("Helvetica", 10)
        c.drawString(170, y, str(value))
        y -= 14
        if y < 120:
            c.showPage()
            y = height - 60

    y -= 10
    draw_line(y)
    y -= 25

    # --- Weather Verification Section ---
    draw_section_header(y + 10, "Weather Verification (Open-Meteo Data)")
    y -= 25

    raw_weather = fetch_open_meteo(26.008762, 84.454766, "2022-01-01", "2022-06-30")
    weather_summary = summarize_weather_data(raw_weather)
    print("Weather summary for PDF:", weather_summary)
    claim_data["weather_summary"] = weather_summary

    weather_summary = claim_data.get("weather_summary", {})
    if weather_summary and not weather_summary.get("error"):
        rain_total = weather_summary.get("rain_sum_total", "N/A")
        tmax = weather_summary.get("tmax_avg", "N/A")
        tmin = weather_summary.get("tmin_avg", "N/A")

        c.drawString(50, y, f"Total Rainfall: {rain_total} mm")
        y -= 14
        c.drawString(50, y, f"Average Max Temp: {tmax} °C")
        y -= 14
        c.drawString(50, y, f"Average Min Temp: {tmin} °C")
        y -= 20
    else:
        c.setFillColor(colors.red)
        c.drawString(50, y, f"Weather data unavailable or fetch error: {weather_summary.get('error', 'N/A')}")
        c.setFillColor(colors.black)
        y -= 20

    draw_line(y)
    y -= 25

    # --- Satellite Image ---
    draw_section_header(y + 10, "Satellite Imagery (Location Overview)")
    y -= 260
    try:
        sat_img = Image.open(io.BytesIO(satellite_bytes))
        # upscale satellite image for better clarity
        sat_img = sat_img.resize((640, 400))
        c.drawImage(ImageReader(sat_img), 40, y, width=520, height=250, preserveAspectRatio=True, anchor='sw')
        y -= 30
    except Exception:
        c.setFillColor(colors.red)
        c.drawString(50, y, "Satellite image unavailable.")
        c.setFillColor(colors.black)
        y -= 20

    draw_line(y)
    y -= 25

    # --- Uploaded Proof Images ---
    draw_section_header(y + 10, "Farmer Submitted Evidence (Images)")
    y -= 20
    x = 50
    img_size = 150
    spacing = 20

    for i, img_path in enumerate(uploaded_image_paths):
        try:
            img = Image.open(img_path)
            img.thumbnail((img_size, img_size))
            c.drawImage(ImageReader(img), x, y - img_size, width=img_size, height=img_size)
            x += img_size + spacing
            if x + img_size > width - 40:
                x = 50
                y -= img_size + 30
                if y < 100:
                    c.showPage()
                    y = height - 100
        except Exception:
            continue

    # --- Footer ---
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.gray)
    c.drawCentredString(width / 2, 40, "This is a digitally generated document by FarmSure System.")
    c.setFillColor(colors.black)

    c.save()
    packet.seek(0)
    pdf_data = packet.getvalue()
    with open(out_pdf_path, "wb") as f:
        f.write(pdf_data)
    return out_pdf_path



def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# --------- API endpoints ----------

@app.post("/api/claims")
def submit_claim(
    name: str = Form(...),
    aadhaar: str = Form(...),
    phone: str = Form(...),
    email: str = Form(""),
    farmLocation: str = Form(...),
    farmSize: str = Form(""),
    cropType: str = Form(...),
    damageDescription: str = Form(...),
    dateFrom: str = Form(...),  # YYYY-MM-DD
    dateTo: str = Form(...),  # YYYY-MM-DD
    rainfallRange: str = Form(""),
    files: List[UploadFile] = File([]),
):
    # basic validation
    try:
        lat_str, lon_str = farmLocation.split(",")
        lat, lon = float(lat_str.strip()), float(lon_str.strip())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid farmLocation. Use 'lat, lon'")

    claim_id = uuid.uuid4().hex
    claim = {
        "id": claim_id,
        "name": name,
        "aadhaar": aadhaar,
        "phone": phone,
        "email": email,
        "farmLocation": farmLocation,
        "farmSize": farmSize,
        "cropType": cropType,
        "damageDescription": damageDescription,
        "dateFrom": dateFrom,
        "dateTo": dateTo,
        "rainfallRange": rainfallRange,
    }

    # 1) Save uploaded files locally
    saved_paths = save_uploaded_files(files, claim_id)

    # 2) Fetch weather data (Open-Meteo)
    try:
        wm = fetch_open_meteo(lat, lon, dateFrom, dateTo)
        # Build a summary: sum of rain_sum and average temps
        daily = wm.get("daily", {})
        rain_list = daily.get("rain_sum", []) or []
        tmax_list = daily.get("temperature_2m_max", []) or []
        tmin_list = daily.get("temperature_2m_min", []) or []
        rain_total = sum(rain_list) if rain_list else None
        tmax_avg = round(sum(tmax_list) / len(tmax_list), 2) if tmax_list else None
        tmin_avg = round(sum(tmin_list) / len(tmin_list), 2) if tmin_list else None

        weather_summary = {
            "provider": "open-meteo",
            "rain_sum_total": rain_total,
            "tmax_avg": tmax_avg,
            "tmin_avg": tmin_avg,
            "raw": wm,
        }
    except Exception as e:
        weather_summary = {"error": str(e)}

    claim["weather_summary"] = weather_summary

    # 3) Fetch satellite image
    try:
        sat_bytes = fetch_satellite_image(lat, lon)
        # Save satellite image for record
        sat_name = f"{claim_id}_sat.png"
        sat_path = os.path.join(STORAGE_DIR, "images", sat_name)
        with open(sat_path, "wb") as f:
            f.write(sat_bytes)
        saved_paths.append(sat_path)
    except Exception as e:
        sat_bytes = b""
        print("satellite fetch failed", e)

    # 4) Generate PDF
    out_pdf_path = os.path.join(STORAGE_DIR, "pdfs", f"{claim_id}.pdf")
    try:
        generate_pdf(claim, saved_paths, sat_bytes, out_pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    # 5) Compute SHA256 of PDF (tamper proof fingerprint)
    pdf_hash = sha256_file(out_pdf_path)

    # 6) Save claim to DB
    cur.execute(
        "INSERT INTO claims (id, data, pdf_path, pdf_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (claim_id, json.dumps(claim), out_pdf_path, pdf_hash, datetime.utcnow().isoformat()),
    )
    conn.commit()

    return JSONResponse(
        {
            "claim_id": claim_id,
            "pdf": f"/api/claims/{claim_id}/pdf",
            "pdf_hash": pdf_hash,
            "saved_images": saved_paths,
            "weather_summary": weather_summary,
        }
    )


@app.get("/api/claims/{claim_id}/pdf")
def get_pdf(claim_id: str):
    cur.execute("SELECT pdf_path FROM claims WHERE id = ?", (claim_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Claim not found")
    path = row[0]
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(path, media_type="application/pdf", filename=os.path.basename(path))


@app.get("/api/claims/{claim_id}")
def get_claim(claim_id: str):
    cur.execute("SELECT data, pdf_path, pdf_hash, created_at FROM claims WHERE id = ?", (claim_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Claim not found")
    data = json.loads(row[0])
    return {"data": data, "pdf_path": row[1], "pdf_hash": row[2], "created_at": row[3]}


@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

