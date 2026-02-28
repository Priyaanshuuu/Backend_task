# AI Chat Backend API

A production-ready REST API backend for an AI-powered chat application built with Next.js 16, featuring JWT authentication, rate limiting, response caching, and real-time streaming responses.

## Features

- **User Authentication** - Register/Login with JWT access & refresh tokens
- **AI Chat Integration** - Google Gemini API for intelligent responses
- **Streaming Responses** - Real-time message streaming via Server-Sent Events
- **Session Management** - Multiple chat sessions per user with history retrieval
- **Response Caching** - LRU cache to reduce API costs and improve response times
- **Rate Limiting** - Configurable request throttling to prevent abuse
- **Input Validation** - Zod schemas for type-safe request validation
- **MongoDB Storage** - Persistent message and user storage

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT (jsonwebtoken) |
| AI | Google Gemini API |
| Validation | Zod |
| Caching | LRU Cache |
| Password Hashing | bcryptjs |
| Testing | Jest |

## Project Structure

```
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   └── refresh/route.ts
│       └── chat/
│           ├── route.ts
│           ├── history/route.ts
│           └── sessions/route.ts
├── lib/
│   ├── db/
│   │   └── mongoose.ts
│   ├── middlewares/
│   │   ├── rateLimit.ts
│   │   └── withAuth.ts
│   ├── models/
│   │   ├── Message.model.ts
│   │   └── User_model.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   └── llmService.ts
│   ├── utils/
│   │   ├── apiResponse.ts
│   │   ├── cache.ts
│   │   ├── jwt.ts
│   │   └── password.ts
│   └── validators/
│       ├── authSchema.ts
│       └── chatSchema.ts
└── types/
    └── index.ts
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |

### Chat (Protected - Requires Bearer Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message and get AI response (streaming) |
| GET | `/api/chat/history?sessionId=<uuid>` | Get chat history for a session |
| GET | `/api/chat/sessions` | Get all user sessions |

## Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/ai-chat-backend.git
cd ai-chat-backend

# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT Secrets (generate random strings)
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOWS_MS=6000
```

### Getting API Keys

**MongoDB Atlas:**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string from "Connect" > "Drivers"

**Gemini API:**
1. Go to [makersuite.google.com](https://makersuite.google.com/)
2. Create API key

**JWT Secrets:**
```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Server runs at `http://localhost:3000`

## API Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "createdAt": "2026-02-28T..."
    },
    "accessToken": "eyJhbGc..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'
```

### Send Chat Message

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "What is TypeScript?",
    "contextWindow": 10
  }'
```

### Get Chat History

```bash
curl -X GET "http://localhost:3000/api/chat/history?sessionId=550e8400-e29b-41d4-a716-446655440000&limit=50" \
  -H "Authorization: Bearer <access_token>"
```

## Password Requirements

- Minimum 8 characters
- Maximum 72 characters (bcrypt limit)
- At least one uppercase letter
- At least one number

## Rate Limiting

Default: 20 requests per 6 seconds per user. Configurable via environment variables.

When limit is exceeded, API returns `429 Too Many Requests` with headers:
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: <timestamp>`

## Response Caching

LLM responses are cached using LRU Cache:
- Max 500 cached responses
- 10 minute TTL
- Cache key: `userId::message.toLowerCase()`

Same questions from the same user return cached responses instantly.

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

## Testing

```bash
# Run tests
npm test
```

## License

MIT
