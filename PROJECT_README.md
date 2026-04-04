# AI Call Assistant - Full Stack Application

A dynamic AI-powered call screening and management application with user authentication, multi-user support, and cloud database.

## Architecture

```
Frontend (React + TypeScript) ←→ Backend API (Node.js + Express) ←→ Database (MongoDB)
```

## Features

- **User Authentication**: JWT-based login/registration with Truecaller ID
- **Multi-User Support**: Each user has their own call history and settings
- **AI Call Screening**: Automatic call importance detection
- **Auto-AI Response**: Answers high-priority calls, sends messages for low-priority
- **Truecaller Integration**: Caller ID lookup and spam detection
- **Call Analytics**: Dashboard with statistics and insights
- **Dark/Light Mode**: Theme support with user preferences

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone and Setup

```bash
git clone https://github.com/pravallikakolagani/ai-call-assistant-v2.git
cd ai-call-assistant-v2
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aicallassistant?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Get your MongoDB URI from [MongoDB Atlas](https://www.mongodb.com/atlas/database)

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../
npm install
```

Create `.env` file in root:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm start
```

### 4. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/settings` - Update user settings

### Calls
- `GET /api/calls` - Get user's calls
- `POST /api/calls` - Create new call
- `PUT /api/calls/:id` - Update call
- `DELETE /api/calls/:id` - Delete call
- `GET /api/calls/stats/overview` - Get call statistics

## Deployment

### Backend (Render/Railway/Heroku)

1. Push code to GitHub
2. Connect repo to Render/Railway
3. Add environment variables
4. Deploy

### Frontend (Netlify/Vercel)

```bash
npm run build
# Deploy build/ folder to Netlify
```

Update `REACT_APP_API_URL` to point to deployed backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken) |
| Deployment | Netlify (frontend), Render (backend) |

## Project Structure

```
ai-call-assistant-v2/
├── backend/              # Node.js API
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Entry point
│   └── package.json
├── src/
│   ├── components/      # React components
│   ├── services/        # API client, Truecaller service
│   ├── App.tsx         # Main app
│   └── ...
├── build/              # Production build
└── package.json
```

## Next Features

- [ ] Calendar integration (Google/Outlook)
- [ ] SMS follow-up for missed calls
- [ ] Contact-based routing rules
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Webhook integrations

## License

MIT
