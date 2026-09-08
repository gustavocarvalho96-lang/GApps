$ErrorActionPreference = 'Stop'
$hmaPreviousKey = $env:OPENAI_API_KEY
try {
    $hmaNodeCommand = Get-Command node -ErrorAction SilentlyContinue
    $hmaNode = if ($hmaNodeCommand) { $hmaNodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
    if (!(Test-Path -LiteralPath $hmaNode)) { throw 'Node.js nao encontrado. Instale Node.js 22 ou superior.' }
    if (Get-NetTCPConnection -LocalPort 5174 -State Listen -ErrorAction SilentlyContinue) {
        throw 'A porta 5174 ja esta em uso. Feche o servidor anterior antes de abrir este atalho.'
    }
    Write-Host 'GPlantao - revisao da HMA com IA'
    Write-Host 'A chave sera usada somente nesta sessao e nao sera salva em arquivo.'
    if (!$env:OPENAI_API_KEY) {
        $hmaSecret = Read-Host 'Cole sua chave OpenAI e pressione Enter (entrada oculta)' -AsSecureString
        $env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $hmaSecret).Password
        $hmaSecret.Dispose()
    }
    if ([string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) { throw 'Nenhuma chave informada.' }
    $env:PORT = '5174'
    $env:HMA_OPEN_BROWSER = '1'
    Write-Host 'Mantenha esta janela aberta enquanto usa a IA. Para encerrar, pressione Ctrl+C.'
    & $hmaNode (Join-Path $PSScriptRoot 'server.mjs')
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host 'Pressione Enter para fechar'
} finally {
    $env:OPENAI_API_KEY = $hmaPreviousKey
    Remove-Item Env:HMA_OPEN_BROWSER -ErrorAction SilentlyContinue
}
