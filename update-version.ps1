# Cache Version Update Script
# Usage: .\update-version.ps1 1.0.1

param(
    [Parameter(Mandatory=$true)]
    [string]$NewVersion
)

# Validate version format (X.X.X)
if ($NewVersion -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Error: Version must be in format X.X.X (e.g., 1.0.1)" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Updating cache version to $NewVersion..." -ForegroundColor Cyan

# Get current version from version.js
$versionFile = "public/version.js"
$currentContent = Get-Content $versionFile -Raw
if ($currentContent -match "APP_VERSION = '(\d+\.\d+\.\d+)'") {
    $oldVersion = $matches[1]
    Write-Host "   Current version: $oldVersion" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Warning: Could not detect current version" -ForegroundColor Yellow
    $oldVersion = "0.0.0"
}

# Update version.js
Write-Host "   Updating version.js..." -ForegroundColor Gray
(Get-Content $versionFile) -replace "APP_VERSION = '.*?'", "APP_VERSION = '$NewVersion'" | Set-Content $versionFile

# Update index.html
Write-Host "   Updating index.html..." -ForegroundColor Gray
(Get-Content "public/index.html") -replace "\?v=$oldVersion", "?v=$NewVersion" | Set-Content "public/index.html"

# Update admin.html
Write-Host "   Updating admin.html..." -ForegroundColor Gray
(Get-Content "public/admin.html") -replace "\?v=$oldVersion", "?v=$NewVersion" | Set-Content "public/admin.html"

Write-Host ""
Write-Host "✅ Version successfully updated from $oldVersion to $NewVersion!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Files updated:" -ForegroundColor Cyan
Write-Host "   - public/version.js"
Write-Host "   - public/index.html"
Write-Host "   - public/admin.html"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test your changes locally"
Write-Host "   2. Commit the changes: git add . && git commit -m 'Update cache version to $NewVersion'"
Write-Host "   3. Push to production: git push"
Write-Host "   4. Restart server if needed"
Write-Host ""
