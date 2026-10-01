<#
.SYNOPSIS
    Builds an Android APK of the app.

.EXAMPLE
    .\build-apk.ps1            # debug APK (no signing needed, good for sideloading)
    .\build-apk.ps1 -Release   # signed release APK using signing\keystore
#>
param(
    [switch]$Release,
    [string]$KeystoreAlias = 'KJ'
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

function Invoke-Step([string]$name, [scriptblock]$action) {
    Write-Host "`n==> $name" -ForegroundColor Cyan
    & $action
    if ($LASTEXITCODE -ne 0) { throw "$name failed (exit code $LASTEXITCODE)" }
}

# Gradle needs a JDK; fall back to the one bundled with Android Studio
if (-not $env:JAVA_HOME) {
    $studioJdk = 'C:\Program Files\Android\Android Studio\jbr'
    if (Test-Path $studioJdk) {
        $env:JAVA_HOME = $studioJdk
        Write-Host "JAVA_HOME set to $studioJdk"
    } else {
        throw 'JAVA_HOME is not set and Android Studio JDK was not found. Install a JDK or set JAVA_HOME.'
    }
}

Invoke-Step 'Building web app' { pnpm run build }
Invoke-Step 'Syncing Capacitor Android project' { pnpm exec cap sync android }

$outDir = Join-Path $root 'apk'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'

$envFile = Join-Path $root 'src\environments\environment.ts'
$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch "version\s*:\s*['""](\d+\.\d+\.\d+)['""]") {
    throw "Expected a numeric major.minor.patch version in $envFile"
}
$version = $Matches[1]
$versionTag = if ($version -match '^v') { $version } else { "v$version" }
Write-Host "App version: $versionTag" -ForegroundColor Yellow

if ($Release) {
    $keystore = Join-Path $root 'signing\keystore'
    if (-not (Test-Path $keystore)) { throw "Keystore not found at $keystore" }

    $securePass = Read-Host "Keystore password for alias '$KeystoreAlias'" -AsSecureString
    $pass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass))

    try {
        Invoke-Step 'Building signed release APK' {
            pnpm exec cap build android `
                --keystorepath $keystore `
                --keystorepass $pass `
                --keystorealias $KeystoreAlias `
                --keystorealiaspass $pass `
                --androidreleasetype APK
        }
    } finally {
        $pass = $null
    }

    $apk = Get-ChildItem (Join-Path $root 'android\app\build\outputs\apk\release') -Filter '*.apk' |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $target = Join-Path $outDir "HomeBudget-$versionTag-release-$stamp.apk"
} else {
    Push-Location (Join-Path $root 'android')
    try {
        Invoke-Step 'Building debug APK' { .\gradlew.bat assembleDebug }
    } finally {
        Pop-Location
    }

    $apk = Get-Item (Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk')
    $target = Join-Path $outDir "HomeBudget-$versionTag-debug-$stamp.apk"
}

if (-not $apk) { throw 'Build finished but no APK was found.' }

Copy-Item $apk.FullName $target -Force
Write-Host "`nAPK ready: $target" -ForegroundColor Green
