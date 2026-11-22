$ErrorActionPreference = 'Stop'
# Keep paths and CLI arguments out of interpolated PowerShell code.
$request = @{
    launcher = $args[0]
    arguments = @($args | Select-Object -Skip 1)
} | ConvertTo-Json -Compress -Depth 4
$payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($request))
$command = '$request = ConvertFrom-Json -InputObject ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(''' + $payload + '''))); $forward = @($request.arguments); & $request.launcher @forward; exit $LASTEXITCODE'
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
try {
    $process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand',$encoded) -Wait -PassThru
    exit $process.ExitCode
} catch {
    Write-Host 'No se concedieron permisos de administrador. El gestor no se inicio.'
    exit 1
}
