Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CAMPUS PULSE - AI-Powered Announcement Management" -ForegroundColor White
Write-Host "  'Never Miss What's Happening on Campus.'" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Campus Pulse on http://localhost:5000 ..." -ForegroundColor Green
Write-Host ""

$node = Join-Path $PSScriptRoot "tools\node\node.exe"
$server = Join-Path $PSScriptRoot "server\src\index.js"

& $node $server

