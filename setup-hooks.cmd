@echo off
REM Script to setup Git hooks on Windows

echo Setting up Git hooks...

git config core.hooksPath .githooks

if %errorlevel% equ 0 (
    echo ✅ Git hooks configured successfully!
    echo Hooks will now run from .githooks directory
) else (
    echo ❌ Failed to configure Git hooks
    exit /b 1
)
