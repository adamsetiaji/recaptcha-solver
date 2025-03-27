# Panduan Instalasi reCAPTCHA Solver API

Berikut adalah panduan lengkap untuk menginstal dan menjalankan reCAPTCHA Solver API pada sistem Windows dan Linux.

> **Catatan Penting**: Sebelum menjalankan aplikasi, Anda perlu membuat file `.env` untuk konfigurasi aplikasi.

## Prasyarat

Pastikan Anda telah menginstal Python 3.8 atau versi yang lebih baru.

## Instalasi pada Windows

### 1. Instalasi Python (jika belum terinstal)

1. Unduh Python dari [python.org](https://www.python.org/downloads/)
2. Jalankan installer dan pastikan untuk mencentang "Add Python to PATH"
3. Klik "Install Now"

### 2. Instalasi Playwright dan dependensi

1. Buat folder untuk proyek Anda dan simpan file `recaptcha_solver.py` yang telah Anda buat
2. Buka Command Prompt (cmd) sebagai Administrator
3. Navigasi ke folder proyek Anda:
   ```
   cd path\to\your\project
   ```
4. Buat dan aktifkan virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
5. Instal paket yang diperlukan:
   ```
   pip install flask flask-cors playwright python-dotenv
   ```
6. Instal browser Playwright:
   ```
   python -m playwright install chromium
   ```

### 3. Jalankan Aplikasi

```
python recaptcha_solver.py
```

Server akan berjalan di http://localhost:6000

## Instalasi pada Linux (Ubuntu/Debian)

### 1. Instalasi Python dan dependensi sistem

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libxcb1 libxkbcommon0 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libatspi2.0-0
```

### 2. Instalasi dan konfigurasi proyek

1. Buat folder untuk proyek Anda:
   ```bash
   mkdir recaptcha_solver
   cd recaptcha_solver
   ```

2. Simpan file `recaptcha_solver.py` ke folder proyek

3. Buat dan aktifkan virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

4. Instal paket yang diperlukan:
   ```bash
   pip install flask flask-cors playwright python-dotenv
   ```
   
5. Buat file `.env` di folder proyek:
   ```bash
   # Salin contoh .env
   cp contoh-env.txt .env
   # Edit file .env sesuai kebutuhan
   nano .env
   ```

6. Instal browser Playwright:
   ```bash
   python -m playwright install chromium
   ```

### 3. Jalankan Aplikasi

```bash
python recaptcha_solver.py
```

Server akan berjalan di http://localhost:6000

## Jalankan sebagai layanan pada Linux

Untuk menjalankan aplikasi sebagai layanan di latar belakang pada Linux, Anda dapat menggunakan systemd:

1. Buat file systemd:
   ```bash
   sudo nano /etc/systemd/system/recaptcha-solver.service
   ```

2. Isi dengan konfigurasi berikut (sesuaikan path):
   ```
   [Unit]
   Description=reCAPTCHA Solver API
   After=network.target

   [Service]
   User=your_username
   WorkingDirectory=/path/to/recaptcha_solver
   Environment="PATH=/path/to/recaptcha_solver/venv/bin"
   ExecStart=/path/to/recaptcha_solver/venv/bin/python recaptcha_solver.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. Aktifkan layanan:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable recaptcha-solver
   sudo systemctl start recaptcha-solver
   ```

4. Cek status layanan:
   ```bash
   sudo systemctl status recaptcha-solver
   ```

## Menggunakan Docker (Opsional)

Jika Anda lebih suka menggunakan Docker, berikut adalah `Dockerfile` yang dapat digunakan:

1. Buat file `Dockerfile`:
```Dockerfile
FROM python:3.10-slim

# Install dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium

COPY recaptcha_solver.py .

EXPOSE 6000

CMD ["python", "recaptcha_solver.py"]
```

2. Buat file `requirements.txt`:
```
flask
flask-cors
playwright
python-dotenv
```

3. Build dan jalankan Docker:
```bash
docker build -t recaptcha-solver .
docker run -p 6000:6000 recaptcha-solver
```

## Penggunaan API

### 1. Membuat Task (menggunakan URL dan sitekey dari file .env)
```
POST /createTask
{
    "clientKey": "123456789"
}
```
Endpoint ini akan menggunakan URL dan sitekey yang telah dikonfigurasi di file `.env`.

### 2. Membuat Task dengan URL dan Sitekey
```
POST /createTaskUrl
{
    "clientKey": "123456789",
    "url": "https://www.example.com/recaptcha-page",
    "sitekey": "YOUR_RECAPTCHA_SITE_KEY"
}
```

### 3. Mendapatkan Hasil Task
```
POST /getTaskResult
{
    "clientKey": "123456789",
    "taskId": "uuid-task-id"
}
```

### 4. Memeriksa Status Server
```
GET /health
```

### 5. Melihat Browser yang Sedang Berjalan
```
GET /displayBrowser/{taskId}
```

## Konfigurasi File .env

File `.env` berisi konfigurasi penting untuk aplikasi. Berikut contoh isinya:

```
# Port server (default: 6000)
PORT=6000

# API Key yang valid
VALID_API_KEYS=123456789,abcdefghi

# Default reCAPTCHA URL dan Sitekey untuk endpoint /createTask
DEFAULT_RECAPTCHA_URL=https://www.google.com/recaptcha/api2/demo
DEFAULT_RECAPTCHA_SITEKEY=6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-

# Pengaturan mode browser (true/false)
DEFAULT_HEADLESS=false

# Pengaturan antrian
MAX_PARALLEL_TASKS=5

# Pengaturan timeout dan retry (dalam milidetik)
RETRY_COUNT=3
RETRY_DELAY=5000
```

Pastikan untuk mengatur `DEFAULT_RECAPTCHA_URL` dan `DEFAULT_RECAPTCHA_SITEKEY` dengan nilai yang sesuai jika Anda ingin menggunakan endpoint `/createTask`.

## Troubleshooting

### Browser tidak muncul pada mode headful
- Pada Linux, pastikan variabel DISPLAY tersedia:
  ```bash
  export DISPLAY=:0
  ```
- Pada Windows, pastikan Anda menjalankan dengan hak akses Administrator jika browser tidak muncul
- Pastikan X server (pada Linux) atau session desktop (pada Windows) tersedia

### Kesalahan "Connection refused"
- Periksa apakah port 6000 sudah digunakan oleh aplikasi lain
- Coba gunakan port berbeda dengan mengubah variabel PORT di kode atau menyetel variabel lingkungan:
  ```
  export PORT=6001
  ```

### Masalah dengan reCAPTCHA
- Pastikan Anda memiliki URL dan sitekey yang valid
- Coba tambahkan delay yang lebih lama jika terjadi kegagalan
- Periksa log untuk informasi kesalahan yang lebih rinci