---
description: How to run FoodLink Campus project locally
---

# Running FoodLink Campus Project

## Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed
- MongoDB running (or using MongoDB Atlas)

---

## Quick Start (2 Terminals Required)

### Terminal 1: Start Backend (Django)
```powershell
cd c:\Users\ASUS\Downloads\project\latest_test\backend
python manage.py runserver
```
Backend runs at: **http://localhost:8000**

### Terminal 2: Start Frontend (React/Vite)
```powershell
cd c:\Users\ASUS\Downloads\project\latest_test\frontend
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## First Time Setup (One-time only)

### 1. Install Backend Dependencies
```powershell
cd c:\Users\ASUS\Downloads\project\latest_test\backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```powershell
cd c:\Users\ASUS\Downloads\project\latest_test\frontend
npm install
```

---

## Access the Application
Open your browser and go to: **http://localhost:5173**

## Demo Accounts
| Role     | Username       | Password  |
|----------|----------------|-----------|
| Student  | demo_student   | demo123   |
| Staff    | demo_staff     | demo123   |
| Charity  | demo_charity   | demo123   |
| Admin    | demo_admin     | demo123   |

---

## Stop the Project
Press `Ctrl + C` in each terminal window to stop the servers.
