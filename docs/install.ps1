# Maut code is now Dovo. This forwards to Dovo's installer, which moves your Maut code settings
# and extensions over and uninstalls the old app.
Write-Host ''
Write-Host '  Maut code is now Dovo. Installing Dovo...' -ForegroundColor Yellow
Invoke-RestMethod https://jmkq0056.github.io/dovo/install.ps1 | Invoke-Expression
