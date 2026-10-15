# セキュリティ点検報告（2026-10-15、日本時間）

## 根拠資料と範囲

指定資料：[IPA注意喚起](https://www.ipa.go.jp/security/security-alert/2026/alert20261009.html)。**本文を取得できていない**。Pythonで取得失敗後、curlでも`CONNECT tunnel failed, response 403`、HTTPステータス000となった。これは接続プロキシの拒否であり、IPAが404を返したとの判断ではない。本文・正式な点検項目・引用は未確認。本報告はユーザー指定の6項目に沿った点検であり、「IPA本文と照合済み」「IPA準拠」とは扱わない。

- リポジトリ：`github.com/AlexaHelth/mochi-days`。
- ブランチ：**work**。基準コミット：`183bdf9c790cda3452143092fa2c436ab83ae6e6`（2026-10-08T08:37:08+09:00）。mainの現在値・本番デプロイSHAは未確認。fetchは行っていない。
- 調査対象：基準コミットだけでなく、今回開始時点の変更済み15ファイルと未追跡3ファイル（前回のUI変更・贈りもの削除・Cloudflare用手順を含む）を含めた作業ツリー全体。開始時にGit管理/非無視未追跡335ファイルを記録。今回追加した点検ファイルも再実行時の対象になる。
- AGENTS.md、SECURITY.md：リポジトリ配下の該当ファイルと、祖先`/AGENTS.md`・`/workspace/AGENTS.md`は見当たらない。README、app/lib、共通UIの入力表示箇所、db/drizzle、package/lock、ビルド・公開・ローカル認証設定を確認した。
- 除外：Git履歴全体、node_modules全体の網羅レビュー、既存ZIP/ビルド済み配布物の中身、実ブラウザの保有記録、実DB、本番への通信、実アカウント、クラウド管理設定、侵入/負荷試験。RSC周辺のインストール済みライブラリは限定的に追跡した。
- 追加は点検スクリプト・テスト・本手順/報告だけ。既存アプリ・依存・ロック・ワークフロー・デプロイ・DBを修正せず、push/PR作成もしていない。
- Codex Securityスキル本文は参照したが、補助リソースの取得に失敗し、専用スキャン/preflightツールは利用できなかった。正式なCodex Security標準スキャンを完了したとは主張しない。本報告は手動コードレビューと下記の独自点検による。専用SAST/gitleaks/OSV/Trivyも未実行。

## 発見事項（重要度順）

### F1：高・対応優先／確認済み：既知脆弱性の対象バージョンがロックに残る

根拠：`package.json:35`、`:57`、`:61`、`:65`、`:66`、`:72`。`pnpm-lock.yaml:3913`（next）、`:4127`（RSC）、`:4602`（Vite）、`:4251`（sharp）。今回npmレジストリに対するpnpm auditを実行し、**62レコード、GHSAで重複除外56件：Critical 1 / High 30 / Moderate 23 / Low 8**を確認した。パッケージ所有者のGitHub Advisoryを代表3件取得し本文を照合した。他の情報はレジストリ監査結果に基づき、全件の上流原文を個別取得したわけではない。

| 依存・ロック版 | 情報源と修正範囲 | 成立条件・今回の適用評価 |
| --- | --- | --- |
| next 16.3.4 | [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)、16.3.6以降 | CriticalのRCEはNode版`next/og ImageResponse`へ攻撃者の値をSVG内容/属性/styleとして渡す場合。今回app/libに`next/og`/`ImageResponse`の利用経路なし。**このアプリでRCEが成立するとは確認していない**。静的PagesにはNode画像生成サーバーなし |
| next 16.3.4 | GHSA-cjq9-62q9-8jv4等、監査上16.3.8以降 | 画像最適化SSRF・キャッシュ等。他のNext機能も含むのでRCEの修正最低版だけで全件解消とはいえない。SitesはNext本体サーバーではなくvinextを利用。アプリ固有の画像アップロード/任意URL入力なし。フレームワーク生成機能・実配布物の影響は別途確認 |
| react-server-dom-webpack 19.2.6 | [GHSA-wx67-qw84-cm4g / CVE-2026-44907](https://github.com/advisories/GHSA-wx67-qw84-cm4g)、19.2.8以降 | 細工したServer Function要求でCPU/メモリDoS。Sitesは`vite.config.ts:59-62`でRSC対応構成。直接の`use server`宣言なし。plugin-rscはvendored RSCも使用しており、直指定パッケージ更新だけで十分かは未確認。**Sites実配布物への到達性・同梱実装の適用性は疑いとして残す**。静的PagesはサーバーRSCを使わない |
| vite 8.0.13 | [GHSA-fx2h-pf6j-xcff / CVE-2026-53571](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)、8.0.16以降 | ネットワーク公開したWindows開発サーバー＋NTFS等の条件でdeny対象ファイル読取り。今回Linux環境・静的公開経路に成立を示す証拠なし。将来Windows開発サーバーを外部公開する際は影響あり |
| sharp 0.35.4 | GHSA-wq5f-xc86-pv6w、監査上0.35.5以降 | librsvg関連。アプリの任意ファイル受信・SVG画像変換経路は見当たらない。Miniflareのoverrideも0.35.4に固定されているため、将来の対策では親パッケージとoverrideの両方を確認 |
| undici 7.24.8 / ws 8.18.0 | pnpm-lock.yaml:4517 / :4714、複数GHSA | 監査では複数のTLS/キャッシュ/DoS/情報漏えい。実際に使われる機能・Cloudflare/Wranglerの経路を個別評価する必要がある。全件をアプリAPIの脆弱性とはしない |
| js-yaml 4.1.1 / brace-expansion 1.1.14・5.0.6 / esbuild等 | pnpm-lock.yaml:3625 / :2732 / :2735 / :3116、複数GHSA | 多くはビルド・開発・解析ツールの入力条件に依存。信頼しない設定/ソース/パターンを扱う開発・CIへの影響を分けて確認する |

影響：該当機能・配布形態で悪用条件を満たせば、DoS・漏えい・RCE等。**確認できたのは対象版の存在であり、公開アプリで62個の攻撃が成立するという意味ではない**。

推奨修正：別タスクで適用性を確認し、Next/RSC/plugin-rsc/vinext・開発ツール・推移依存/overrideを互換性検証のうえ更新する。frozen lock再監査、両配布版のテスト、Sites配布物の同梱RSC確認、デプロイSHA照合まで実施する。本番への適用状況は未確認。今回は更新していない。

### S1：高になり得る／追加検証が必要：Sites認証ヘッダーの信頼境界

根拠：`app/chatgpt-auth.ts:21-40`→`app/api/state/route.ts:30-41`→ユーザーIDをD1のバインド値に使用。アプリは`oai-authenticated-user-id`とemailの存在で本人情報を受け取り、署名の検証は自身では行わない。合成ヘッダーでこの経路をテストした。

成立条件：Sitesの信頼済みエッジが外部由来の同名ヘッダーを除去/上書きしない、又はエッジを迂回してオリジンに到達できる場合。影響：他人のIDになりすました読取り・更新・書出し。**この本番条件は未確認であり、認証バイパスを確認したとはしない**。外部認証プロキシを信頼する設計自体を脆弱性と断定しない。

推奨確認/修正：Sites側のヘッダー保証・アクセス許可・直接接続禁止を管理設定/公式契約で確認し、承認されたステージングで偽造ヘッダーを拒否することを検証する。ローカル開発用`build/sites-vite-plugin.ts:47-81`にはヘッダー除去とlocalhost/接続元確認があるが、`configureServer`専用であり本番エッジの証明にはならない。

### F2：中／確認済みの設計上のリスク：Pagesの保管境界はパスでなく共有オリジン

根拠：`lib/device-store.ts:7-12`、`:24`、`:41`、`github-pages/main.tsx:6`。体重・気分・メモ・習慣・相棒設定を`mochi-days:v1`というlocalStorage値にJSON平文保存する。`lib/record-drafts.ts:5-14`にも体重・メモ等の下書きが残る。暗号化・利用者認証・パス単位のアクセス制御はない。README:84にも同一アカウントのPagesがオリジンを共有すると記載されている。

成立条件：同じ`alexahelth.github.io`上の別プロジェクトで悪意あるJavaScriptが実行される、又は共有ブラウザ/同一オリジンXSSが発生する場合。キーの名前空間は衝突防止であり、アクセス制御ではない。影響：同じブラウザ内の記録・下書きの読取り/改ざん。インターネット上の別人の記録が自動的に読めるという意味ではない。今回、実ブラウザや隣接サイトで攻撃はしていない。

推奨修正：個人記録用に専用オリジンを割り当て、同一オリジンの公開権限を絞る。共有端末向けの削除/ロックを設計する。暗号化を導入する場合も、鍵を同じlocalStorageに置くだけでは同一オリジンJSからの防御にならない。

### F3：中／確認済みのコード上の欠落：保有期間と削除経路が実装されていない

根拠：`app/api/state/route.ts:29-67`はGET/POSTのみ、`app/api/export/route.ts:4-12`は書出しのみ。`db/schema.ts:2-10`の4テーブル、`lib/device-store.ts:24-41`は保存・更新を行うが、全記録削除/保有期限による削除はない。`lib/record-drafts.ts:14`と`app/mochi-app.tsx:117`は保存成功後に該当日の下書きを消すが、古い未保存下書きのTTLやログアウト時全削除は見当たらない。`:160`のログアウトは外部サインアウトリンクだけ。

成立条件：長期利用・端末共有・アカウント廃止・削除依頼・未保存のまま終了する場合。影響：不要な健康/自由記述データと下書きが残り、漏えい時の対象を増やす。法令違反とまでは判断していない。クラウド外で削除作業が運用されている可能性は未確認。

推奨修正：保持目的/期間を定め、本人の認証付き削除とSitesの4テーブル/バックアップ、Pagesの専用キー/下書き、ログアウト/共有端末を含む運用を実装する。`localStorage.clear()`で同一オリジンの他アプリまで消さず、対象キーだけを消す。今回は既存データを削除していない。

### F4：中／確認済みのコード上の欠落：重要操作の監査イベントがない

根拠：`app/api/state/route.ts:30-31`、`:34-39`、`:65-66`、`app/api/export/route.ts:4-12`。読取/保存の例外は`console.error`に渡すが、認証拒否・CSRF拒否・書出し成功・重要データ読取り/変更を構造化監査イベントとして記録していない。プロフィール作成は保存のupsertで行い、専用アカウント管理機能はない。監査イベント用スキーマや外部ログ連携も見当たらない。

成立条件：不正アクセスや大量書出し、権限誤設定の調査が必要になった場合。影響：誰がいつ何をしたか、平常時からどう変わったかをアプリ層で追いにくい。侵害や「本番に一切ログがない」との確認ではない。エッジ/IdPのログで補完されている可能性がある。

推奨修正：認証基盤・エッジ・アプリのrequest/event IDを関連付け、拒否・読取・更新・書出しを必要最小限で記録する。メモ/体重/認証情報はログに含めない。原例外の出力範囲も確認する。保持・閲覧権限・通知条件と1か月/3か月比較は実行手順を参照。

### S2：低〜中／追加確認：要求全体を読み込んでからのサイズ制限

根拠：`app/api/state/route.ts:37`は`await req.text()`の後で文字数を5000に制限する。無認証・異なるOriginはその前に拒否するが、認証済み同一Origin要求は読込み時点で大きなメモリを使い得る。API/エッジの速度・バイト数上限は不明。

成立条件：大きな本文を繰り返し送れるアカウントがあり、上流で十分制限されていない場合。影響：メモリ・処理量DoSの可能性。負荷試験を行っておらず実害は未確認。推奨：上流の本文/頻度上限を確認し、必要ならストリーム読取りのバイト上限を設ける。Content-Lengthだけを信用せず、実受信量を制限する。

## 6項目の調査結果・外部公開とデータの整理

| 配布経路 | 公開面・保存先・境界 | 確認と制約 |
| --- | --- | --- |
| GitHub Pages | `/mochi-days/`、`install.html`、manifest、同梱画像/静的JS/CSS。ブラウザlocalStorageとJSON書出し | `vite.pages.config.ts:13-32`、`.github/workflows/pages.yml:33-57`は静的dist-pagesだけを配布。app/apiはこのビルドのサーバーにならない。別人のサーバー記録にアクセスするAPIはない。実配布SHA・ヘッダー設定は未確認 |
| Cloudflare静的Direct Upload用 | Cloudflare modeでは`/`、保存はPages同様端末内 | 前回のビルド設定あり。実際にアップロード済みか・ドメイン・公開設定は未確認 |
| Sites | `/`、`/install`、`GET/POST /api/state`、`GET /api/export`。ChatGPT認証/Sites招待、D1 `DB` | `app/page.tsx:5-6`、`lib/store.ts:1-2`、`.openai/hosting.json`。所有者/招待者のみとのREADMEは**コード側の方針**として確認し、実設定は断定しない。フレームワーク内部RSC/画像等の実公開面は別途配布物確認が必要 |
| Sitesの認証経路 | `/signin-with-chatgpt`、`/signout-with-chatgpt`、`/callback` | アプリ独自パスワード、新規登録、再設定、管理者UI、組織ID、権限編集APIは見当たらない。MFA・セッションCookie・再有効化等は外部基盤で確認する |
| 開発機能 | Vite、ローカル模擬認証、Wrangler/Miniflare | mockAuthは開発サーバーフック限定。managed-linuxでは無効、inspectorPort=false。`0.0.0.0`の開発待受はプレビュー用で、プロキシの実到達範囲は未検査。静的成果物が開発サーバーを公開するわけではない |
| ストレージ/外部連携 | D1とlocalStorage。R2設定はnull。GitHub Actions/Pages、Sites/ChatGPT、Cloudflare、開発時npm | 本番Cloudflare/GitHubトークン、権限・監査ログは未取得。静的コードに分析/広告/任意外部API送信は見当たらない。体重・気分・習慣・目標・自由メモ・相棒の名前/訪問/活動・設定を保存。メール/氏名は認証ヘッダーで受け取るがD1スキーマへの保存は見当たらない |

GitHub Actionsはcontents:read、pages:write、id-token:writeをworkflow全体に付与し、`main` pushとworkflow_dispatchが入口。fork PRのコードを特権実行するトリガーはない。依存はfrozen-lockfileで導入する。Actionの参照はタグであり、組織設定・環境保護・管理者権限・SHA固定方針は追加確認とする。

転送時HTTPS、D1の保存時暗号化、バックアップの保持・アクセス権はコードだけでは検証できない。ブラウザJSON/書出しはアプリ独自暗号化なし。自由メモには利用者が任意の個人情報を入れ得る。R2公開アクセスは未確認だが、アプリ設定上R2連携は無効。

## IPA本文の照合を補う実装点検

- **API所有者分離/SQLi**：`getChatGPTUser`→`userId`→すべてのSELECT/UPSERTのバインド値を追跡。入力JSONでuserId/組織IDを上書きできず、Zod strictで拒否する。SQL文は定数で`prepare(...).bind(...)`を使用。合成2利用者とSQL様の別ID/メモを使い、他ユーザーの記録・書出しを読めずテーブルが残ることを実際のハンドラー＋メモリSQLiteで確認。信頼済みIdPからのIDが正しい前提であり、エッジ偽造耐性とは別。
- **XSS**：入力メモ→JSON保存→TodayView/HistoryViewのJSXテキストを追跡。実TodayViewのSSRで合成HTMLがエスケープされることを確認。`components/ui/chart.tsx:97`のraw HTMLはCSS生成用汎用部品だが、現在のアプリは独自SVGを使用し、その部品をimportしていない。ユーザー入力がこのsinkへ届く経路は見当たらず、検出だけでXSSとはしない。実ブラウザ全画面・第三者コード・将来の利用は網羅していない。
- **CSRF**：認証→`Origin`完全一致→JSON Content-Type→本文上限→Zod。Origin欠落/別origin/文字列null、text/plain、不正JSON、5001文字、所有者/星の追加フィールドを拒否しDBへ進まないことを確認。GET書出しは状態変更なし、attachment/no-store/nosniff。セッションCookieの実属性は未確認。
- **SSRF**：手書きアプリの通信は`lib/api-client.ts:7`の固定`/api/state`。外部URLをサーバーfetchへ渡す入力経路なし。固定の案内リンクはブラウザ遷移でありSSRFではない。フレームワークの画像最適化機能は依存監査の適用性確認に残した。
- **ファイル処理**：ファイルアップロード/JSONインポート/ユーザー指定ファイルパスは見当たらない。JSON書出しファイル名は固定接頭辞と日付。素材コピーは開発ビルド専用の固定ディレクトリ処理。任意ファイル処理の脆弱性は確認していない。
- **秘密情報**：Git管理/非無視未追跡テキストのキー形式・秘密文字列の限定検査で候補0。`.env*`はignore、現在追跡されていない。hostingのproject_id、D1 binding、画像ハッシュは資格情報ではない。Git履歴・無視対象・ランタイム・ツール外の保管場所の秘密を網羅したわけではない。実値の出力や資格情報の有効性検査はしていない。
- **ログ調査**：本番ログ未提供。環境ツールが報告したsecret binding/outbound identityは空で、クラウド管理情報は取得していない。`.wrangler/logs`にも利用可能なログなし。1か月から3か月への実データ比較は実行できずunknown。ローカル開発ログを本番監査ログの代わりにしていない。

## 作成物・実行結果

- `scripts/security-check.mjs`：Gitスコープ/ハッシュ、限定秘密検査、TS AST、manifest/lock/installed整合、任意のpnpm audit、既存認証/端末保存テスト、新規境界テスト、型検証。通常は通信なし。
- `tests/security-boundaries.cjs`：認証必須、ヘッダー信頼前提、CSRF/形式/上限/厳格入力、所有者分離/SQLバインド/書出し、return URL、開発用ヘッダー除去、実TodayViewエスケープの**7グループ成功**。
- `tests/security-check.test.mjs`：unknown/error/対象外と終了コード、監査JSON解析/不整合、秘密出力抑制、タイムアウト、AST解析失敗など**7テスト成功**。
- 既存`tests/auth-storage.cjs`、`tests/device-store.cjs`：今回再実行成功。実ハンドラー・メモリSQLite/Storageを使用。本番クラウドD1の試験ではない。
- `tsc --noEmit --incremental false`：成功。
- `node scripts/security-check.mjs`：終了2。オフライン依存監査と本番情報等のunknownを保持。
- `COREPACK_HOME=/workspace/.cache/corepack node scripts/security-check.mjs --online`：終了2。依存監査はreview、その他テスト/型/限定秘密検査は成功。本番設定/ログ/IPA/履歴・拡張スキャンはunknownのまま。
- 依存監査自体の`pnpm audit --json`は終了1（検出あり）。エラーを成功扱いにしておらず、全体の2は未確認が残ることを意味する。

詳細な再実行・外部通信先・終了コード・本番確認手順は[security-check.md](security-check.md)を参照。機械可読結果には全62レコードのバージョン・依存経路・GHSA・修正範囲が含まれる。本番の侵害有無、実際のMFA/アクセス許可/ログ、保有データの暗号化/保持・削除運用、現行配布版の脆弱性適用性は未確認であり、安全とも侵害済みとも断定しない。
