@echo off
REM Hybrid Node Mode Management Dashboard - Windows Startup Script
REM エラーが発生したら処理を続行する
setlocal enabledelayedexpansion

REM UTF-8対応の為のコードページ設定
chcp 65001 >nul 2>&1

REM タイトルバー設定
title Hybrid Node Mode Management Dashboard

REM クリア
cls

REM タイトル表示
echo.
echo ============================================================
echo  ^^ Hybrid Node Mode Management Dashboard
echo     ハイブリッドノード モード管理ダッシュボード
echo ============================================================
echo.

REM Node.js確認
echo [INFO] Node.js をチェック中...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js がインストールされていません
    echo.
    echo https://nodejs.org/ からインストールしてください
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js: %NODE_VERSION%

REM npm確認
echo [INFO] npm をチェック中...
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm がインストールされていません
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [SUCCESS] npm: %NPM_VERSION%

echo.
echo [INFO] 依存関係をチェック中...
echo.

REM package.json確認
if not exist package.json (
    echo [ERROR] package.json が見つかりません
    echo プロジェクトディレクトリで実行してください
    pause
    exit /b 1
)

REM node_modules確認
if not exist node_modules (
    echo [WARN] node_modules がありません。npm install を実行します...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo [ERROR] npm install が失敗しました
        echo インターネット接続を確認してください
        pause
        exit /b 1
    )
    echo [SUCCESS] 依存関係をインストール完了
) else (
    echo [SUCCESS] 依存関係は既にインストール済み
)

echo.
echo [INFO] システム準備完了！
echo.

REM メニュー表示
echo ============================================================
echo.
echo 実行モードを選択してください:
echo.
echo   1) 開発モード (dev)     - ホットリロード対応で開発
echo   2) テスト実行 (test)    - ユニットテストを実行
echo   3) 本番ビルド (build)   - 本番用にビルド
echo   4) タイプチェック       - TypeScript型チェック
echo   5) Linting              - コード品質チェック
echo   6) 終了
echo.
echo ============================================================
echo.

set /p choice="選択 [1-6, デフォルト: 1]: "
if "%choice%"=="" set choice=1

echo.

if "%choice%"=="1" (
    echo [INFO] 開発モードで起動中...
    echo.
    echo ============================================================
    echo 開発サーバーが起動しました
    echo.
    echo   ^^ ブラウザで開く: http://localhost:3000
    echo   ^^ ファイル保存で自動リロード
    echo   ^^ 終了: Ctrl+C を押す
    echo.
    echo ============================================================
    echo.
    call npm run dev
) else if "%choice%"=="2" (
    echo [INFO] テストを実行中...
    echo.
    call npm test
) else if "%choice%"=="3" (
    echo [INFO] 本番ビルドを開始中...
    echo.
    call npm run build
    echo.
    echo [SUCCESS] ビルド完了！
    echo dist/ ディレクトリを確認してください
) else if "%choice%"=="4" (
    echo [INFO] TypeScript型チェック中...
    echo.
    call npm run typecheck
) else if "%choice%"=="5" (
    echo [INFO] Linting を実行中...
    echo.
    call npm run lint
) else if "%choice%"=="6" (
    echo [INFO] 終了します
    exit /b 0
) else (
    echo [ERROR] 無効な選択です。1-6を選んでください
    pause
    exit /b 1
)

echo.
echo [SUCCESS] 完了しました！
echo.
pause
