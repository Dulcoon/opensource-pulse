# OpenSource Pulse

> AI-Powered Open Source Intelligence Platform

# Technical Design Document (TDD)

Version: 1.0
Status: Approved

---

# 1. Technical Overview

## Project Name

OpenSource Pulse

## Architecture Style

Monorepo Architecture

## Backend Architecture

Clean Architecture

## Frontend Architecture

Feature-Based Architecture

## Deployment Architecture

Containerized Deployment

---

# 2. Repository Structure

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
├── nginx/
├── monitoring/
└── scripts/

docker/
├── development/
└── production/
```

---

# 3. Frontend Technical Design

## Technology Stack

Framework:

* Next.js 15

Language:

* TypeScript

Styling:

* Tailwind CSS

UI Components:

* shadcn/ui

Charts:

* Recharts

State Management:

* Zustand

Server State:

* TanStack Query

---

## Frontend Folder Structure

```text
apps/web/

src/

├── app/
│   ├── page.tsx
│   ├── repositories/
│   ├── radar/
│   ├── analytics/
│   └── reports/
│
├── components/
│
├── features/
│   ├── dashboard/
│   ├── repositories/
│   ├── radar/
│   ├── analytics/
│   └── reports/
│
├── services/
│
├── hooks/
│
├── store/
│
├── types/
│
└── lib/
```

---

## Frontend Pages

### Dashboard

Route:

```text
/
```

Responsibilities:

* Hot Technologies
* Fastest Growing Repository
* Weekly Statistics
* Weekly Insight

---

### Repository Listing

Route:

```text
/repositories
```

Responsibilities:

* Search Repository
* Filter Repository
* Repository Ranking

---

### Repository Detail

Route:

```text
/repositories/[repository]
```

Responsibilities:

* Repository Overview
* AI Summary
* Health Score
* Growth Trend

---

### Tech Radar

Route:

```text
/radar
```

Responsibilities:

* Technology Ranking
* Technology Growth
* Technology Status

---

### Analytics

Route:

```text
/analytics
```

Responsibilities:

* Language Growth
* Repository Growth
* Topic Growth
* Contributor Growth

---

### Reports

Route:

```text
/reports
```

Responsibilities:

* Weekly Reports
* Historical Reports

---

# 4. Backend Technical Design

## Technology Stack

Language:

* Go

Framework:

* Gin

Architecture:

* Clean Architecture

Database:

* PostgreSQL

Cache:

* Redis

Queue:

* Asynq

AI Provider:

* OpenRouter

---

## Backend Folder Structure

```text
apps/api/

cmd/
└── api/

internal/

├── config/

├── database/

├── domain/
│   ├── repository/
│   ├── technology/
│   ├── analytics/
│   └── report/

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

# 5. Domain Design

## Repository Domain

Responsibilities:

* Repository Data
* Repository Metrics
* Repository Growth
* Repository Summary
* Repository Health Score

---

## Technology Domain

Responsibilities:

* Technology Detection
* Technology Classification
* Radar Calculation
* Technology Ranking

---

## Analytics Domain

Responsibilities:

* Language Analytics
* Repository Analytics
* Topic Analytics
* Contributor Analytics

---

## Report Domain

Responsibilities:

* Weekly Reports
* Daily Digest
* AI Insights

---

# 6. Database Design

## repositories

Stores repository master data.

```sql
id
github_id
owner
repository_name
full_name
description
primary_language
stars
forks
open_issues
repository_url
created_at
updated_at
```

---

## repository_snapshots

Stores historical repository metrics.

```sql
id
repository_id
stars
forks
open_issues
contributors
captured_at
```

Purpose:

* Growth Analytics
* Trend Analytics
* Health Calculation

---

## repository_summaries

Stores AI generated summaries.

```sql
id
repository_id
quick_summary
key_features
use_cases
similar_projects
difficulty_level
generated_at
```

---

## repository_health_scores

Stores repository health metrics.

```sql
id
repository_id
overall_score
activity_score
maintenance_score
community_score
issue_score
status
calculated_at
```

---

## technologies

Stores detected technologies.

```sql
id
technology_name
category
created_at
```

---

## technology_scores

Stores Tech Radar calculations.

```sql
id
technology_id
score
growth_percentage
status
repository_count
calculated_at
```

---

## weekly_reports

Stores generated reports.

```sql
id
title
report_content
generated_at
```

---

## daily_insights

Stores daily AI insights.

```sql
id
insight_text
generated_at
```

---

# 7. Redis Design

## Purpose

Redis digunakan untuk:

* Caching
* Background Jobs
* Rate Limiting

---

## Cache Keys

```text
dashboard:latest

radar:latest

analytics:latest

repository:{id}

report:{id}
```

---

# 8. Queue Design

Framework:

```text
Asynq
```

---

## Queue Names

### repositories

Responsibilities:

* Repository Synchronization

---

### summaries

Responsibilities:

* AI Summary Generation

---

### reports

Responsibilities:

* Weekly Report Generation

---

### digest

Responsibilities:

* Daily Digest Generation

---

# 9. Scheduler Design

## SyncRepositoriesJob

Schedule:

```cron
0 */6 * * *
```

Runs every 6 hours.

Responsibilities:

* Fetch repositories from GitHub
* Update repository data
* Create snapshots

---

## CalculateHealthScoreJob

Schedule:

```cron
0 2 * * *
```

Runs daily.

Responsibilities:

* Calculate Health Score

---

## GenerateTechRadarJob

Schedule:

```cron
0 3 * * *
```

Runs daily.

Responsibilities:

* Calculate Technology Scores
* Update Radar Status

---

## GenerateWeeklyReportJob

Schedule:

```cron
0 9 * * 1
```

Runs every Monday.

Responsibilities:

* Generate Weekly Report
* Generate Weekly Insight

---

## GenerateDailyDigestJob

Schedule:

```cron
0 8 * * *
```

Runs daily.

Responsibilities:

* Generate Daily Digest
* Send Telegram Notifications

---

# 10. GitHub Integration Design

## Provider

GitHub REST API

---

## Endpoints

```text
/search/repositories

/repos/{owner}/{repo}

/repos/{owner}/{repo}/contributors

/repos/{owner}/{repo}/releases
```

---

## Synchronization Flow

```text
GitHub API

↓

Repository Sync Job

↓

PostgreSQL

↓

Snapshot Creation

↓

AI Queue

↓

Summary Generation
```

---

# 11. AI Integration Design

## Provider

OpenRouter

---

## Supported Models

* Gemini
* Claude
* GPT
* DeepSeek

---

## AI Use Cases

### Repository Summary

Input:

* Repository Description
* README
* Topics

Output:

* Quick Summary
* Key Features
* Use Cases
* Similar Projects
* Difficulty Level

---

### Weekly Insight

Input:

* Weekly Repository Growth
* Technology Growth

Output:

* Weekly Insight

---

### Weekly Report

Input:

* Aggregated Weekly Data

Output:

* Weekly Report

---

### Daily Digest

Input:

* Daily Repository Changes
* Daily Technology Changes

Output:

* Daily Digest

---

# 12. Telegram Bot Design

## Commands

### /trending

Returns:

* Top Trending Repositories

---

### /languages

Returns:

* Top Languages

---

### /radar

Returns:

* Current Tech Radar

---

### /report

Returns:

* Latest Weekly Report

---

### /repo {repository}

Returns:

* AI Summary
* Health Score
* Growth Trend
* Key Metrics

---

## Flow

```text
Telegram User

↓

Telegram Bot

↓

API

↓

PostgreSQL

↓

Response
```

---

# 13. API Design

## Dashboard Module

```http
GET /api/dashboard
```

Returns:

* Hot Technologies
* Weekly Statistics
* Weekly Insight

---

## Repository Module

```http
GET /api/repositories

GET /api/repositories/{id}
```

Returns:

* Repository Data
* Repository Metrics

---

## Summary Module

```http
GET /api/repositories/{id}/summary
```

Returns:

* AI Summary

---

## Radar Module

```http
GET /api/radar
```

Returns:

* Technology Rankings

---

## Analytics Module

```http
GET /api/analytics
```

Returns:

* Language Growth
* Repository Growth
* Topic Growth

---

## Report Module

```http
GET /api/reports

GET /api/reports/{id}
```

Returns:

* Weekly Reports

---

# 14. Docker Design

## Containers

```yaml
web:
  nextjs frontend

api:
  golang backend

postgres:
  primary database

redis:
  cache and queue

nginx:
  reverse proxy
```

---

# 15. Monitoring Design

## Metrics

* API Response Time
* Job Duration
* Queue Length
* Database Latency
* Error Rate

---

## Tools

* Prometheus
* Grafana

---

# 16. CI/CD Design

## Platform

GitHub Actions

---

## Pipeline

```text
Lint

↓

Unit Test

↓

Build

↓

Docker Build

↓

Deploy VPS
```

---

# 17. Security Design

## Security Controls

* HTTPS Only
* CORS Protection
* Input Validation
* Rate Limiting
* Secret Management
* Secure Environment Variables

---

# 18. Future Architecture

## Phase 2

* Reddit Integration
* HackerNews Integration
* GitLab Integration
* Advanced Analytics
* Full Telegram Bot

---

## Phase 3

* User Accounts
* Saved Repositories
* Personalized Digest
* Technology Watchlists

---

# 19. Development Principles

* Clean Architecture
* Feature-Based Frontend Structure
* Domain-Driven Backend Modules
* Background Processing via Asynq
* Stateless API Design
* API First Development
* Containerized Deployment
* AI Features Isolated Behind Provider Abstraction
* Database-Driven Analytics
* Monorepo Repository Strategy
