# Slack Clone

A real-time chat platform similar to Slack, built with Next.js, Node.js, PostgreSQL, and WebSocket technology.

## ✨ Features

- ⚡ **Real-time messaging** with WebSocket connections (Socket.IO)
- 🔐 **User authentication** with JWT tokens and bcrypt password hashing
- 🏢 **Multiple workspaces** - create and switch between workspaces Discord-style
- 📺 **Public channels** - automatically shared with all workspace members
- 🔒 **Private channels** - invite-only channels for sensitive discussions
- 👥 **Workspace invites** - share an 8-digit code to invite others
- ✍️ **Typing indicators** for better user experience
- 💾 **Message persistence** in PostgreSQL database
- 🎨 **Modern Discord-style UI** with Tailwind CSS
- 📱 **Responsive design** - works on desktop and mobile

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data persistence
- **Socket.IO** for real-time WebSocket communication
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **Next.js** (React framework)
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time features
- **Axios** for HTTP requests

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 16 or higher)
2. **PostgreSQL** database running
3. **npm** or **yarn** package manager

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd Slack_Clone

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Go back to root directory
cd ..
```

### 2. Database Setup

1. **Create a PostgreSQL database:**
   ```sql
   CREATE DATABASE slack_clone;
   ```

2. **Set up environment variables:**
   - Copy `server/env.example` to `server/.env`
   - Update the database connection details:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=slack_clone
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=your_very_secure_jwt_secret_key_here
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Run database migrations:**
   ```bash
   cd server
   npm run migrate
   ```

### 3. Start the Application

You can start both the backend and frontend together:

```bash
# From the root directory
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Start the backend server
cd server
npm run dev

# Terminal 2 - Start the frontend
cd client
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## Usage Guide

### Getting Started

1. **Create an Account:**
   - Visit http://localhost:3000
   - Click "Get Started" to register
   - Fill in your display name, email, and password

2. **Create a Workspace:**
   - After logging in, create your first workspace
   - Give it a name and optional description

3. **Start Chatting:**
   - A "general" channel is created automatically
   - Start sending messages in real-time
   - Create additional channels as needed

### Key Features

- **Real-time messaging:** Messages appear instantly for all connected users
- **Multiple workspaces:** Create and switch between different workspaces
- **Channel organization:** Create topic-based channels within workspaces
- **Typing indicators:** See when others are typing
- **Message history:** All messages are saved and loaded when you return
- **Responsive design:** Works on desktop and mobile devices

## Project Structure

```
Slack_Clone/
├── server/                 # Backend Node.js application
│   ├── config/            # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/           # API route handlers
│   ├── scripts/          # Database migration scripts
│   └── index.js          # Main server file
├── client/                # Frontend Next.js application
│   ├── components/       # React components
│   ├── lib/             # Utility functions and API calls
│   ├── pages/           # Next.js pages
│   └── styles/          # CSS styles
└── package.json         # Root package.json for convenience scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Workspaces
- `GET /api/workspaces` - Get user's workspaces
- `POST /api/workspaces` - Create a new workspace
- `GET /api/workspaces/:id` - Get workspace details and channels
- `POST /api/workspaces/:id/join` - Join a workspace by ID
- `GET /api/workspaces/:id/invite-info` - Get workspace invite information

### Channels
- `POST /api/channels/:workspaceId/channels` - Create a channel
- `POST /api/channels/:channelId/join` - Join a channel
- `POST /api/channels/:channelId/leave` - Leave a channel
- `GET /api/channels/:channelId/messages` - Get channel messages

## WebSocket Events

### Client to Server
- `join-workspaces` - Join workspace rooms for workspace-level events
- `join-channels` - Join channel rooms for real-time updates
- `send-message` - Send a message to a channel
- `typing-start` - Indicate user started typing
- `typing-stop` - Indicate user stopped typing

### Server to Client
- `new-message` - Receive new messages
- `new-channel` - Receive notification of new channels (real-time)
- `user-typing` - Someone started typing
- `user-stopped-typing` - Someone stopped typing
- `error` - Error messages

## Security Features

- **Password hashing** with bcryptjs (salt rounds: 10)
- **JWT authentication** for all protected routes
- **Input validation** with Joi schemas
- **CORS protection** with specific origin allowlist
- **SQL injection protection** with parameterized queries
- **XSS protection** with Helmet.js security headers

## Development Tips

### Database Management
- Use `npm run migrate` to set up database tables
- Check PostgreSQL logs if database connection fails
- Ensure PostgreSQL service is running

### Debugging
- Check browser console for frontend errors
- Monitor server console for backend errors
- Verify WebSocket connections in browser DevTools

### Environment Variables
- Never commit the `.env` file to version control
- Use the provided `env.example` as a template
- Generate a strong JWT secret for production

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **WebSocket connection failed:**
   - Check if backend server is running on correct port
   - Verify CORS settings
   - Check browser console for errors

3. **Messages not appearing:**
   - Ensure WebSocket connection is established
   - Check if user is member of the channel
   - Verify JWT token is valid

### Getting Help

If you encounter issues:
1. Check the console logs (both browser and server)
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that PostgreSQL is running and accessible

## 🚀 Deployment

Want to get your Slack clone online? Check out the **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for step-by-step instructions!

### Quick Start (FREE)
- **Frontend**: Deploy to [Vercel](https://vercel.com) (free forever)
- **Backend**: Deploy to [Render](https://render.com) (free tier)
- **Database**: [Neon](https://neon.tech) PostgreSQL (free tier)
- **Total Cost**: $0/month ✨

See the deployment guide for detailed instructions, troubleshooting, and production tips!

---

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - How to deploy your app online
- **[CHANNEL_FIX_SUMMARY.md](./CHANNEL_FIX_SUMMARY.md)** - Technical explanation of real-time features
- **[FEATURE_IMPLEMENTATION_PLAN.md](./FEATURE_IMPLEMENTATION_PLAN.md)** - Roadmap for additional features

---

## 🎯 Future Enhancements

Potential features for future development:
- 📎 **Image upload in chat** (5MB limit with Cloudinary)
- 👤 **User profile settings** with avatar upload
- 🎨 **Workspace customization** (icons, themes)
- 👑 **User roles** (Owner, Admin, Member) with permissions
- 🔍 **Search functionality** across messages
- ⚡ **Message reactions** and threads
- ✏️ **Message editing** and deletion
- 🤖 **Bot integrations** and webhooks
- 📱 **Native mobile app** (React Native)

---

## 🤝 Contributing

This is a personal learning project, but feel free to fork and build on it!

---

## 📝 License

MIT License - feel free to use this project for learning and portfolio purposes.

---

## 🙏 Acknowledgments

Built as a full-stack learning project to understand:
- Real-time communication with WebSockets
- Modern full-stack architecture
- Database design and management
- Cloud deployment
- Authentication and security best practices

---

**Happy chatting! 💬**
