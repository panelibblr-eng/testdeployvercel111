# PowerShell script to kill process on port 3001

Write-Host "🔍 Finding process on port 3001..." -ForegroundColor Yellow

$port = netstat -ano | findstr :3001 | Select-String "LISTENING"

if ($port) {
    $processId = ($port -split '\s+')[-1]
    Write-Host "⚠️  Found process PID: $processId" -ForegroundColor Yellow
    Write-Host "🛑 Stopping process..." -ForegroundColor Yellow
    
    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "✅ Process stopped successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Port 3001 is now free. You can start your server." -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not stop process automatically." -ForegroundColor Red
        Write-Host "   Try manually: taskkill /PID $pid /F" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Port 3001 is free" -ForegroundColor Green
}

