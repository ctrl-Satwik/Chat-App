# ChatApp — Real-Time Chat with MERN & Socket.IO

A full-stack, one-to-one messaging app built with **React (Vite)**, **Node.js/Express**, **MongoDB** and **Socket.IO**. Messages are delivered in real time over authenticated WebSocket connections and persisted in MongoDB. The app tracks **sent → delivered → seen** receipts, online presence, typing indicators and unread counts. Users can share images and videos (Cloudinary, with a local-disk fallback), edit their messages, and delete messages for themselves or for everyone.

---

## Features

### Authentication
- Registration with full name, email, password and an optional profile photo
- Login with email and password; passwords are hashed with bcrypt
- Stateless JWT authentication (Bearer token, 30-day expiry) for both the REST API and the Socket.IO handshake
- Session restore on page load (`GET /api/auth/me`) and protected client routes
- Logout (client-side: the stored token is discarded)

### Messaging
- One-to-one conversations (created on demand, one per pair of users)
- Real-time delivery over Socket.IO, with a REST fallback when the socket is disconnected
- Persistent message history
- Image and video messages with optional captions and an upload progress bar
- **Read receipts**: `sent` (receiver offline) → `delivered` (receiver online) → `seen` (receiver opened the chat)
- Pending messages are marked delivered automatically when the receiver comes online
- Unread counts per conversation and a "New messages" divider
- Typing indicators, both in the open chat and in the chat list
- Edit your own text messages (shown as *edited*)
- **Delete for me** (any message) and **Delete for everyone** (sender only; leaves a "This message was deleted" placeholder)
- **Clear chat**: removes every message in a conversation for you only (the other person keeps theirs)

### Users & Presence
- Online / offline status and "last seen" timestamps, broadcast in real time
- Multi-tab aware: a user stays online until their last socket disconnects
- Search users by name or email to start a new conversation
- Edit profile (name and photo) and view contact info

### Interface
- Dark theme built with Tailwind CSS design tokens
- Responsive layout: chat list and chat side by side on tablets and desktops, a drawer-style chat list on phones, plus support for landscape phones and notched screens
- Messages grouped by sender and day, with timestamps and status ticks
- Conversation list grouped by recency (Today / Yesterday / This week / Earlier) and filterable by name
- In-chat message search with highlighted matches (client-side)
- Emoji picker, copy-to-clipboard, image lightbox, toast notifications and skeleton loaders

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, socket.io-client 4, lucide-react |
| **Backend** | Node.js, Express 4, Socket.IO 4, Mongoose 8, jsonwebtoken, bcryptjs, Multer, Cloudinary SDK, cors, dotenv |
| **Database** | MongoDB |
| **Media storage** | Cloudinary (optional) or local disk (`backend/uploads`, served statically) |
| **Dev tooling** | nodemon, PostCSS, Autoprefixer |

State on the frontend is managed with React Context (`AuthContext`, `ChatContext`, `ToastContext`).

---

## Architecture

```text
┌──────────────────────────── React SPA (Vite) ────────────────────────────┐
│  AuthContext · ChatContext · ToastContext                                 │
│                                                                           │
│  Axios (REST, "Authorization: Bearer <JWT>")   socket.io-client (JWT in   │
│              │                                  handshake auth)           │
└──────────────┼──────────────────────────────────────────┼─────────────────┘
               ▼                                          ▼
┌──────────────────────── Node.js HTTP server ────────────────────────────┐
│  Express  /api/auth · /api/users · /api/conversations · /api/messages    │
│     │            ▲                                                       │
│     │            └── controllers emit events via the shared `io` ──┐     │
│     │                                                              ▼     │
│     │                                   Socket.IO (per-user rooms +      │
│     │                                   per-conversation rooms)          │
└─────┼──────────────────────────────────────────────┼─────────────────────┘
      ▼                                              ▼
  MongoDB (Mongoose)                    Cloudinary  ─or─  local /uploads
```

- **REST** handles authentication, profiles, user search, conversation access, message history, media uploads, edits, deletes and read state.
- **Socket.IO** runs on the same HTTP server. It sends text messages, typing events, presence and delivery/seen receipts. REST controllers also broadcast real-time events (new media messages, edits, deletes, seen updates) through the shared `io` instance (`app.set('io', io)`).
- Each connected socket joins a **room named after its user ID**, and joins a **conversation room** when a chat is opened. This lets events target a specific user or conversation.

---

## Project Structure

```text
Chat App/
├── backend/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection
│   │   └── cloudinary.js             # Cloudinary config (detects missing credentials)
│   ├── controllers/
│   │   ├── authController.js         # register, login, me
│   │   ├── userController.js         # list, search, get by id, update profile
│   │   ├── conversationController.js # access/create, list, get by id
│   │   └── messageController.js      # history, send, upload, seen, unread, edit, delete, clear
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT "protect" guard
│   │   ├── uploadMiddleware.js       # Multer: type filter + 50 MB limit
│   │   └── errorMiddleware.js        # 404 + error handler
│   ├── models/                       # User, Conversation, Message
│   ├── routes/                       # authRoutes, userRoutes, conversationRoutes, messageRoutes
│   ├── services/
│   │   └── messageStatusService.js   # delivered/seen updates, unread counts (ignores cleared messages)
│   ├── socket/
│   │   └── socketHandler.js          # socket auth, presence, events
│   ├── utils/
│   │   ├── generateToken.js          # JWT signing
│   │   └── cloudinaryUpload.js       # Cloudinary upload with local fallback
│   ├── uploads/                      # local media (git-ignored)
│   ├── server.js                     # Express + Socket.IO entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/                       # favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                 # AuthLayout
│   │   │   ├── chat/                 # ChatWindow, ChatHeader, MessageBubble, MessageInput, ...
│   │   │   ├── common/               # Button, Input, Modal, Avatar, Dropdown, Skeletons, ...
│   │   │   └── sidebar/              # Sidebar, ConversationItem, NewChatModal, UserSearch, UserProfile
│   │   ├── context/                  # AuthContext, ChatContext, ToastContext
│   │   ├── hooks/                    # useAuth, useSocket
│   │   ├── pages/                    # Login, Register, Chat
│   │   ├── services/                 # Axios client + auth/user/message services
│   │   ├── utils/                    # constants, date formatting
│   │   ├── App.jsx                   # routes + route guards
│   │   ├── index.css                 # Tailwind layers, tooltips, skeletons
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── tailwind.config.js            # colour tokens, breakpoints, animations
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (LTS) and npm
- MongoDB, either a local instance or a MongoDB Atlas connection string
- *(Optional)* a Cloudinary account for hosted media storage

### 1. Clone and install

```bash
git clone <repository-url>
cd "Chat App"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then fill in the values (see [Environment Variables](#environment-variables)). At minimum, set `MONGO_URI` and a strong `JWT_SECRET`.

### 3. Start MongoDB
Run MongoDB locally (default `mongodb://localhost:27017/chatapp`) or point `MONGO_URI` at your Atlas cluster. Collections are created automatically by Mongoose, so no migrations or seed scripts are needed.

### 4. Run the app

```bash
# Terminal 1: backend (http://localhost:5000, auto-reloads with nodemon)
cd backend
npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open `http://localhost:5173`, register two accounts (for example in two browsers or a private window), and start chatting.

### Available scripts

| Location | Command | Description |
|---|---|---|
| `backend/` | `npm run dev` | Start the API with nodemon |
| `backend/` | `npm start` | Start the API with Node |
| `frontend/` | `npm run dev` | Vite dev server on port 5173 |
| `frontend/` | `npm run build` | Production build to `frontend/dist` |
| `frontend/` | `npm run preview` | Preview the production build |

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=<a-long-random-secret>

# Optional: if omitted (or left as placeholders), media is stored in backend/uploads
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Frontend origin allowed by CORS and Socket.IO
CLIENT_URL=http://localhost:5173

# Optional: public base URL used to build links to locally stored uploads
# (defaults to http://localhost:<PORT>)
SERVER_URL=

# Optional: set to "production" to hide error stack traces in API responses
NODE_ENV=
```

| Variable | Required | Notes |
|---|---|---|
| `PORT` | No | Defaults to `5000` |
| `MONGO_URI` | Yes | Falls back to `mongodb://localhost:27017/chatapp` |
| `JWT_SECRET` | **Yes** | Without it, the server signs tokens with an insecure built-in fallback, so always set it |
| `CLIENT_URL` | Yes in production | Added to the CORS / Socket.IO allow-list (`localhost:5173` is always allowed) |
| `CLOUDINARY_*` | No | All three must be set to enable Cloudinary |
| `SERVER_URL` | No | Needed in production if you rely on local uploads |
| `NODE_ENV` | No | `production` hides stack traces in error responses |

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account (`multipart/form-data`: `fullName`, `email`, `password`, optional `profilePhoto`). Returns user + token |
| POST | `/auth/login` | Public | Log in with `email` and `password`. Returns user + token |
| GET | `/auth/me` | Protected | Current user's profile |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Protected | All users except the current one |
| GET | `/users/search?query=` | Protected | Case-insensitive search by name or email |
| GET | `/users/:id` | Protected | A user's public profile |
| PUT | `/users/profile` | Protected | Update `fullName` and/or `profilePhoto` (`multipart/form-data`) |

### Conversations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/conversations` | Protected | Get or create the one-to-one conversation with `receiverId` |
| GET | `/conversations` | Protected | The current user's conversations, with participants and last message |
| GET | `/conversations/:id` | Protected | A single conversation (participants only) |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/messages/:conversationId` | Protected | Message history (participants only; excludes messages you deleted for yourself) |
| POST | `/messages` | Protected | Send a text message (`conversationId`, `receiverId`, `text`); used as a fallback when the socket is offline |
| POST | `/messages/upload` | Protected | Send an image/video (`multipart/form-data`: `file`, `conversationId`, `receiverId`, optional `text`) |
| PATCH | `/messages/:conversationId/seen` | Protected | Mark incoming messages in a conversation as seen |
| GET | `/messages/unread/counts` | Protected | Unread count per conversation |
| PUT | `/messages/:id` | Protected | Edit your own message text |
| DELETE | `/messages/:conversationId/clear` | Protected | Clear a conversation for the current user only (participants only) |
| DELETE | `/messages/:id?scope=me\|everyone` | Protected | `me`: hide for yourself; `everyone`: sender-only, clears content for both users (default `everyone`) |

### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Server status check |

Uploaded files stored locally are served from `/uploads/<filename>`.

---

## Real-Time Communication (Socket.IO)

**Connection:** the client connects to `VITE_SOCKET_URL` with `auth: { token }`. A server middleware verifies the JWT and loads the user before accepting the connection. On connect the server:
1. joins the socket to the user's personal room (their user ID),
2. marks the user online and broadcasts `user:online`,
3. sends `unread:counts` to that socket,
4. marks the user's pending `sent` messages as `delivered` and notifies each sender with `message:statusUpdated`.

### Client → Server
| Event | Payload | Purpose |
|---|---|---|
| `conversation:join` | `conversationId` | Join a conversation room |
| `conversation:leave` | `conversationId` | Leave a conversation room |
| `message:send` | `{ conversationId, receiverId, text }` + ack callback | Save and deliver a message |
| `message:delivered` | `{ messageId, conversationId, senderId }` | Delivery acknowledgement from the receiver |
| `conversation:seen` | `{ conversationId, senderId }` | Mark a conversation's incoming messages as seen |
| `typing:start` / `typing:stop` | `{ conversationId, receiverId }` | Typing indicator |

### Server → Client
| Event | Payload | Purpose |
|---|---|---|
| `user:online` / `user:offline` | `{ userId, onlineUsers[, lastSeen] }` | Presence updates |
| `unread:counts` | `{ [conversationId]: count }` | Initial unread counts |
| `message:receive` | message | New message (text via socket, media via REST) |
| `message:statusUpdated` | `{ conversationId, messageIds, status, deliveredAt }` | Sent → delivered updates |
| `messages:seen` | `{ conversationId, readerId, messageIds, seenAt }` | Seen receipts |
| `message:update` | message | Edited message, or a message deleted for everyone |
| `message:delete` | `{ messageId, conversationId }` | A "delete for me" sync, sent only to the deleting user's own sessions |
| `conversation:cleared` | `{ conversationId }` | A "clear chat" sync, sent only to the clearing user's own sessions |
| `typing:start` / `typing:stop` | `{ conversationId, senderId[, senderName] }` | Typing indicator, sent to the conversation room and the receiver's user room so the chat list updates too |

### Message delivery flow

```text
Sender ──message:send──► Server ── save Message (status: delivered if receiver online, else sent)
                                 ── update Conversation.lastMessage
                                 ── message:receive ──► conversation room + receiver's user room
Receiver (chat not open) ──message:delivered──► Server ──message:statusUpdated──► Sender
Receiver opens chat ──conversation:seen + PATCH /seen──► Server ──messages:seen──► Sender
```

Presence is kept in memory as a `userId → Set<socketId>` map, so the server tracks multiple tabs per user. `isOnline` and `lastSeen` are also saved to MongoDB.

---

## Database

MongoDB via Mongoose, with three collections:

```text
User
 ├── fullName, email (unique, lowercase)
 ├── password (bcrypt hash, never returned in JSON)
 ├── profilePhoto (URL)
 ├── isOnline, lastSeen
 └── createdAt / updatedAt

Conversation
 ├── participants: [User, User]          one-to-one
 ├── lastMessage → Message
 ├── lastMessageAt
 └── createdAt / updatedAt

Message
 ├── conversationId → Conversation
 ├── sender → User, receiver → User
 ├── text, messageType (text | image | video), mediaUrl
 ├── isEdited
 ├── status (sent | delivered | seen), deliveredAt, seenAt
 ├── deletedFor: [User]                  "delete for me" / "clear chat"
 ├── isDeletedForEveryone                content cleared, placeholder shown
 └── createdAt / updatedAt
```

---

## Authentication & Security

**Implemented**
- Passwords hashed with **bcrypt** (10 salt rounds); the password field is stripped from all JSON responses.
- **JWT** signed with `JWT_SECRET`, valid for 30 days. It is sent as a Bearer token on REST calls and in the Socket.IO handshake, and both are verified server-side.
- Expired or invalid tokens: the server returns `401`, and the client clears the stored token.
- **Authorization checks:**
  - Only conversation participants can read a conversation or its messages.
  - Only the sender can edit a message or delete it for everyone.
  - Only participants can delete a message for themselves.
- **CORS** is restricted to `CLIENT_URL` and the local Vite origins, for both Express and Socket.IO.
- **Uploads** go through Multer and only accept image (JPG, PNG, WEBP, GIF) and video (MP4, WEBM, MOV, MKV, AVI) files up to **50 MB**.
- Basic server-side validation on registration (required fields, email format, minimum password length) and a unique email constraint.

**Things to be aware of**
- The JWT is stored in `localStorage`, not in an HTTP-only cookie.
- There is no rate limiting, `helmet`, refresh-token rotation, email verification or password reset.
- Sending a message (`POST /api/messages`, `message:send`) does not yet verify that the sender is a participant of the target conversation.

---

## Production Build

There is no deployment configuration in the repository (no Docker, Render, Vercel or similar files). To run in production:

```bash
# Frontend: outputs static files to frontend/dist
cd frontend
npm run build

# Backend
cd backend
npm start
```

- Serve `frontend/dist` from any static host. Set `VITE_API_URL` and `VITE_SOCKET_URL` **before** building, because Vite embeds them at build time.
- Run the backend on a host that supports long-lived WebSocket connections. Set `CLIENT_URL` to the deployed frontend origin, set `NODE_ENV=production`, and use a strong `JWT_SECRET`.
- Use Cloudinary for media in production. Hosts with ephemeral file systems don't keep files in `backend/uploads`. If you do use local uploads, set `SERVER_URL` to the backend's public URL.

---

## Future Improvements *(planned, not implemented)*

- Automated tests (no test suite exists yet)
- Rate limiting, security headers and participant checks when sending messages
- HTTP-only cookie sessions, email verification and password reset
- Paginated / infinite-scroll message history (currently the full history is loaded)
- Group conversations
- Docker and deployment configuration

---

## License

No license file is included in this repository. The backend `package.json` declares `ISC`.
