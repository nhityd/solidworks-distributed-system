#!/bin/bash

# Hybrid Node Mode Management Dashboard - Startup Script
# エラーが発生したら即座に終了
set -e

# 色付け出力用の定数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# タイトル表示
clear
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC} 🌸 Hybrid Node Mode Management Dashboard                ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    ハイブリッドノード モード管理ダッシュボード          ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 前提条件チェック
log_info "システム要件をチェック中..."

# Node.js確認
if ! command -v node &> /dev/null; then
    log_error "Node.js がインストールされていません。https://nodejs.org/ からインストールしてください。"
fi

NODE_VERSION=$(node -v)
log_success "Node.js: $NODE_VERSION"

# npm確認
if ! command -v npm &> /dev/null; then
    log_error "npm がインストールされていません。"
fi

NPM_VERSION=$(npm -v)
log_success "npm: $NPM_VERSION"

echo ""
log_info "依存関係をインストール中..."
echo ""

# package.json存在確認
if [ ! -f "package.json" ]; then
    log_error "package.json が見つかりません。プロジェクトディレクトリで実行してください。"
fi

# node_modules確認
if [ ! -d "node_modules" ]; then
    log_warn "node_modules がありません。npm install を実行します..."
    npm install --legacy-peer-deps 2>&1 | grep -E "(added|up to date|ERR!)" || true
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "npm install が失敗しました。インターネット接続を確認してください。"
    fi
    log_success "依存関係をインストール完了"
else
    log_success "依存関係は既にインストール済み"
fi

echo ""
log_info "TypeScript コンパイルをチェック中..."
echo ""

# TypeScriptコンパイルチェック
if ! npm run typecheck 2>&1 | tail -5; then
    log_warn "TypeScript エラーが検出されました。ビルドを続行します..."
fi

echo ""
log_success "すべてのチェック完了！"
echo ""

# メニュー表示
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "実行モードを選択してください:"
echo ""
echo "  1) 開発モード (dev)     - ホットリロード対応で開発"
echo "  2) テスト実行 (test)    - ユニットテストを実行"
echo "  3) 本番ビルド (build)   - 本番用にビルド"
echo "  4) タイプチェック       - TypeScript型チェック"
echo "  5) Linting              - コード品質チェック"
echo "  6) 終了"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# デフォルト選択（入力がない場合は開発モード）
DEFAULT_CHOICE="1"
read -p "選択 [${DEFAULT_CHOICE}]: " choice
choice=${choice:-$DEFAULT_CHOICE}

echo ""

case $choice in
    1)
        log_info "開発モードで起動中..."
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}開発サーバーが起動しました${NC}"
        echo ""
        echo "  🌐 ブラウザで開く: http://localhost:3000"
        echo "  💾 ファイル保存で自動リロード"
        echo "  🛑 終了: Ctrl+C を押す"
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        npm run dev
        ;;
    2)
        log_info "テストを実行中..."
        echo ""
        npm test
        ;;
    3)
        log_info "本番ビルドを開始中..."
        echo ""
        npm run build
        log_success "ビルド完了！dist/ ディレクトリを確認してください。"
        ;;
    4)
        log_info "TypeScript型チェック中..."
        echo ""
        npm run typecheck
        ;;
    5)
        log_info "Linting を実行中..."
        echo ""
        npm run lint
        ;;
    6)
        log_info "終了します。"
        exit 0
        ;;
    *)
        log_error "無効な選択です。1-6を選んでください。"
        ;;
esac

echo ""
log_success "完了しました！"
