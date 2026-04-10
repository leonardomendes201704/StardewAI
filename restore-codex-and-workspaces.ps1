[CmdletBinding()]
param(
  [string]$ZipPath = "",
  [string]$RestoreRoot = "$env:TEMP\codex-restore",
  [string]$CodexHomeTarget = "$env:USERPROFILE\.codex",
  [string]$WorkspacesRootTarget = "C:\Leonardo\Labs",
  [switch]$OverwriteExisting,
  [switch]$AllowCodexRunning
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
  param([string]$CommandName)
  return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Resolve-LatestBackupZip {
  param([string]$SearchRoot)

  if (-not (Test-Path -LiteralPath $SearchRoot)) {
    return $null
  }

  return Get-ChildItem -LiteralPath $SearchRoot -Filter 'codex-full-backup_*.zip' -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

function Assert-SafeTarget {
  param([string]$Path)

  $resolved = [System.IO.Path]::GetFullPath($Path)

  if ($resolved.Length -lt 6) {
    throw "Target path is too short to be considered safe: $resolved"
  }

  if ($resolved -match '^[A-Za-z]:\\?$') {
    throw "Refusing to operate on drive root: $resolved"
  }

  return $resolved
}

function Copy-DirectoryContent {
  param(
    [string]$Source,
    [string]$Target
  )

  New-Item -ItemType Directory -Force -Path (Split-Path -Path $Target -Parent) | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Target -Recurse -Force
}

if (-not (Test-CommandExists -CommandName 'tar.exe')) {
  throw "Nao encontrei o tar.exe no PATH. Este script usa o tar nativo do Windows para extrair o ZIP."
}

$codexProcesses = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessName -match '^(Codex|codex)$' }

if ($codexProcesses -and -not $AllowCodexRunning) {
  $processList = ($codexProcesses | ForEach-Object { "$($_.ProcessName)#$($_.Id)" }) -join ', '
  throw "Feche completamente o Codex antes do restore. Processos detectados: $processList. Se quiser ignorar isso, rode com -AllowCodexRunning."
}

if ([string]::IsNullOrWhiteSpace($ZipPath)) {
  $latestZip = Resolve-LatestBackupZip -SearchRoot "$env:USERPROFILE\Desktop"

  if (-not $latestZip) {
    throw "Nao encontrei um ZIP padrao na Area de Trabalho. Informe -ZipPath explicitamente."
  }

  $ZipPath = $latestZip.FullName
}

if (-not (Test-Path -LiteralPath $ZipPath)) {
  throw "Nao encontrei o ZIP informado: $ZipPath"
}

$CodexHomeTarget = Assert-SafeTarget -Path $CodexHomeTarget
$WorkspacesRootTarget = Assert-SafeTarget -Path $WorkspacesRootTarget

Write-Step "Preparando staging do restore"
if (Test-Path -LiteralPath $RestoreRoot) {
  Remove-Item -LiteralPath $RestoreRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $RestoreRoot | Out-Null

Write-Step "Extraindo ZIP"
& tar.exe -xf $ZipPath -C $RestoreRoot

$extractedCodexHome = Join-Path $RestoreRoot '.codex'
$extractedWorkspacesRoot = Join-Path $RestoreRoot 'Labs'

if (-not (Test-Path -LiteralPath $extractedCodexHome)) {
  throw "Nao encontrei .codex dentro do ZIP extraido."
}

if (-not (Test-Path -LiteralPath $extractedWorkspacesRoot)) {
  throw "Nao encontrei Labs dentro do ZIP extraido."
}

if ((Test-Path -LiteralPath $CodexHomeTarget) -and -not $OverwriteExisting) {
  throw "O destino do Codex ja existe: $CodexHomeTarget. Rode novamente com -OverwriteExisting para substituir."
}

if ((Test-Path -LiteralPath $WorkspacesRootTarget) -and -not $OverwriteExisting) {
  throw "O destino dos workspaces ja existe: $WorkspacesRootTarget. Rode novamente com -OverwriteExisting para substituir."
}

Write-Step "Restaurando pastas"
if (Test-Path -LiteralPath $CodexHomeTarget) {
  Remove-Item -LiteralPath $CodexHomeTarget -Recurse -Force
}

if (Test-Path -LiteralPath $WorkspacesRootTarget) {
  Remove-Item -LiteralPath $WorkspacesRootTarget -Recurse -Force
}

Copy-DirectoryContent -Source $extractedCodexHome -Target $CodexHomeTarget
Copy-DirectoryContent -Source $extractedWorkspacesRoot -Target $WorkspacesRootTarget

Write-Step "Limpando staging"
Remove-Item -LiteralPath $RestoreRoot -Recurse -Force

Write-Step "Restore concluido"
Write-Host "Codex restaurado em : $CodexHomeTarget" -ForegroundColor Green
Write-Host "Labs restaurado em  : $WorkspacesRootTarget" -ForegroundColor Green

Write-Host ""
Write-Host "Proximo passo sugerido:" -ForegroundColor Cyan
Write-Host "Abra o Codex IDE. Se a autenticacao nao for reaproveitada automaticamente, faca login novamente."
