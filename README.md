# 🌱 FoodLink Campus

> Smart surplus food management platform for college canteens — connecting staff, students, and charities to minimize food waste through real-time redistribution.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?logo=tailwindcss&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
  - [Database Setup](#3-database-setup)
  - [Environment Configuration](#4-environment-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [User Roles & Demo Accounts](#-user-roles--demo-accounts)
- [API Endpoints](#-api-endpoints)
- [AI Features](#-ai-features)

---

## 🎯 Overview

FoodLink Campus is a comprehensive web platform designed to tackle food waste in college canteens. The system enables:

- **Canteen Staff (Donors)** to list surplus food with mandatory hygiene compliance checks. Staff are categorized by Institution Type (School/Canteen).
- **Students (Recipients)** to discover and reserve available food items. **Note:** Students must upload a valid Student ID Card for verification before they can reserve food.
- **Charities** to collect unclaimed bulk food with optimized pickup routes.
- **Administrators** to manage users, verify student IDs, monitor analytics, and generate AI-powered impact reports.

---

## ✨ Features

### For Students
- 🆔 **ID Verification**: Secure account activation by uploading Student ID card (Admin approval required).
- 🍽️ **Food Feed**: Browse real-time food availability with filters (Veg/Non-Veg).
- 📱 **Reservations**: Reserve specific quantities of food items.
- 🎟️ **QR Code Pickup**: Receive unique QR codes for secure food collection.
- 🏆 **Gamification**: Earn "Green Points" for every rescue and compete on the Leaderboard.
- 🎁 **Rewards**: Unlock partner discounts (Swiggy, Zomato, etc.) by earning points.
- 🤖 **Eco-Bot**: AI-powered assistant for sustainability questions.

### For Canteen Staff
- 📝 **Easy Listing**: List surplus food with name, quantity, expiry, and type.
- ✅ **Hygiene Checks**: Mandatory compliance checklist (temperature, packaging, storage).
- 📷 **QR Scanner**: Built-in scanner to verify student pickups and prevent fraud.
- 🏢 **Organization Tracking**: Manage listings for specific institutions (Schools/Canteens).

### For Charities
- 🚚 **Escalation Management**: View food items that weren't collected by students (escalated for bulk pickup).
- 🗺️ **Route Optimization**: Plan pickup routes for multiple stops.
- ✔️ **Collection Tracking**: Mark bulk collections as completed.

### For Administrators
- 👥 **User Management**: View all users and their status.
- 🛡️ **Student Verification**: specialized interface to view uploaded ID cards and Approve/Reject student accounts.
- 📈 **Analytics Dashboard**: Real-time stats on food saved, meals distributed, and CO2 reduction.
- 📑 **AI Impact Reports**: Generate narrative impact summaries using Google Gemini.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.3, Lucide Icons, Framer Motion |
| **Backend** | Django 4.2, Django REST Framework 3.14 |
| **Database** | MongoDB (via MongoEngine ODM) |
| **Authentication** | JWT (Simple JWT), Google OAuth2 |
| **AI Integration** | Google Gemini API (`google-genai` SDK) |
| **Deployment** | (Local) Windows/Linux/Mac compatible |

---

## 📦 Prerequisites

Before installation, ensure you have the following installed:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Python** | 3.10 or higher | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18 or higher | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

---

## 🚀 Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install
```

### 3. Database Setup

1. **Install MongoDB Community Edition** from [mongodb.com](https://www.mongodb.com/try/download/community)
2. **Start MongoDB service:**
   ```bash
   # Windows (Admin Command Prompt)
   net start MongoDB
   ```
3. **Run Django Migrations (optional/if needed for session/admin):**
   ```bash
   cd backend
   python manage.py migrate
   ```

### 4. Environment Configuration

Create a `.env` file in the root directory.

```env
# Email Configuration (Required for OTPs)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Security
SECRET_KEY=your-django-secret-key
DEBUG=True
```

---

## ▶️ Running the Application

### ⚡ Quick Start (Windows)
Double-click `run_project.bat` in the root directory.
This script automatically:
1. Starts the MongoDB service (requests Admin access if needed).
2. Starts the Django Backend server (Port 8000).
3. Starts the React Frontend server (Port 5173).
4. Opens the app in your default browser.

### Manual Startup

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📁 Project Structure

```
foodlink-campus/
├── .env                    # Secrets
├── run_project.bat         # Windows One-Click Launcher
├── backend/                # Django REST API
│   ├── foodlink/           # Settings
│   └── api/                # Application Logic
│       ├── models.py       # User, FoodItem, Reservation Models
│       ├── views.py        # API Controllers
│       ├── serializers.py  # Data Validation
│       └── urls.py         # Routes
│
└── frontend/               # React Application
    ├── src/
    │   ├── context/        # Auth & Theme State
    │   ├── components/     # Reusable UI (Navbar, Cards)
    │   ├── pages/
    │   │   ├── auth/       # Login, Register, Profile
    │   │   ├── student/    # Dashboard, Feed, Profile (ID Upload)
    │   │   ├── admin/      # User Management, Reports
    │   │   └── ...
    │   └── services/       # axios API calls
```

---

## 👥 User Roles & Demo Accounts

| Role | Username | Password | Capabilities |
|------|----------|----------|--------------|
| **Student** | `demo_student` | `demo123` | Reserve food, Upload ID Card, View Points. **(Requires Admin Approval)** |
| **Staff** | `demo_staff` | `demo123` | List food, Perform Hygiene Checks, Scan QRs. |
| **Charity** | `demo_charity` | `demo123` | Bulk pickup management. |
| **Admin** | `demo_admin` | `demo123` | **Approve Students**, View Reports, Manage Users. |

---

## 🔌 API Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register with Email OTP verification. |
| POST | `/api/auth/login/` | Direct Login (Username/Password). |
| PUT | `/api/auth/profile/` | Update profile / Upload ID Card. |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users/` | List users (filter by role). |
| PUT | `/api/admin/users/{id}/` | **Approve Student** / Edit User. |
| GET | `/api/stats/report/` | AI Impact Report. |

### Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/food/` | Food Feed. |
| POST | `/api/reservations/` | Create Reservation. |
| GET | `/api/leaderboard/` | Top students. |
| POST | `/api/chat/` | Eco-Bot. |

---

<p align="center">
  Made with 💚 to fight food insecurity
</p>
