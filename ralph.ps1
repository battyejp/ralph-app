# Ralph Wiggum - Long-running AI agent loop
# Usage: .\ralph.ps1 [max_iterations]

param(
    [int]$MaxIterations = 10
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PrdFile = Join-Path $ScriptDir "prd.json"
$ProgressFile = Join-Path $ScriptDir "progress.txt"
$ArchiveDir = Join-Path $ScriptDir "archive"
$LastBranchFile = Join-Path $ScriptDir ".last-branch"
$LogDir = Join-Path $ScriptDir "logs"
$LogFile = Join-Path $LogDir "ralph-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"

# Initialize log directory and file
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Helper function to write to both console and log file
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Archive previous run if branch changed
if ((Test-Path $PrdFile) -and (Test-Path $LastBranchFile)) {
    try {
        $prdContent = Get-Content $PrdFile -Raw | ConvertFrom-Json
        $CurrentBranch = $prdContent.branchName
    } catch {
        $CurrentBranch = ""
    }

    try {
        $LastBranch = Get-Content $LastBranchFile -Raw
        $LastBranch = $LastBranch.Trim()
    } catch {
        $LastBranch = ""
    }

    if ($CurrentBranch -and $LastBranch -and ($CurrentBranch -ne $LastBranch)) {
        # Archive the previous run
        $Date = Get-Date -Format "yyyy-MM-dd"
        # Strip "ralph/" prefix from branch name for folder
        $FolderName = $LastBranch -replace "^ralph/", ""
        $ArchiveFolder = Join-Path $ArchiveDir "$Date-$FolderName"

        Write-Host "Archiving previous run: $LastBranch"
        New-Item -ItemType Directory -Path $ArchiveFolder -Force | Out-Null

        if (Test-Path $PrdFile) {
            Copy-Item $PrdFile $ArchiveFolder
        }
        if (Test-Path $ProgressFile) {
            Copy-Item $ProgressFile $ArchiveFolder
        }
        Write-Host "   Archived to: $ArchiveFolder"

        # Reset progress file for new run
        @(
            "# Ralph Progress Log",
            "Started: $(Get-Date)",
            "---"
        ) | Set-Content $ProgressFile
    }
}

# Track current branch
if (Test-Path $PrdFile) {
    try {
        $prdContent = Get-Content $PrdFile -Raw | ConvertFrom-Json
        $CurrentBranch = $prdContent.branchName
        if ($CurrentBranch) {
            $CurrentBranch | Set-Content $LastBranchFile
        }
    } catch {
        # Ignore errors reading prd.json
    }
}

# Initialize progress file if it doesn't exist
if (-not (Test-Path $ProgressFile)) {
    @(
        "# Ralph Progress Log",
        "Started: $(Get-Date)",
        "---"
    ) | Set-Content $ProgressFile
}

Write-Log "Starting Ralph - Max iterations: $MaxIterations"
Write-Log "Log file: $LogFile"

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host ""
    Write-Host "======================================================="
    Write-Host "  Ralph Iteration $i of $MaxIterations"
    Write-Host "======================================================="
    Add-Content -Path $LogFile -Value ""
    Add-Content -Path $LogFile -Value "======================================================="
    Add-Content -Path $LogFile -Value "  Ralph Iteration $i of $MaxIterations"
    Add-Content -Path $LogFile -Value "======================================================="

    # Run claude with the ralph prompt
    $PromptFile = Join-Path $ScriptDir "prompt.md"
    $PromptContent = Get-Content $PromptFile -Raw

    try {
        # Pipe prompt to claude, display it, and capture to log file
        $Output = $PromptContent | claude --verbose --dangerously-skip-permissions 2>&1 | ForEach-Object {
            $line = $_
            Write-Host $line
            Add-Content -Path $LogFile -Value $line
            $line
        }
        $Output = $Output -join "`n"
    } catch {
        $Output = ""
        Write-Log "Claude execution failed: $_"
    }

    # Check for completion signal
    if ($Output -match "<promise>COMPLETE</promise>") {
        Write-Host ""
        Write-Log "Ralph completed all tasks!"
        Write-Log "Completed at iteration $i of $MaxIterations"
        exit 0
    }

    Write-Log "Iteration $i complete. Continuing..."
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Log "Ralph reached max iterations ($MaxIterations) without completing all tasks."
Write-Log "Check $ProgressFile for status."
Write-Log "Check $LogFile for full log."
exit 1
