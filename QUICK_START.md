# ⚡ Quick Start Guide

Get your Slack clone running in 5 minutes!

## 📋 Prerequisites

- ✅ Node.js installed (v16+): `node --version`
- ✅ PostgreSQL installed and running: `psql --version`
- ✅ Git installed (for deployment later)

---

## 🚀 Local Development Setup

### 1. Database Setup (2 minutes)

Open your terminal and run:

```bash
# Create database
psql -U postgres
CREATE DATABASE slack_clone;
\q
```

### 2. Environment Variables (1 minute)

```bash
# Navigate to server directory
cd server

# Copy example environment file
cp env.example .env

# Edit .env file with your details
# On Mac/Linux:
nano .env

# On Windows:
notepad .env
```

Update these values in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slack_clone
DB_USER=postgres          # Your PostgreSQL username
DB_PASSWORD=your_password # Your PostgreSQL password
JWT_SECRET=change-this-to-a-long-random-string
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Generate a secure JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install & Run (2 minutes)

```bash
# Go back to root directory
cd ..

# Install all dependencies (root, server, and client)
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Run database migration
cd server
npm run migrate

# You should see:
# ✅ Users table created
# ✅ Workspaces table created
# ✅ Channels table created
# etc.

# Go back to root
cd ..

# Start both frontend and backend
npm run dev
```

**That's it!** 🎉

Visit: **http://localhost:3000**

---

## 🧪 Test It Out

1. **Create an account** - Sign up with any email
2. **Create a workspace** - Give it a name
3. **Start chatting** - Send messages in the "general" channel
4. **Test real-time** - Open in two browser windows (one incognito)
5. **Invite someone** - Click "Invite" and share the 8-digit code

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
# Mac:
brew services list

# Linux:
sudo systemctl status postgresql

# Windows:
services.msc (look for PostgreSQL)

# If not running, start it:
# Mac:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### "Port 3001 already in use"
```bash
# Kill the process using port 3001
# Mac/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
cd server && rm -rf node_modules package-lock.json
cd ../client && rm -rf node_modules package-lock.json
cd ..

# Install again
npm install
cd server && npm install
cd ../client && npm install
```

---

## 📝 Next Steps

✅ **App works locally?** 

Now you can:

1. **Deploy it online** → See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Add more features** → See [FEATURE_IMPLEMENTATION_PLAN.md](./FEATURE_IMPLEMENTATION_PLAN.md)
3. **Read the docs** → See [README.md](./README.md)

---

## 💡 Pro Tips

- **Hot reload**: Changes to code auto-refresh (no need to restart)
- **Logs**: Check terminal for errors and debug info
- **Database**: Use a tool like TablePlus or pgAdmin to view data
- **Testing**: Use incognito mode for second user

---

**Need help?** Check the [Troubleshooting section](./README.md#troubleshooting) in the main README!

**Ready to deploy?** Follow the [Deployment Guide](./DEPLOYMENT_GUIDE.md)!

---

Happy coding! 🚀
