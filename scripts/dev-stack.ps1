<# Start the Linux development stack from native Windows without elevation. #>
[CmdletBinding()]
param(
    [ValidateSet('up', 'down', 'reset', 'build', 'ps', 'logs', 'config', 'guidelines-logs')]
    [string]$Action = 'up',
    [switch]$ConfirmReset
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI is missing. Install/start Docker Desktop with its WSL2 Linux backend and reopen your terminal.'
    }
    if (-not (Test-Path 'infra/development.env' -PathType Leaf)) {
        throw 'Missing infra/development.env. Restore the development configuration; do not use production credentials.'
    }
    & docker compose version
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose v2 is required (docker compose, not docker-compose).'
    }
    $dockerOS = & docker info --format '{{.OSType}}'
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker daemon is unavailable. Start Docker Desktop, select Linux containers/WSL2, and check docker context ls. Do not run this launcher with sudo or elevation.'
    }
    if ("$dockerOS".Trim() -ne 'linux') {
        throw 'This stack requires Linux containers. Switch Docker Desktop to Linux containers and enable its WSL2 backend.'
    }
    $composeArgs = @('compose', '--env-file', 'infra/development.env', '-f', 'infra/docker-compose.yml', '-f', 'infra/docker-compose.dev.yml')
    & docker @composeArgs config --quiet
    if ($LASTEXITCODE -ne 0) {
        throw 'Development Compose configuration is invalid. Fix the error above before starting the stack.'
    }
    $operation = switch ($Action) {
        'up' { @('up', '-d', '--build') }
        'down' { @('down', '--remove-orphans') }
        'reset' {
            if (-not $ConfirmReset) {
                throw 'Reset deletes development database/storage volumes. Rerun with -ConfirmReset only if intentional.'
            }
            @('down', '--volumes', '--remove-orphans')
        }
        'build' { @('build') }
        'ps' { @('ps') }
        'logs' { @('logs', '-f') }
        'guidelines-logs' { @('logs', '-f', 'guidelines') }
        'config' { @('config', '--quiet') }
    }
    & docker @composeArgs @operation
    $stackExitCode = $LASTEXITCODE
    if ($stackExitCode -ne 0) {
        Write-Warning 'Compose failed. Run this launcher with -Action ps or -Action logs; do not delete volumes to troubleshoot.'
    }
    exit $stackExitCode
}
catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
finally {
    Pop-Location
}
