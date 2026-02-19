@echo off
echo ==========================================
echo   FoodLink Campus - Startup Script
echo ==========================================

echo [1/3] Starting Backend Server (Django)...
start "FoodLink Backend" cmd /k "cd backend && python manage.py runserver"

echo [2/3] Starting Frontend Server (React/Vite)...
start "FoodLink Frontend" cmd /k "cd frontend && npm run dev"

echo [3/3] Opening Application in Browser...
timeout /t 5 >nul
start http://localhost:5173


echo ==========================================
echo   Done! App is running.
echo   - Backend: http://localhost:8000/api
echo   - Frontend: http://localhost:5173
echo   (Close the popup terminal windows to stop the servers)
echo ==========================================
pause
