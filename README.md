[![Backend CI (QA Automation)](https://github.com/jasenalfatamaa/image_processing/actions/workflows/ci-backend.yml/badge.svg?branch=main)](https://github.com/jasenalfatamaa/image_processing/actions/workflows/ci-backend.yml)

# 📸 Image Processing System with FastAPI & Celery

![Build Status](https://img.shields.io/github/actions/workflow/status/jasenalfatamaa/image_processing/ci-backend.yml?branch=main&style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

Sistem pengolahan gambar asinkron yang tangguh menggunakan **FastAPI**, **Celery**, dan **Redis**. Proyek ini mendemonstrasikan implementasi *background tasks*, Docker orchestration, dan otomatisasi pengujian (QA Automation).

## 🚀 Fitur Utama
- **Asynchronous Processing**: Upload gambar dan biarkan sistem memprosesnya di background tanpa memblokir API.
- **Dockerized**: Seluruh stack (Frontend, Backend, Worker, Redis) sudah dikontainerisasi.
- **QA Automation**: Dilengkapi dengan Unit Testing otomatis menggunakan `pytest` dan GitHub Actions.
- **Modern Tech Stack**: React (Frontend), FastAPI (Backend), dan Celery (Task Queue).

## 🏗️ Arsitektur Sistem
```mermaid
graph TD
    User((User/Browser)) -->|Upload Image| React[React Frontend]
    React -->|API Request| FastAPI[FastAPI Backend]
    FastAPI -->|Push Task| Redis{Redis Broker}
    Redis -->|Pull Task| Worker[Celery Worker]
    Worker -->|Process Image| Storage[(Local Storage/Output)]
    Worker -->|Update Status| Redis
```

## 🛠️ Instalasi & Penggunaan Lokal

### Prasyarat
- Docker & Docker Compose

### 🔑 Konfigurasi Environment (.env)
Buat file bernama `.env` di dalam folder `backend/` dan masukkan konfigurasi berikut untuk dijalankan di lokal:

```env
REDIS_URL=redis://localhost:6379
BACKEND_PORT:8000
```

### Langkah-langkah
1. Clone repository ini:
   ```bash
   git clone [https://github.com/jasenalfatamaa/image_processing.git](https://github.com/jasenalfatamaa/image_processing.git)
   cd image_processing
2. Jalankan aplikasi menggunakan Docker Compose:
   ```bash
   docker-compose up --build
3. Akses aplikasi:
   Frontend: http://localhost:3000
   Backend: http://localhost:8000