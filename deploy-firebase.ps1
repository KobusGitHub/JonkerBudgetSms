param([switch]$BuildOnly)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$previousSmsSetting = $env:VITE_SMS_ENABLED
try {
    $env:VITE_SMS_ENABLED = 'false'
    Write-Host 'Building web app with SMS screens disabled...'
    pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed (exit code $LASTEXITCODE)" }
} finally {
    $env:VITE_SMS_ENABLED = $previousSmsSetting
}

if ($BuildOnly) {
    Write-Host 'Web build ready in dist.'
    return
}

Write-Host 'Checking Firebase sign-in...'
pnpm exec firebase login --reauth
if ($LASTEXITCODE -ne 0) { throw "Firebase login failed (exit code $LASTEXITCODE)" }

Write-Host 'Deploying to Firebase Hosting (jonkerbudget)...'
pnpm exec firebase deploy --only hosting --project jonkerbudget --non-interactive
if ($LASTEXITCODE -ne 0) { throw "Firebase deploy failed (exit code $LASTEXITCODE)" }