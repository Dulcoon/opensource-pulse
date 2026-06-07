# OpenSource Pulse

> AI-Powered Open Source Intelligence Platform

# Entity Relationship Diagram (ERD)

Version: 1.0
Status: Approved

---

# 1. Overview

Dokumen ini mendefinisikan struktur database OpenSource Pulse beserta relasi antar tabel.

Tujuan desain database:

* Mendukung analytics historis
* Mendukung repository trend tracking
* Mendukung AI generated content
* Mendukung Tech Radar
* Mendukung Weekly Reports
* Mendukung Daily Insights
* Mendukung scalability jangka panjang

Database yang digunakan:

```text
PostgreSQL
```

---

# 2. Entity Relationship Diagram

```text
technologies
    │
    │ 1:N
    ▼
repository_technologies
    ▲
    │ N:1
    │
repositories
    │
    ├──────────────┐
    │              │
    │ 1:N          │ 1:1
    ▼              ▼

repository_snapshots
repository_summaries

    │
    │ 1:1
    ▼

repository_health_scores

    │
    │
    ▼

weekly_reports

daily_insights
```

---

# 3. Tables

# repositories

Master table repository.

Menyimpan informasi utama repository dari GitHub.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

github_id BIGINT UNIQUE NOT NULL

owner VARCHAR(255) NOT NULL

repository_name VARCHAR(255) NOT NULL

full_name VARCHAR(500) NOT NULL

description TEXT

primary_language VARCHAR(100)

stars INTEGER DEFAULT 0

forks INTEGER DEFAULT 0

open_issues INTEGER DEFAULT 0

watchers INTEGER DEFAULT 0

repository_url TEXT

default_branch VARCHAR(100)

last_release_at TIMESTAMP NULL

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Indexes

```sql
INDEX idx_repositories_github_id

INDEX idx_repositories_language

INDEX idx_repositories_stars

INDEX idx_repositories_updated
```

---

# repository_snapshots

Menyimpan histori repository.

Digunakan untuk:

* Trend Analytics
* Growth Calculation
* Tech Radar
* Weekly Report

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

repository_id BIGINT NOT NULL

stars INTEGER

forks INTEGER

open_issues INTEGER

contributors INTEGER

captured_at TIMESTAMP NOT NULL
```

---

## Relationships

```text
repositories (1)
    ↓
repository_snapshots (N)
```

---

## Foreign Keys

```sql
repository_id
REFERENCES repositories(id)
ON DELETE CASCADE
```

---

## Indexes

```sql
INDEX idx_snapshots_repository

INDEX idx_snapshots_date

UNIQUE(repository_id, captured_at)
```

---

# repository_summaries

Menyimpan hasil analisis AI.

Satu repository memiliki satu summary aktif.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

repository_id BIGINT NOT NULL

quick_summary TEXT

key_features JSONB

use_cases JSONB

similar_projects JSONB

difficulty_level VARCHAR(50)

model_name VARCHAR(100)

generated_at TIMESTAMP
```

---

## Relationships

```text
repositories (1)
    ↓
repository_summaries (1)
```

---

## Foreign Keys

```sql
repository_id
REFERENCES repositories(id)
ON DELETE CASCADE
```

---

## Indexes

```sql
UNIQUE(repository_id)
```

---

# repository_health_scores

Menyimpan skor kesehatan repository.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

repository_id BIGINT NOT NULL

overall_score NUMERIC(5,2)

activity_score NUMERIC(5,2)

maintenance_score NUMERIC(5,2)

community_score NUMERIC(5,2)

issue_score NUMERIC(5,2)

status VARCHAR(50)

calculated_at TIMESTAMP
```

---

## Relationships

```text
repositories (1)
    ↓
repository_health_scores (1)
```

---

## Foreign Keys

```sql
repository_id
REFERENCES repositories(id)
ON DELETE CASCADE
```

---

## Indexes

```sql
UNIQUE(repository_id)

INDEX idx_health_score
```

---

# technologies

Master teknologi.

Digunakan untuk:

* AI Agents
* MCP
* LangGraph
* CrewAI
* Rust
* React
* Vue
* Angular

dan teknologi lainnya.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

technology_name VARCHAR(255)

slug VARCHAR(255)

category VARCHAR(100)

description TEXT

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Indexes

```sql
UNIQUE(slug)

INDEX idx_technology_name
```

---

# repository_technologies

Pivot table.

Menghubungkan repository dengan teknologi.

Karena satu repository dapat memiliki banyak teknologi.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

repository_id BIGINT NOT NULL

technology_id BIGINT NOT NULL

created_at TIMESTAMP
```

---

## Relationships

```text
repositories (N)
      ↕
repository_technologies
      ↕
technologies (N)
```

---

## Foreign Keys

```sql
repository_id
REFERENCES repositories(id)
ON DELETE CASCADE

technology_id
REFERENCES technologies(id)
ON DELETE CASCADE
```

---

## Indexes

```sql
UNIQUE(repository_id, technology_id)
```

---

# technology_scores

Menyimpan hasil perhitungan Tech Radar.

Data ini dihasilkan setiap hari.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

technology_id BIGINT NOT NULL

score NUMERIC(10,2)

growth_percentage NUMERIC(10,2)

status VARCHAR(50)

repository_count INTEGER

calculated_at TIMESTAMP
```

---

## Relationships

```text
technologies (1)
    ↓
technology_scores (N)
```

---

## Foreign Keys

```sql
technology_id
REFERENCES technologies(id)
ON DELETE CASCADE
```

---

## Indexes

```sql
INDEX idx_technology_score

INDEX idx_technology_date
```

---

# weekly_reports

Menyimpan laporan mingguan.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

title VARCHAR(500)

report_content TEXT

top_technologies JSONB

top_repositories JSONB

generated_at TIMESTAMP
```

---

## Indexes

```sql
INDEX idx_weekly_report_date
```

---

# daily_insights

Menyimpan insight harian.

---

## Fields

```sql
id BIGSERIAL PRIMARY KEY

insight_text TEXT

generated_at TIMESTAMP
```

---

## Indexes

```sql
INDEX idx_daily_insight_date
```

---

# 4. Relationship Summary

## repositories → repository_snapshots

Relationship:

```text
One To Many
```

Reason:

Satu repository memiliki banyak histori snapshot.

---

## repositories → repository_summaries

Relationship:

```text
One To One
```

Reason:

Satu repository memiliki satu AI summary aktif.

---

## repositories → repository_health_scores

Relationship:

```text
One To One
```

Reason:

Satu repository memiliki satu health score aktif.

---

## repositories ↔ technologies

Relationship:

```text
Many To Many
```

Through:

```text
repository_technologies
```

Reason:

Satu repository dapat terkait banyak teknologi.

Satu teknologi dapat digunakan banyak repository.

---

## technologies → technology_scores

Relationship:

```text
One To Many
```

Reason:

Skor teknologi dihitung setiap hari.

---

# 5. Data Retention Strategy

## repository_snapshots

Retention:

```text
Permanent
```

Reason:

Digunakan untuk analytics historis.

---

## repository_summaries

Retention:

```text
Keep Latest
```

Reason:

Summary lama dapat digenerate ulang.

---

## technology_scores

Retention:

```text
Permanent
```

Reason:

Digunakan untuk Tech Radar historis.

---

## weekly_reports

Retention:

```text
Permanent
```

Reason:

Menjadi arsip laporan platform.

---

# 6. Scalability Considerations

## Snapshot Growth

Estimasi:

```text
1.000 repositories

4 snapshots per day

≈ 120.000 snapshots per month
```

---

## Recommended Optimization

Partition Table:

```sql
repository_snapshots
```

berdasarkan:

```text
captured_at
```

per bulan.

---

## Future Considerations

Jika jumlah repository > 50.000:

* PostgreSQL Table Partitioning
* Redis Caching Layer
* Materialized Views untuk Analytics
* Read Replica PostgreSQL

---

# 7. Recommended Migration Order

```text
1. repositories

2. technologies

3. repository_technologies

4. repository_snapshots

5. repository_summaries

6. repository_health_scores

7. technology_scores

8. weekly_reports

9. daily_insights
```

---

# ERD Status

Approved for MVP Version 1.0

Compatible with:

* Next.js Frontend
* Go Gin Backend
* PostgreSQL
* Redis
* Asynq
* OpenRouter
* Docker Deployment
