<#
.SYNOPSIS
  Roda os testes do Acta num navegador de verdade, sem janela.

.DESCRIPTION
  Sobe o servidor (tests/servidor.py) com os cabeçalhos da produção, gera
  as páginas de teste e abre cada uma no Edge headless. Cada página relata
  o resultado por HTTP, e este script espera pela marca "### FIM".

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tests\rodar.ps1
  powershell -ExecutionPolicy Bypass -File tests\rodar.ps1 -Casos index,conversas
  powershell -ExecutionPolicy Bypass -File tests\rodar.ps1 -PularLentos
#>
param(
  # Quais casos rodar. Vazio = todos.
  [string[]] $Casos = @(),
  # Pula o caso da transcrição, que baixa ~40 MB na primeira execução.
  [switch] $PularLentos,
  [int] $Porta = 8731,
  [int] $TimeoutSegundos = 420
)

$ErrorActionPreference = "Stop"

$raizTestes = Split-Path -Parent $MyInvocation.MyCommand.Path
$raiz = Split-Path -Parent $raizTestes
$relato = Join-Path $raizTestes "relato.txt"
$perfil = Join-Path $env:TEMP "acta-testes-perfil"

# O perfil é reaproveitado de propósito: é nele que ficam os caches do
# modelo do Whisper e do runtime, e sem isso a transcrição baixaria
# dezenas de megabytes a cada execução.

function Achar-Navegador {
  $candidatos = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
  )
  foreach ($c in $candidatos) { if (Test-Path $c) { return $c } }
  throw "Não achei Edge nem Chrome. Estes testes precisam de um navegador Chromium."
}

function Parar-Servidores {
  Get-CimInstance Win32_Process -Filter "Name like '%python%'" |
    Where-Object { $_.CommandLine -like "*tests?servidor.py*" -or $_.CommandLine -like "*tests/servidor.py*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

$navegador = Achar-Navegador

Write-Host "gerando as paginas de teste..." -ForegroundColor DarkGray
& python (Join-Path $raizTestes "gerar.py") | Out-Null

Parar-Servidores
Start-Sleep -Milliseconds 500
Start-Process -FilePath "python" `
  -ArgumentList (Join-Path $raizTestes "servidor.py"), $Porta, $raiz, $relato `
  -WindowStyle Hidden
Start-Sleep -Seconds 2

$build = Join-Path $raizTestes "build"
$todos = Get-ChildItem -Path $build -Filter *.html | ForEach-Object { $_.BaseName }
if ($Casos.Count -gt 0) { $todos = $todos | Where-Object { $Casos -contains $_ } }
if ($PularLentos) { $todos = $todos | Where-Object { $_ -ne "transcricao" } }

$falharam = @()

foreach ($caso in $todos) {
  if (Test-Path $relato) { Remove-Item -LiteralPath $relato -Force }

  # O caso da transcrição é assíncrono e demora; os demais terminam no
  # DOMContentLoaded. --remote-debugging-port mantém o navegador vivo
  # enquanto o teste roda (sem ele, o headless encerra cedo demais).
  $proc = Start-Process -FilePath $navegador -PassThru -ArgumentList `
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `
    "--user-data-dir=$perfil", "--remote-debugging-port=0", `
    "http://127.0.0.1:$Porta/tests/build/$caso.html"

  $limite = (Get-Date).AddSeconds($TimeoutSegundos)
  $terminou = $false
  while ((Get-Date) -lt $limite -and -not $proc.HasExited) {
    Start-Sleep -Milliseconds 700
    if ((Test-Path $relato) -and ((Get-Content $relato -Raw -ErrorAction SilentlyContinue) -match "### FIM")) {
      $terminou = $true
      break
    }
  }
  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }

  if (-not $terminou) {
    Write-Host "$caso ESTOUROU O TEMPO" -ForegroundColor Red
    $falharam += $caso
    if (Test-Path $relato) { Get-Content $relato | ForEach-Object { "    $_" } }
    continue
  }

  $linhas = Get-Content $relato
  $cabecalho = $linhas | Where-Object { $_ -like "### $caso *" } | Select-Object -First 1
  $passou = $cabecalho -like "*PASSOU*"
  $cor = if ($passou) { "Green" } else { "Red" }
  $qtd = ($linhas | Where-Object { $_ -like "  ok *" -or $_ -like "  . *" }).Count
  Write-Host ("{0,-14} {1}  ({2} verificacoes)" -f $caso, $(if ($passou) { "PASSOU" } else { "FALHOU" }), $qtd) -ForegroundColor $cor

  if (-not $passou) {
    $falharam += $caso
    $linhas | Where-Object { $_ -like "  FALHOU*" } | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
  }
}

Parar-Servidores

Write-Host ""
if ($falharam.Count -eq 0) {
  Write-Host "tudo passou" -ForegroundColor Green
  exit 0
}
Write-Host ("falharam: " + ($falharam -join ", ")) -ForegroundColor Red
exit 1
