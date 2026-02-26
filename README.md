# Notely - Notion Clone

A full-stack Notion clone built with Angular and NestJS.

## Tech Stack

- **Frontend:** Angular 17+ (standalone components, signals, NgRx)
- **Backend:** NestJS 10+ (modular, TypeORM, PostgreSQL, Redis, WebSockets)
- **Database:** PostgreSQL (via TypeORM with migrations)
- **Cache / Sessions:** Redis
- **Real-time:** Socket.IO
- **Auth:** JWT (access + refresh tokens) + Google OAuth
- **File Storage:** AWS S3 (MinIO for local dev)
- **Containerization:** Docker + Docker Compose

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd notely
```

### 2. Start infrastructure services

```bash
docker-compose up -d postgres redis minio
```

### 3. Set up the backend

```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

### 4. Set up the frontend

```bash
cd frontend
npm install
ng serve
```

### 5. Access the application

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- API Docs: http://localhost:3000/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## Project Structure

```
notely/
├── backend/          # NestJS application
├── frontend/         # Angular application
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test
```

### Database Migrations

```bash
cd backend

# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## License

MIT
