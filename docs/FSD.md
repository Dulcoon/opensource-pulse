# OpenSource Pulse

> AI-Powered Open Source Intelligence Platform

---

# Document Information

| Field         | Value                             |
| ------------- | --------------------------------- |
| Document Type | Functional Specification Document |
| Version       | 1.0                               |
| Status        | Approved                          |
| Project       | OpenSource Pulse                  |

---

# 1. Project Overview

OpenSource Pulse adalah platform yang membantu developer memahami perkembangan teknologi dan open source secara otomatis menggunakan data analytics dan Artificial Intelligence.

Platform mengumpulkan data dari GitHub secara berkala, memproses data tersebut menjadi insight yang mudah dipahami, kemudian menyajikannya melalui dashboard web dan Telegram.

Tujuan utama platform:

* Mengetahui teknologi yang sedang naik daun
* Menemukan repository berkualitas lebih cepat
* Memahami fungsi repository tanpa membaca README panjang
* Mendapatkan insight teknologi berbasis data
* Mengikuti perkembangan open source secara otomatis

---

# 2. User Roles

## Public User

Dapat:

* Melihat Dashboard
* Melihat Trending Repositories
* Membaca AI Summary
* Mengakses Tech Radar
* Membaca Weekly Reports
* Mengakses Analytics

Tidak memerlukan akun.

---

## Administrator

Dapat:

* Menjalankan sinkronisasi data
* Melihat status background jobs
* Memicu report generation
* Mengelola Telegram Digest

---

# 3. Data Sources

## GitHub API

Digunakan untuk mengambil:

* Repository Information
* Stars
* Forks
* Issues
* Pull Requests
* Contributors
* Topics
* Programming Languages
* Releases

---

## Future Integrations

* Hacker News
* Reddit Programming
* Reddit Artificial Intelligence
* Dev.to
* GitLab Trending

---

# 4. Functional Requirements

# Feature 1 – Dashboard Overview

## Description

Dashboard Overview merupakan halaman utama aplikasi yang menampilkan ringkasan kondisi ekosistem open source saat ini.

Halaman ini menjadi halaman pertama yang diakses pengguna ketika membuka platform.

---

## User Flow

1. Pengguna membuka Dashboard.
2. Sistem mengambil data dashboard terbaru.
3. Sistem menampilkan statistik dan insight.
4. Pengguna dapat membuka halaman detail dari setiap widget.

---

## Display Components

### Hot Technologies

Menampilkan maksimal 5 teknologi dengan pertumbuhan tertinggi.

Data yang ditampilkan:

* Technology Name
* Trend Status
* Growth Percentage

Contoh:

* AI Agents | Exploding | +42%
* MCP | Rising | +28%

---

### Fastest Growing Repository

Menampilkan repository dengan pertumbuhan stars terbesar.

Data yang ditampilkan:

* Repository Name
* Owner
* Current Stars
* Growth Percentage

Actions:

* Open Repository Detail

---

### Emerging Technologies

Menampilkan teknologi yang baru muncul dan mengalami peningkatan signifikan.

Data yang ditampilkan:

* Technology Name
* Growth Percentage
* Related Repository Count

---

### Weekly Statistics

Menampilkan:

* Total Repository Analyzed
* Total Stars Added
* Total Active Languages
* Total Active Technologies

---

### Weekly Insight

Insight otomatis yang dihasilkan AI.

Contoh:

"AI Agents mendominasi repository trending selama dua minggu terakhir."

---

## Acceptance Criteria

* Dashboard load time kurang dari 3 detik.
* Data diperbarui minimal setiap 6 jam.
* Tidak memerlukan login.
* Repository dapat dibuka dari widget.
* Insight AI minimal satu paragraf.

---

# Feature 2 – GitHub Trending Intelligence

## Description

Menampilkan repository yang sedang trending berdasarkan data historis yang dikumpulkan sistem.

---

## User Flow

1. Pengguna membuka halaman Repositories.
2. Sistem menampilkan daftar repository.
3. Pengguna melakukan pencarian.
4. Pengguna menerapkan filter.
5. Sistem memperbarui daftar hasil.
6. Pengguna membuka halaman detail repository.

---

## Search

Pengguna dapat mencari berdasarkan:

* Repository Name
* Owner Name
* Topic

---

## Filters

### Language

* All
* Python
* JavaScript
* TypeScript
* Go
* Rust
* Java
* PHP

### Category

* AI
* Agent
* Mobile
* Web
* DevOps
* Data Science

### Time Range

* 7 Days
* 14 Days
* 30 Days
* 90 Days

---

## Repository Card

Data yang ditampilkan:

* Repository Name
* Owner
* Description
* Stars
* Forks
* Issues
* Primary Language
* Growth Percentage
* Health Score
* AI Summary

---

## User Actions

* Search Repository
* Apply Filters
* Open Repository Detail

---

## Acceptance Criteria

* Search berfungsi berdasarkan nama repository.
* Filter dapat digunakan secara bersamaan.
* Data diperbarui sesuai filter.
* Detail repository dapat diakses dari card.

---

# Feature 3 – AI Summary Engine

## Description

Menampilkan hasil analisis AI terhadap repository.

---

## User Flow

1. Pengguna membuka halaman detail repository.
2. Sistem memuat AI Summary.
3. Pengguna membaca ringkasan repository.

---

## Information Displayed

### Quick Summary

Penjelasan repository dalam 2–3 kalimat.

---

### Key Features

Minimal 3 fitur utama.

---

### Use Cases

Minimal 3 use cases.

---

### Similar Projects

Repository alternatif yang memiliki fungsi serupa.

Setiap item dapat dibuka.

---

### Difficulty Level

Nilai yang tersedia:

* Beginner
* Intermediate
* Advanced

---

## Acceptance Criteria

* Summary tersedia untuk repository yang sudah diproses.
* Similar Projects dapat dibuka.
* Difficulty Level selalu tersedia.

---

# Feature 4 – Tech Radar

## Description

Menampilkan kondisi tren teknologi berdasarkan pertumbuhan repository.

---

## User Flow

1. Pengguna membuka halaman Tech Radar.
2. Sistem menampilkan ranking teknologi.
3. Pengguna mengurutkan berdasarkan skor.
4. Pengguna membuka detail teknologi.

---

## Information Displayed

* Technology Name
* Radar Status
* Radar Score
* Growth Percentage
* Related Repository Count

---

## Radar Status

### Exploding

Pertumbuhan sangat cepat.

### Rising

Pertumbuhan positif dan stabil.

### Stable

Pertumbuhan normal.

### Declining

Pertumbuhan negatif atau stagnan.

---

## Acceptance Criteria

* Semua teknologi memiliki status radar.
* Dapat diurutkan berdasarkan skor.
* Detail teknologi dapat diakses.

---

# Feature 5 – Repository Health Score

## Description

Menampilkan tingkat kesehatan repository.

---

## User Flow

1. Pengguna membuka detail repository.
2. Sistem menampilkan Health Score.
3. Pengguna melihat rincian skor.

---

## Information Displayed

### Overall Score

0 – 100

---

### Activity Score

* Commit Frequency
* Commit Recency

---

### Maintenance Score

* Release Frequency
* Changelog Updates

---

### Community Score

* Contributors Count
* Fork Count

---

### Issue Score

* Issue Resolution Time
* Open vs Closed Issues

---

### Status Labels

* Excellent
* Good
* Fair
* Poor

---

## Acceptance Criteria

* Semua repository memiliki Health Score.
* Detail penilaian tersedia.
* Status label ditampilkan.

---

# Feature 6 – Trend Analytics

## Description

Menyediakan visualisasi data tren teknologi.

---

## User Flow

1. Pengguna membuka halaman Analytics.
2. Sistem menampilkan grafik tren.
3. Pengguna memilih rentang waktu.
4. Sistem memperbarui grafik.

---

## Display Components

### Language Growth

Pertumbuhan bahasa pemrograman.

---

### Repository Growth

Pertumbuhan stars dan forks.

---

### Technology Trend

Perubahan popularitas topik.

---

### Contributor Trend

Pertumbuhan komunitas.

---

## Time Range

* Weekly
* Monthly
* Quarterly
* Yearly

---

## Acceptance Criteria

* Semua grafik dapat dirender.
* Time Range berfungsi.
* Data historis tersedia.

---

# Feature 7 – Weekly AI Report

## Description

Membuat laporan mingguan yang dapat dibaca manusia.

---

## User Flow

1. Sistem menghasilkan laporan mingguan.
2. Pengguna membuka halaman Reports.
3. Pengguna membaca laporan.

---

## Report Sections

### Top Technologies

Teknologi paling populer.

---

### Biggest Movers

Teknologi dengan pertumbuhan tertinggi.

---

### New Emerging Projects

Repository baru yang layak diperhatikan.

---

### AI Insights

Analisis otomatis dari AI.

---

### Recommendations

Rekomendasi pembelajaran.

---

## User Actions

* View Report
* Export PDF
* Share Report

---

## Acceptance Criteria

* Report tersedia setiap minggu.
* Minimal satu insight AI tersedia.
* Report dapat dibaca tanpa login.

---

# Feature 8 – Daily Digest

## Description

Mengirimkan update harian secara otomatis.

---

## User Flow

1. Sistem membuat digest harian.
2. Sistem mengirim digest ke Telegram.
3. Pengguna membaca digest.

---

## Content

### Top Repositories

Repository terbaik hari ini.

---

### Technology Highlights

Teknologi yang sedang naik.

---

### AI Insight

Ringkasan tren terbaru.

---

## Schedule

* Daily
* Weekly

---

## Acceptance Criteria

* Digest dibuat otomatis.
* Digest dikirim ke Telegram.
* Insight AI tersedia.

---

# Feature 9 – Telegram Bot

## Description

Memberikan akses cepat ke platform melalui Telegram.

---

## User Flow

1. Pengguna mengirim command.
2. Bot memproses request.
3. Bot mengambil data dari API.
4. Bot mengembalikan hasil.

---

## Commands

### /trending

Menampilkan repository trending.

### /languages

Menampilkan bahasa pemrograman populer.

### /radar

Menampilkan Tech Radar.

### /report

Menampilkan laporan terbaru.

### /repo {repository}

Menampilkan:

* AI Summary
* Health Score
* Growth Trend
* Key Metrics

---

## Acceptance Criteria

* Semua command dapat diproses.
* Response kurang dari 5 detik.
* Data sesuai dengan dashboard.

---

# 5. Non Functional Requirements

## Performance

* API Response < 500ms
* Dashboard Load Time < 3s
* Analytics Load Time < 5s

---

## Availability

Target uptime:

99%

---

## Security

* HTTPS Only
* Input Validation
* Rate Limiting
* Environment Secret Management

---

## Scalability

Sistem harus mampu menyimpan histori repository selama bertahun-tahun.

---

# 6. Repository Structure

```text
opensource-pulse/

apps/
├── web/
└── api/

docs/
├── PRD.md
├── FSD.md
├── TDD.md
└── ERD.md

infra/

docker/
```

---

# 7. Frontend Structure

```text
apps/web/

src/

├── app/
├── components/
├── features/
│   ├── dashboard/
│   ├── repositories/
│   ├── radar/
│   ├── analytics/
│   └── reports/
├── services/
├── hooks/
├── store/
├── types/
└── lib/
```

---

# 8. Backend Structure

```text
apps/api/

cmd/

internal/

├── config/
├── database/
├── domain/
├── handlers/
├── services/
├── repositories/
├── workers/
├── scheduler/

├── integrations/
│   ├── github/
│   ├── openrouter/
│   └── telegram/

├── middleware/
└── utils/

pkg/
```

---

# 9. Database Structure

## repositories

Repository utama.

## repository_snapshots

Histori repository.

## repository_summaries

Hasil AI Summary.

## repository_health_scores

Health Score repository.

## technologies

Master teknologi.

## technology_scores

Skor Tech Radar.

## weekly_reports

Laporan mingguan.

## daily_insights

Insight harian.

---

# 10. Background Jobs

## SyncRepositoriesJob

Every 6 Hours

---

## GenerateRepositorySummaryJob

Repository Created

---

## CalculateHealthScoreJob

Daily

---

## GenerateTechRadarJob

Daily

---

## GenerateWeeklyReportJob

Weekly

---

## GenerateDailyDigestJob

Daily

---

# 11. MVP Scope

Included:

* Dashboard Overview
* GitHub Trending Intelligence
* AI Summary Engine
* Repository Health Score
* Tech Radar
* Weekly AI Report
* Telegram Digest

Excluded:

* Advanced Analytics
* Full Telegram Bot
* Reddit Integration
* Hacker News Integration
* GitLab Integration
