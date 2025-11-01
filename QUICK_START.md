# 🚀 クイックスタートガイド

ハイブリッドノード モード管理ダッシュボードを簡単に起動できます。

---

## 📋 前提条件

- **Node.js** v16.0.0 以上
- **npm** v8.0.0 以上

### インストール確認
```bash
node --version
npm --version
```

---

## ⚡ 1発起動方法

### Windows ユーザー向け

#### 方法1: バッチファイル（推奨）
```bash
start.bat
```

ダブルクリックするだけで起動します。

#### 方法2: PowerShell
```powershell
.\start.ps1
```

#### 方法3: コマンドプロンプト
```cmd
start.bat
```

---

### Mac / Linux ユーザー向け

```bash
bash start.sh
```

または

```bash
chmod +x start.sh
./start.sh
```

---

## 🎯 起動後のメニュー

スクリプト実行後、以下から選択できます：

| 選択 | 説明 | 用途 |
|------|------|------|
| **1** | 開発モード (dev) | ホットリロード対応で開発 |
| **2** | テスト実行 (test) | ユニットテストを実行 |
| **3** | 本番ビルド (build) | 本番環境用にビルド |
| **4** | タイプチェック | TypeScript型チェック |
| **5** | Linting | コード品質チェック |
| **6** | 終了 | スクリプト終了 |

---

## 💻 開発モード（推奨）

**選択1** で開発サーバーが起動します：

```
🌐 ブラウザで開く: http://localhost:3000
💾 ファイル保存で自動リロード
🛑 終了: Ctrl+C を押す
```

### ブラウザで確認

ブラウザで以下のURLにアクセス：
```
http://localhost:3000
```

### 実装機能

- ✅ **モード表示** - リアルタイムモード状態表示（色分け）
- ✅ **モード切替** - ワンクリックでモード変更
- ✅ **モード固定** - モードを固定して自動切替を防止
- ✅ **リソース監視** - CPU/メモリ/ディスク使用率表示
- ✅ **イベントログ** - 操作履歴を記録
- ✅ **設定パネル** - パラメータ調整UI

---

## 📦 本番ビルド

**選択3** で本番ビルドを実行：

```bash
npm run build
```

ビルド完了後、`dist/` ディレクトリに以下が生成されます：

- `index.html` - メインページ
- `dist/` - コンパイル済みコード
- `dist/assets/` - スタイルシート & スクリプト

### 本番環境での実行

```bash
# シンプルなHTTPサーバーで確認
npx serve -s dist

# または任意のHTTPサーバーで dist/ を公開
```

---

## 🧪 テスト実行

**選択2** でテストを実行：

```bash
npm test
```

### テスト対象

- ✅ モード切替ロジック
- ✅ 自動モード判定
- ✅ 手動モード操作
- ✅ モード固定機能
- ✅ イベントリスナー

### テストカバレッジ

55+ のテストケースで包括的にカバー：

```
Mode Switcher Tests:    25+ cases
Manual Mode Tests:      30+ cases
```

---

## ✅ 確認チェックリスト

起動後、以下が正常に動作していることを確認してください：

- [ ] ブラウザが http://localhost:3000 で開ける
- [ ] モード表示が色分けされている（🔵 🟢 ⚪）
- [ ] 「モード切替」ボタンがクリック可能
- [ ] 「モード固定」ボタンでロック状態が変わる
- [ ] システムリソース表示が更新される
- [ ] イベントログに操作が記録される
- [ ] 設定パネルでパラメータ編集可能

---

## 🔧 トラブルシューティング

### エラー: "node: command not found"

**解決策:**
1. Node.js をインストール: https://nodejs.org/
2. ターミナルを再起動
3. `node --version` で確認

### エラー: "ENOENT: no such file or directory"

**解決策:**
1. プロジェクトルートディレクトリで実行
2. `ls -la package.json` で確認
3. ない場合は `cd` で正しいディレクトリに移動

### エラー: "npm ERR! code EACCES"

**解決策:**
```bash
# キャッシュをクリア
npm cache clean --force

# 再度実行
npm install
```

### ポート3000がすでに使用されている

**解決策:**
1. 既存プロセスを終了
2. または別のポートを指定：
```bash
PORT=3001 npm run dev
```

---

## 📚 プロジェクト構成

```
solidworks-distributed-system/
├── src/
│   ├── components/           # React コンポーネント
│   │   ├── Dashboard.tsx     # メインダッシュボード
│   │   ├── EventLog.tsx      # ログ表示
│   │   └── SettingsPanel.tsx # 設定UI
│   ├── mode-switcher.ts      # 自動モード切替
│   ├── manual-mode-switcher.ts # 手動モード切替
│   ├── App.tsx               # ルートコンポーネント
│   ├── main.tsx              # エントリーポイント
│   └── index.html            # HTMLテンプレート
├── tests/                    # テストファイル
├── package.json              # 依存関係定義
├── vite.config.ts            # Vite設定
├── tsconfig.json             # TypeScript設定
├── start.sh                  # Unix/Linux/Mac 用スクリプト
├── start.bat                 # Windows 用バッチ
├── start.ps1                 # PowerShell スクリプト
└── QUICK_START.md            # このファイル
```

---

## 🌟 主な機能

### 自動モード切替（Issue #2.2）
- ユーザー操作を自動検出
- マスター処理実行状態を監視
- アイドル時間で自動切替

### 手動モード切替（Issue #3）
- ワンクリックでモード変更
- **モード固定機能対応**
- 確認ダイアログで安全操作

### GUI ダッシュボード（Issue #4）
- リアルタイム状態表示
- イベントログ記録
- 設定管理UI

---

## 📖 詳細ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクト概要
- [docs/issues/issue-2.2-auto-mode-switching.md](../docs/issues/issue-2.2-auto-mode-switching.md) - 自動モード切替仕様
- [docs/issues/issue-3-manual-mode-switching.md](../docs/issues/issue-3-manual-mode-switching.md) - 手動モード切替仕様
- [docs/issues/issue-4-mode-switching-gui.md](../docs/issues/issue-4-mode-switching-gui.md) - GUI仕様

---

## 🚀 次のステップ

1. **開発開始**
   ```bash
   npm run dev
   ```

2. **コード変更**
   - `src/` ディレクトリのファイルを編集
   - ブラウザが自動リロード

3. **テスト実行**
   ```bash
   npm test
   ```

4. **本番デプロイ**
   ```bash
   npm run build
   # dist/ をサーバーにデプロイ
   ```

---

## 💬 サポート

問題が発生した場合：

1. このファイル内の「トラブルシューティング」セクションを確認
2. [GitHub Issues](https://github.com/nhityd/solidworks-distributed-system/issues) で報告
3. `npm run typecheck` でTypeScriptエラーを確認
4. `npm run lint` でコード品質を確認

---

## 📝 ライセンス

MIT License

---

**🌸 Happy Coding!**

ハイブリッドノード モード管理ダッシュボードへようこそ！
