@echo off
title Campus Pulse - AI Announcement Management Platform
echo ============================================================
echo   CAMPUS PULSE - AI-Powered Announcement Management
echo   "Never Miss What's Happening on Campus."
echo ============================================================
echo.
echo Starting Campus Pulse Server...
echo.
"%~dp0tools\node\node.exe" "%~dp0server\src\index.js"
pause

