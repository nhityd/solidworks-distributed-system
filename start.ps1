# Hybrid Node Mode Management Dashboard - PowerShell Startup Script
# エラーハンドリング付き

# UTF-8対応
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# エラーが発生しても処理を続行
$ErrorActionPreference = "Continue"

# タイトル設定
$Host.UI.RawUI.WindowTitle = "Hybrid Node Mode Management Dashboard"

# クリア
Clear-Host

# 色付け定数
$INFO = "`e[34m"     # Blue
$SUCCESS = "`e[32m"  # Green
$WARN = "`e[33m"     # Yellow
$ERROR_COLOR = "`e[31m"  # Red
$RESET = "`e[0m"     # Reset

# タイトル表示
Write-Host ""
Write-Host "$INFO╔════════════════════════════════════════════════════════════╗$RESET"
Write-Host "$INFO║$RESET 🌸 Hybrid Node Mode Management Dashboard                $INFO║$RESET"
Write-Host "$INFO║$RESET    ハイブリッドノード モード管理ダッシュボード          $INFO║$RESET"
Write-Host "$INFO╚════════════════════════════════════════════════════════════╝$RESET"
Write-Host ""

# 関数定義
function Write-Info { Write-Host "$INFO[INFO]$RESET $args" }
function Write-Success { Write-Host "$SUCCESS[SUCCESS]$RESET $args" }
function Write-Warn { Write-Host "$WARN[WARN]$RESET $args" }
function Write-Error2 { Write-Host "$ERROR_COLOR[ERROR]$RESET $args"; exit 1 }

# Node.js確認
Write-Info "Node.js をチェック中..."
$nodeCheck = node -v 2>$null
if (-not $nodeCheck) {
    Write-Error2 "Node.js がインストールされていません。https://nodejs.org/ からインストールしてください。"
}
Write-Success "Node.js: $nodeCheck"

# npm確認
Write-Info "npm をチェック中..."
$npmCheck = npm -v 2>$null
if (-not $npmCheck) {
    Write-Error2 "npm がインストールされていません。"
}
Write-Success "npm: $npmCheck"

Write-Host ""
Write-Info "依存関係をチェック中..."
Write-Host ""

# package.json確認
if (-not (Test-Path "package.json")) {
    Write-Error2 "package.json が見つかりません。プロジェクトディレクトリで実行してください。"
}

# node_modules確認
if (-not (Test-Path "node_modules")) {
    Write-Warn "node_modules がありません。npm install を実行します..."
    npm install --legacy-peer-deps 2>&1 | Where-Object { $_ -match "(added|up to date|ERR!)" }

    if ($LASTEXITCODE -ne 0) {
        Write-Error2 "npm install が失敗しました。インターネット接続を確認してください。"
    }
    Write-Success "依存関係をインストール完了"
} else {
    Write-Success "依存関係は既にインストール済み"
}

Write-Host ""
Write-Info "TypeScript コンパイルをチェック中..."
Write-Host ""

# TypeScriptコンパイルチェック
npm run typecheck 2>&1 | Tail -5

if ($LASTEXITCODE -ne 0) {
    Write-Warn "TypeScript エラーが検出されました。ビルドを続行します..."
}

Write-Host ""
Write-Success "すべてのチェック完了！"
Write-Host ""

# メニュー表示
Write-Host "$INFO━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$RESET"
Write-Host ""
Write-Host "実行モードを選択してください:"
Write-Host ""
Write-Host "  1) 開発モード (dev)     - ホットリロード対応で開発"
Write-Host "  2) テスト実行 (test)    - ユニットテストを実行"
Write-Host "  3) 本番ビルド (build)   - 本番用にビルド"
Write-Host "  4) タイプチェック       - TypeScript型チェック"
Write-Host "  5) Linting              - コード品質チェック"
Write-Host "  6) 終了"
Write-Host ""
Write-Host "$INFO━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$RESET"
Write-Host ""

# ユーザー入力
$choice = Read-Host "選択 [1-6, デフォルト: 1]"
if ([string]::IsNullOrWhiteSpace($choice)) {
    $choice = "1"
}

Write-Host ""

# 選択肢処理
switch ($choice) {
    "1" {
        Write-Info "開発モードで起動中..."
        Write-Host ""
        Write-Host "$SUCCESS━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$RESET"
        Write-Host "$SUCCESS開発サーバーが起動しました$RESET"
        Write-Host ""
        Write-Host "  🌐 ブラウザで開く: http://localhost:3000"
        Write-Host "  💾 ファイル保存で自動リロード"
        Write-Host "  🛑 終了: Ctrl+C を押す"
        Write-Host ""
        Write-Host "$SUCCESS━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$RESET"
        Write-Host ""
        npm run dev
    }
    "2" {
        Write-Info "テストを実行中..."
        Write-Host ""
        npm test
    }
    "3" {
        Write-Info "本番ビルドを開始中..."
        Write-Host ""
        npm run build
        Write-Host ""
        Write-Success "ビルド完了！dist/ ディレクトリを確認してください。"
    }
    "4" {
        Write-Info "TypeScript型チェック中..."
        Write-Host ""
        npm run typecheck
    }
    "5" {
        Write-Info "Linting を実行中..."
        Write-Host ""
        npm run lint
    }
    "6" {
        Write-Info "終了します。"
        exit 0
    }
    default {
        Write-Error2 "無効な選択です。1-6を選んでください。"
    }
}

Write-Host ""
Write-Success "完了しました！"
