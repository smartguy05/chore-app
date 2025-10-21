# Chore App - Household Chore Management for Kids

A fun and engaging web application that helps parents manage household chores for their kids with a visual reward system.

## Features

### For Parents
- Create and manage household chores
- Assign tasks to specific kids
- Set due dates and difficulty levels
- Track completion progress
- Manage reward points and rewards
- Email/password or magic link authentication

### For Kids
- Simple PIN-based login
- View assigned chores with fun animations
- Mark tasks as complete
- Earn points and unlock rewards
- Visual progress tracking with gamification elements

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite (for simplicity)
- **Styling**: Tailwind CSS with custom animations
- **Authentication**: JWT tokens with magic link support

## Quick Start

### Option 1: Docker (Recommended for Production)

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env and set your JWT_SECRET:**
   ```bash
   nano .env  # or your preferred editor
   ```

3. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Open your browser:**
   - Application: http://localhost:5000

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md)

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the development servers:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Project Structure

```
chore-app/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package.json
└── README.md        # This file
```

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Features in Detail

### Authentication
- **Parents**: Email/password or magic link via email
- **Kids**: 4-digit PIN system for quick access

### Task Management
- Create chores with descriptions, difficulty, and points
- Assign to specific children
- Set due dates and recurring schedules
- Track completion status
- Interactive task creation modal with difficulty preview
- Points system with visual feedback

### Reward System
- Points earned per completed task
- Visual progress bars and animations
- Unlockable rewards and achievements
- Streak tracking for motivation

### UI/UX
- Kid-friendly design with bright colors
- Smooth animations and transitions
- Responsive design for tablets and phones
- Accessibility features for all ages 