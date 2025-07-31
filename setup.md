# Chore App Setup Guide

## Quick Start

### 1. Install Dependencies

Run this command to install all dependencies for both frontend and backend:

```bash
npm run install-all
```

### 2. Set Up Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (optional - for magic links)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Note:** For magic link emails to work, you'll need to:
1. Use a Gmail account
2. Enable 2-factor authentication
3. Generate an App Password
4. Use the App Password in SMTP_PASS

### 3. Start the Application

Run both frontend and backend servers:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 4. First Time Setup

1. **Create a Parent Account:**
   - Go to http://localhost:3000
   - Click "Parents" tab
   - Click "Don't have an account? Sign up"
   - Fill in your details and create an account

2. **Add Your Kids:**
   - After logging in as a parent, go to the "Kids" tab
   - Click "Add Kid"
   - Enter their name and create a 4-digit PIN
   - Share the PIN with your child

3. **Create Tasks:**
   - Go to the "Tasks" tab
   - Click "Create Task"
   - Fill in task details and assign to a child

4. **Set Up Rewards:**
   - Go to the "Rewards" tab
   - Click "Create Reward"
   - Set up rewards your kids can redeem with their points

### 5. Kid Login

Your kids can now log in using:
- Go to http://localhost:3000
- Click "Kids" tab
- Enter their 4-digit PIN

## Features

### For Parents:
- ✅ Create and manage household chores
- ✅ Assign tasks to specific kids
- ✅ Set due dates and difficulty levels
- ✅ Track completion progress
- ✅ Manage reward points and rewards
- ✅ Email/password or magic link authentication

### For Kids:
- ✅ Simple PIN-based login
- ✅ View assigned chores with fun animations
- ✅ Mark tasks as complete
- ✅ Earn points and unlock rewards
- ✅ Visual progress tracking with gamification elements

## Tech Stack

- **Frontend:** React 18 with TypeScript
- **Backend:** Node.js with Express
- **Database:** SQLite (for simplicity)
- **Styling:** Tailwind CSS with custom animations
- **Authentication:** JWT tokens with magic link support

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   - Change the PORT in server/.env
   - Or kill the process using the port

2. **Database errors:**
   - Delete the `server/chore_app.db` file
   - Restart the server (it will recreate the database)

3. **Magic link emails not working:**
   - Check your SMTP settings
   - Make sure you're using an App Password, not your regular password
   - Check your spam folder

4. **Frontend not connecting to backend:**
   - Make sure both servers are running
   - Check that the proxy setting in client/package.json points to the correct backend URL

## Development

### Project Structure:
```
chore-app/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── ...
├── server/          # Node.js backend
│   ├── routes/
│   ├── database.js
│   └── ...
├── package.json     # Root package.json
└── README.md
```

### Available Scripts:
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start only the backend
- `npm run client` - Start only the frontend
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install all dependencies

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Generate a secure JWT_SECRET
3. Set up proper email configuration
4. Build the frontend: `npm run build`
5. Serve the built files from your backend
6. Use a production database (PostgreSQL, MySQL, etc.)

## Contributing

Feel free to contribute to this project! Some ideas for improvements:

- Add more gamification elements
- Implement recurring tasks
- Add task categories
- Create mobile app versions
- Add family statistics and reports
- Implement task templates
- Add photo verification for completed tasks 