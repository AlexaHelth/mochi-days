# Node.js 2026年10月セキュリティ更新の確認

## 対象と結論

2026-10-22に[公式告知本文](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)と[24.22.1のリリース情報](https://nodejs.org/en/blog/release/v24.22.1)を取得して確認しました。対象は `work` ブランチ、基点コミット `17c21c63b5e81d988aabc6aa89318c9cbf5f85b2` と今回の差分です。公開サイトへの検査通信や実データの読取りは行っていません。

公式修正版は **22.23.4 / 24.22.1 / 26.12.1**。確認時のクラウド環境の既定Nodeは **24.19.0**、以前の `engines.node` は `>=22.13.0` でした。修正前の実行環境を許す設定を確認したため、対応範囲を修正版以降の22・24・26系に限定しました。推奨・GitHub Pages CIは `.node-version` の **24.22.1** を使います。将来の別メジャー・プレリリース・EOL版は自動で許可しません。

これはビルド・開発環境の修正です。GitHub Pages版は `github-pages/main.tsx` から `storage="device"` で起動し、`vite.pages.config.ts` が静的ファイルだけを作成します。公開ページにNode.jsサーバーを配置する経路や、今回のCVEを訪問者が直接悪用する経路は確認できませんでした。漏えいや侵入があったという判断ではありません。

## 適用条件の確認

| 公式告知の対象 | このリポジトリで確認した経路と判断 |
| --- | --- |
| DNSのNUL切詰め、TLSのIP表記・証明書検証、HTTP keep-alive | アプリに直接のNode DNS/TLS/HTTPクライアント処理はありません。開発・依存取得ツールによる通信はあるため、Node実行環境を更新します。攻撃者の応答が実際に届く条件は未確認です。 |
| Brotliデコーダの境界外書込み | アプリに直接のNode Brotli入力処理はありません。ツールの通信・圧縮処理を網羅した到達性証明はできないため、修正済みNodeを使用します。破壊的なRCE実証はしていません。 |
| randomUUID/randomIntのstartup snapshot・SEAでの乱数再利用 | 該当する起動方式はありません。`lib/device-storage-guard.ts` の `crypto.randomUUID()` はlocalStorageと併用するブラウザ処理です。Nodeのsnapshotとは別です。 |
| Node 26のZipFileとPermission Model、全系列のrealpathSync Permission Model回避 | NodeのPermission Model、SEA、ZipFile APIに依存する処理はありません。該当する保護境界を実装しているとは判断しません。 |
| Node 22のSQLite更新 | `node:sqlite` はテストのメモリ内DBで使用します。任意の本番DBファイルを開く経路は確認していません。Sites本番保存はCloudflare D1です。 |
| Undici等の同梱依存更新 | Node本体の更新が必要です。npmの `pnpm audit` だけではNode本体やツール内の埋込みコピーを監査できません。下記の別パッケージと残存コピーも確認しました。 |

Sites版は `vite.config.ts` によるCloudflare workerd上で実行します。`nodejs_compat` の指定だけでNode本体のCVEが該当すると断定できません。ホスティング側の実行エンジンとパッチ適用状況は未確認です。

## 修正と再実行

- `package.json` のNode許可範囲、`pnpm-workspace.yaml` の `engineStrict`、`.node-version`、GitHub Pages CIを更新しました。
- `scripts/check-node-version.mjs` は依存なしで現在のNodeを判定し、修正前・未対応版を終了コード1で停止します。通常のdev/build/preview/startコマンドの先頭でも実行します。プロジェクトが指定するpnpmでのインストールもエンジン制約で停止します。
- 既存の読取り専用点検器に `node_runtime` の結果を追加しました。現在のプロセスだけを対象とし、本番やActions内部のNodeを確認した扱いにはしません。
- Miniflareが外部依存として読むUndiciを **7.29.1 → 7.30.1** に更新しました。公式の[7.30.1リリース](https://github.com/nodejs/undici/releases/tag/v7.30.1)と[過剰なContent-Encodingによるクラッシュの告知](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c)で対象範囲を照合しました。
- npm依存の7日経過ポリシーは維持し、経過まで約8時間の公式セキュリティ修正版 **`undici@7.30.1` だけ**を `minimumReleaseAgeExclude` に追加しました。全体の待機時間・整合性検証・許可されたビルド処理は緩めていません。

Nodeを24.22.1に更新したシェルで実行します。Windowsも同じコマンドをPowerShellで使えます。

```sh
node --version
node scripts/check-node-version.mjs
corepack pnpm install --frozen-lockfile
node --test tests/node-version.test.mjs tests/security-check.test.mjs tests/undici-security.test.cjs
corepack pnpm exec tsc --noEmit --incremental false
corepack pnpm run build:pages
corepack pnpm run build
node scripts/security-check.mjs
# オンラインの追加監査を行う場合だけ指定
corepack pnpm audit --json
```

依存導入はnpmレジストリへの外部通信とnode_modulesへの書込みを伴います。監査もレジストリへ依存情報を送信します。ビルドは生成ディレクトリに書き込みます。Undiciの回帰テストは **127.0.0.1の合成HTTP応答だけ**を使い、外部・本番へ接続しません。秘密値・アプリの保存記録は読まず、子プロセスの出力は抑制します。ほかの既存テストはGitHub Pages CIでも実行します。

検証用には公式配布のLinux Node 24.22.1を `/tmp` に展開し、公式SHASUMSとのSHA256一致を確認して使用しました。環境全体の既定NodeやユーザーのPCのNodeを交換したものではありません。

## 確認結果と残る制約

- 修正前24.19.0ではチェックが終了1になり、pnpmのオフライン導入も `ERR_PNPM_UNSUPPORTED_ENGINE` で停止しました。24.22.1ではチェック・frozen導入が成功しました。
- Undici 7.29.1を公式npm整合性情報と照合して隔離した `/tmp` に展開し、ループバックの過剰Content-Encoding応答で子プロセスの未処理エラー・終了1を確認しました。更新後7.30.1では同じ応答を拒否して終了0、通常の応答も取得できました。恒久テストは実際のMiniflareの外部依存を読みます。
- Nodeバージョン境界・CI整合性・点検器・Undiciの回帰テストは11件成功しました。既存13本のCJSアプリテスト、型検査、Pages・Cloudflare静的版・Sitesの3ビルドも成功しました。独立した読取り専用レビューでも具体的な回避経路・回帰は報告されませんでした。
- **Wranglerの埋込みUndiciは未修正です。** 現在のWrangler 4.116.0には7.28.0が内蔵されています。公式npm配布物の整合性を確認した4.151.0と、確認時最新の4.151.3にも7.29.1が内蔵され、修正版を含む公開リリースは見つかりませんでした。overrideでは置換できません。Cloudflare APIクライアント等が使うため、Sites/Cloudflare開発・公開ツールの制約として残ります。手作業で配布済みバンドルを改変せず、Cloudflareの修正版公開を待って更新・再検証します。GitHub PagesのビルドにはこのCLIを使いません。
- Next 16.3.8にはEdgeRuntime用Undici 6.21.0の埋込みコピーがあります。現在の起動スクリプトはvinext/Viteを呼び、Next EdgeRuntimeへの到達経路は確認できませんでした。将来NextのEdgeRuntimeへ切り替える際は再評価が必要です。
- GitHubのJavaScript Actions自身が使う内蔵Nodeはsetup-nodeとは別です。GitHub管理のランナー更新・各Actionの対応状況は、このNode指定だけでは修正・確認できません。
- 修正前の `pnpm audit` は7件（High 2、Moderate 4、Low 1、Critical 0）を報告しました。既存のbraces/esbuildに加えViteの別件5件です。今回のNode告知に基づく修正範囲と区別し、ゼロ件とは報告しません。また公式告知で確認したUndiciの件がレジストリ監査に現れなかったため、監査結果だけで対象外とは判断しませんでした。修正後のオンライン点検は依存監査が60秒でタイムアウトし、`dependency_advisories: error`、全体終了2でした。Node版・ロック/導入整合性・合成境界テスト・型検査・読取り専用不変条件はpassです。監査失敗や本番/IPA/ログ等の未確認を正常扱いにしていません。
- 公式の全CVEの攻撃実証、全依存内の到達性解析、ユーザーPC、本番ログ、公開ページの実表示、CloudflareやGitHub管理内部の適用状況は確認していません。今後の脆弱性まで安全と保証するものではありません。
