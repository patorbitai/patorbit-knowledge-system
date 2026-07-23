# ── Patorbit API — Docker Deployment Script (PowerShell) ────────────────
# Usage: .\apps\api\scripts\deploy.ps1 [-Environment <staging|production>]

param(
  [ValidateSet("staging", "production")]
  [string]$Environment = "staging"
)

$ImageName = "patorbit/api"
$Tag = "${Environment}-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "==> Building Docker image: ${ImageName}:${Tag}"
docker build -f apps/api/Dockerfile -t "${ImageName}:${Tag}" -t "${ImageName}:latest" .

if ($Environment -eq "staging") {
  Write-Host "==> Deploying to staging..."
  # docker tag "${ImageName}:${Tag}" "registry.example.com/${ImageName}:${Tag}"
  # docker push "registry.example.com/${ImageName}:${Tag}"
  Write-Host "    [staging] Push & deploy commands go here."
} else {
  Write-Host "==> Deploying to production..."
  Write-Host "    [production] Push & deploy commands go here."
}

Write-Host "==> Done: ${ImageName}:${Tag}"
