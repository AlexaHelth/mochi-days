# Cloudflare Pages への手動アップロード

Windows のエクスプローラーで、このリポジトリのフォルダー（`package.json` がある `mochi-days` フォルダー）を開き、アドレスバーに `powershell` と入力して Enter を押します。Node.js 24.22.1（推奨。ほかの対応版は `package.json` の `engines.node` を参照）と pnpm が使える状態で、次を実行してください。

```powershell
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw '依存パッケージの準備に失敗しました。' }
pnpm run build:cloudflare
if ($LASTEXITCODE -eq 0) { explorer.exe (Resolve-Path .\dist-cloudflare).Path }
```

ビルドが成功すると `dist-cloudflare` がエクスプローラーで開きます。Cloudflare の Workers & Pages で Pages の「Direct Upload（直接アップロード）」を選び、この `dist-cloudflare` フォルダーをアップロードしてください。`index.html` がアップロード先のルートに配置される構成です。リポジトリ全体や `dist-pages` は使いません。

このビルドはドメイン直下（`https://プロジェクト名.pages.dev/`）向けです。画像、ホーム画面用アイコン、マニフェスト、導入ガイド（`/install.html`）を同梱し、記録は端末のブラウザに保存します。サーバーや D1 の設定は不要です。

公開URLが変わる場合、記録の保存場所も別になります。既存URLの記録は既存URLのブラウザ保存領域に残るので、切り替え前に設定の「自分の記録を書き出す」で控えを保存してください。

作成済みの `mochi-days-cloudflare-orange.zip` を使用する場合は、再ビルドせずZIPをそのままDirect Uploadに渡せます。ZIP内のルートに `index.html` があります。

公開前に手元で画面を確認する場合は、次を実行して表示された URL を開きます。

```powershell
pnpm run preview:cloudflare
```

通常は `http://localhost:4173/` です。停止は Ctrl+C です。

GitHub Pages 向けの `pnpm run build:pages` は、引き続き `/mochi-days/` を基準に `dist-pages` へ出力します。
