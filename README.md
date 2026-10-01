# もちと、まいにち

**アプリを開く: https://alexahelth.github.io/mochi-days/** （ログイン不要。記録はその端末のブラウザに保存）

日本語の記録Webアプリ。写真入力なし。体重（任意）、気分、最大3つの習慣、日付ごとの自由メモを記録できます。最初に犬・猫・ペンギンから相棒を選び、名前をつけて始めます。相棒は8つの基本表情で反応し、取り組みに応じて4つのお部屋と8種類の衣装が解放されます。各衣装には通常・よろこびの2表情があり、3種すべてで着替えられます。

## 2つの公開方法

| | GitHub Pages版 | Sites版 |
| --- | --- | --- |
| URL | https://alexahelth.github.io/mochi-days/ | Sitesの非公開URL |
| ログイン | 不要 | ChatGPTログインとSitesの招待 |
| 記録の保存先 | その端末のブラウザ（localStorage） | サーバー（Cloudflare D1）。端末をまたいで同じ記録 |
| 更新 | `main` へのpushで自動公開 | Sitesでビルド・デプロイ |

画面と、おほしさま・お部屋・衣装のルールは共通です（入力と解放のルールは `lib/state-rules.ts`）。

## GitHub Pages版の記録

- 記録はその端末のブラウザの中（キー `mochi-days:v1`）だけに保存し、サーバーへは送信しません。別の端末・別のブラウザとは共有されません。
- iPhoneでは、Safariで開いたときとホーム画面から開いたときで保存場所が別々です。ホーム画面に追加してから使い始めてください。アプリ内の「ホーム画面への追加・使い方」にも手順があります。
- ブラウザの履歴・Webサイトデータの消去や、ホーム画面のアプリの削除で記録も消えることがあります。設定の「自分の記録を書き出す」でJSONの控えを保存できます。書き出したファイルから戻す機能はまだありません。
- アプリを開くときは通信が必要です。開いたあとは通信が切れても記録できます。
- `alexahelth.github.io` のほかのGitHub Pagesサイトとは同じオリジンになるため、保存キーにアプリ名を付けています。

## デプロイの更新方法（GitHub Pages版）

1. `main` ブランチにpushします（GitHub上での編集やプルリクエストのマージも同じです）。
2. GitHub Actionsの「GitHub Pages」ワークフロー（`.github/workflows/pages.yml`）が、テスト → ビルド → 公開を自動で行います。進み具合はリポジトリの「Actions」タブで確認できます。数分で https://alexahelth.github.io/mochi-days/ が新しい版になります。
3. やり直すときは Actions →「GitHub Pages」→「Run workflow」。テストかビルドが失敗したときは公開されず、前の版のままです。

リポジトリの Settings → Pages → Build and deployment の Source は「GitHub Actions」にしてあります。「Deploy from a branch」に戻すと、アプリではなくこのREADMEが表示されます。ホーム画面に追加したアプリは、いったん閉じて開き直すと新しい版になります。

公開前に手元で確かめるとき:

```sh
corepack pnpm install
corepack pnpm run build:pages
corepack pnpm run preview:pages
```

`http://localhost:4173/mochi-days/` で公開時と同じ構成を確認できます。

## まず達成すること

Notion「もちと、アプリ開発」に沿い、iPhoneのホーム画面から使い、記録の保存まで確かめることが最初の目標です。[導入・実機チェックリスト](docs/smartphone-pilot.md)を用意しています。アプリ内の `/install` からも導入手順を読めます。GitHub Pages版はURLを開くだけで使えます。Sites版の実機確認と利用者へのアクセス許可は未実施です。

## もちを姉妹アプリで共有

素材の原本とアプリ非依存の表示ロジックは [packages/mochi-assets](packages/mochi-assets/README.md) に分離しました。犬・猫・ペンギン、表情、衣装を「もちと、おでかけ」などにも持ち出せます。別の非公開リポジトリへの分割手順も同梱しています。現段階では同じリポジトリ内の独立パッケージです。

ビルド時に素材を `public/pets` にコピーします。`node packages/mochi-assets/copy-assets.mjs public --check` で原本との一致を確認します。公開フォルダの画像を直接編集せず、パッケージの原本とmanifestを更新してください。ユーザーデータや衣装解放の条件は各アプリで管理し、共通素材には含めません。

## Sites版の認証と共有
Sitesの非公開アクセス制御とChatGPTログインを使用します。新規登録用フォームや独自パスワードはありません。現時点ではサイト所有者のみ。利用者のアカウントメールを確認後、Sitesの許可リストで招待します。一般公開に変更しないでください。
全APIでサーバー由来のユーザーIDを確認し、D1クエリをユーザーIDで絞ります。更新は同一オリジンのJSONリクエストに限定し、キャッシュは禁止しています。

## 保存
Sites版はD1のentries、profiles、stars、GitHub Pages版は端末のlocalStorageに保存します。日付は日本時間。星は1日につき体重・気分・3つの習慣の各1回、最大5個です。同日の編集やチェックし直しで重複しません。チェックを外しても既に獲得した星は失いません。習慣は3つの固定スロットです。名称の変更で過去の達成回数は変わりません。

## 開発・検証
Sites版はSitesのビルドとホスティング手順に従います。GitHub Pages版は `vite.pages.config.ts` と `github-pages/` から静的ファイルを `dist-pages/` に書き出します。Drizzleのマイグレーションはdrizzle/に保存済み。認証・所有者分離・入力検証・星の重複防止は `node tests/auth-storage.cjs` で実際のAPIハンドラーをSQLiteのテスト環境に対して検証します。GitHub Pages版の保存処理は `node tests/device-store.cjs` で検証します。`node node_modules/typescript/bin/tsc --noEmit` で型検証します。

## 相棒・衣装
- 既存アカウントは犬・衣装なしを引き継ぎます。記録・おほしさまは保持されます。
- 初回だけ相棒選択を表示。設定で種類・名前をあとから変更できます。
- 衣装は累計のおほしさま5 / 12 / 20 / 30 / 40 / 55 / 70 / 90個で解放。消費しません。解放判定は保存時にも検証します（Sites版はサーバー、GitHub Pages版は端末内の保存処理）。
- 記録後はばんざい、なでるとうっとり、元気な気分ならウインク、習慣達成で照れ顔、夜は睡眠、おつかれなら休憩。お休みの日を責める演出はありません。
- 衣装着用時は通常・よろこびの2差分を使い、衣装を保ったまま反応します。基本の8表情はごほうびの表情アルバムでも確認できます。
- `public/puppy.png` の元の犬4ポーズは変更せず、そのまま使用。新しい素材の原本は `packages/mochi-assets/assets/`、配信用コピーは `public/pets/`。画像はすべて同梱済みで、アプリ利用時に画像生成APIは呼びません。
- 差分仕様・素材一覧は [docs/pet-design.md](docs/pet-design.md)。

Sites版への反映には、Sitesでのビルドとデプロイが別途必要です。GitHub Pages版は `main` へのpushで自動更新されます。

## 体重入力・Linearの画面改善（2026-10-01）

体重は前回の測定値から、整数と小数を上下にスクロールして調整できます。ホームの体重ボタンは体重だけの編集画面を開き、同じ日の気分・習慣・メモを保ったまま保存します。ホーム・入力画面・履歴に前回との差を表示します。新しい日にメモや気分だけを保存したとき、前回値を体重の測定として自動保存しません。なでるとハートが出る反応と、Linearの案を使った習慣候補も追加しました。

[課題との対応・確認結果](docs/linear-improvements-2026-10-01.md)。保存先は従来どおりで、DBマイグレーションは不要です。`node tests/weight.cjs`で前回値・増減・履歴編集のルールを確認できます。

## Linearからの改善（2026-09-27）

[課題ごとの対応表](docs/linear-improvements.md)。自由メモ、通信失敗時の再保存、設定画面からの記録書き出し・報告文コピー、解放時の反応を追加しました。追加DBマイグレーション `drizzle/0001_burly_spencer_smythe.sql` はSites版の配布時に適用してください。GitHub更新時点で本番DBは変更していません。

`node tests/api-client.cjs` で通信失敗とタイムアウトを検証できます。未送信の入力はページを開いている間だけ保持します。
