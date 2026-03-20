# Chat Service

Real-time messaging service for Piums platform using WebSocket (Socket.io).

## Features

- ✅ REST API for conversations and messages
- ✅ WebSocket real-time messaging
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message moderation (bad words filter)
- ✅ Rate limiting
- ✅ JWT authentication

## Tech Stack

- Node.js + Express
- Socket.io
- PostgreSQL + Prisma
- TypeScript

## Setup

### 1. Install Dependencies

```bash
cd services/chat-service
npm install
```

### 2. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE piums_chat;
CREATE USER piums_user WITH PASSWORD 'piums_password';
GRANT ALL PRIVILEGES ON DATABASE piums_chat TO piums_user;
```

### 3. Environment Variables

Copy `.env` and update values:

```bash
DATABASE_URL="postgresql://piums_user:piums_password@localhost:5432/piums_chat?schema=public"
JWT_SECRET=your-jwt-secret-key
PORT=4007
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Service

```bash
npm run dev
```

Service runs on `http://localhost:4007`

## API Endpoints

### Conversations

- `GET /api/chat/conversations` - List user conversations
- `GET /api/chat/conversations/:id` - Get conversation with messages
- `POST /api/chat/conversations` - Create new conversation
- `PATCH /api/chat/conversations/:id/read` - Mark conversation as read

### Messages

- `GET /api/chat/messages/unread-count` - Get unread messages count
- `GET /api/chat/messages/:conversationId` - Get messages from conversation
- `POST /api/chat/messages` - Send message (also available via WebSocket)
- `PATCH /api/chat/messages/:id/read` - Mark message as read

## WebSocket Events

### Client → Server

- `message:send` - Send a message
  ```typescript
  socket.emit('message:send', {
    conversationId: 'uuid',
    content: 'Hello!',
    type: 'text'
  });
  ```

- `message:read` - Mark message as read
  ```typescript
  socket.emit('message:read', { messageId: 'uuid' });
  ```

- `typing:start` - User started typing
  ```typescript
  socket.emit('typing:start', { conversationId: 'uuid' });
  ```

- `typing:stop` - User stopped typing
  ```typescript
  socket.emit('typing:stop', { conversationId: 'uuid' });
  ```

### Server → Client

- `message:sent` - Confirm message was sent
- `message:received` - New message received
- `message:read` - Message was read by recipient
- `message:error` - Error occurred
- `typing:start` - Other user started typing
- `typing:stop` - Other user stopped typing

## Authentication

WebSocket connections require JWT token:

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:4007', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Rate Limiting

- API: 100 requests per 15 minutes
- Messages: 30 per minute (prevents spam)

## Database Schema

```prisma
model Conversation {
  id        String    @id @default(uuid())
  userId    String
  artistId  String
  bookingId String?   @unique
  lastMessageAt DateTime @default(now())
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  senderType     String       // user, artist
  content        String
  type           String       @default("text")
  read           Boolean      @default(false)
  readAt         DateTime?
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(...)
}
```

## Docker

```bash
docker build -t piums-chat-service .
docker run -p 4007:4007 --env-file .env piums-chat-service
```

## Testing

```bash
# Health check
curl http://localhost:4007/health

# Get conversations (requires auth token)
curl http://localhost:4007/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --cookie "token=YOUR_TOKEN"
```
