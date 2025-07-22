@echo off
echo Installing Tailwind CSS in current directory...
echo.

npm install tailwindcss @tailwindcss/cli

if %errorlevel% equ 0 (
    echo.
    echo Installation complete!
) else (
    echo.
    echo Installation failed.
)

echo.
pause