# AI ONE タスク管理 - セットアップ手順

## 必要なもの
- GitHubアカウント
- Supabaseアカウント（無料）: https://supabase.com
- Vercelアカウント（無料）: https://vercel.com

---

## Step 1: Supabaseの設定

1. https://supabase.com にアクセスしてログイン
2. 「New Project」でプロジェクトを作成
   - Project name: `ai-one-task`（任意）
   - Database Password: 任意のパスワードを設定
   - Region: `Northeast Asia (Tokyo)` を選択
3. プロジェクト作成後、左メニューの「SQL Editor」を開く
4. `supabase_setup.sql` の中身をすべてコピーして貼り付け、「Run」を実行
5. 左メニューの「Project Settings → API」を開き、以下をメモ
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJxxxxxx...`

---

## Step 2: GitHubにアップロード

1. https://github.com で「New repository」を作成
2. `ai-one-task` フォルダをGitHubにプッシュ

---

## Step 3: Vercelにデプロイ

1. https://vercel.com にアクセスしてログイン
2. 「Add New → Project」でGitHubのリポジトリを選択
3. 「Environment Variables」に以下を追加:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Step1でメモしたProject URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step1でメモしたanon public key |

4. 「Deploy」をクリック
5. デプロイ完了後、発行されたURL（例: `https://ai-one-task-xxxx.vercel.app`）をチームに共有

---

## Step 4: 初期設定

1. ツールのURLにアクセス
2. 右上の「設定」をクリック
3. CSメンバー10名の名前を入力して保存
4. 必要に応じてDiscord Webhook URLを設定

---

## Discord通知の設定（任意）

1. Discordで通知したいチャンネルを開く
2. チャンネル設定 → 「連携サービス」→「ウェブフック」→「新しいウェブフック」
3. 発行されたURLをコピー
4. タスク管理ツールの「設定」→「Discord Webhook URL」に貼り付けて保存
