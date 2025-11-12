# SourceFlow Backend API

Backend API server for the AI-Powered Creation-to-Commerce Platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for local development)
- PostgreSQL 16+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values.

4. Start database and Redis with Docker Compose:
```bash
docker-compose up -d postgres redis
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Generate Prisma client:
```bash
npm run db:generate
```

7. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── prisma/              # Prisma schema and migrations
├── tests/               # Test files
├── logs/                # Application logs
└── docker-compose.yml   # Docker services
```

## API Documentation

API documentation will be available at `/api/v1/docs` (to be implemented).

## Health Check

Health check endpoint: `GET /health`

## Environment Variables

See `.env.example` for all required environment variables.

## Docker

### Development

```bash
docker-compose up
```

### Production

```bash
docker build -t sourceflow-backend .
docker run -p 3000:3000 --env-file .env sourceflow-backend
```

## License

ISC

