# 読み取り専用セキュリティ点検の実行手順

対象はこのリポジトリの**現在の作業ツリー**です。GitHub Pages静的版とSitesサーバー版の両方を扱います。結果は安全性の認証ではありません。IPA本文の取得、外部認証基盤、本番ログ・設定・適用コミットは自動検証しません。[2026-10-15の調査報告](security-review-2026-10-15.md)に今回の根拠と制約を記載しています。

## 前提と実行

リポジトリ直下、Node.js 24.22.1推奨（対応範囲はpackage.jsonのengines.nodeを参照）、既存のnode_modulesが必要です。`node:sqlite`、TypeScript、ESLintに同梱されるjs-yaml、Reactを使います。**インストール・依存更新はスクリプトから行いません**。不足時はerror/unknownになります。初回依存導入が必要な環境では、別途レビューのうえ、通常の`pnpm install --frozen-lockfile`を実施してください（外部通信・ファイル書込みを伴い、今回の点検実行範囲外）。

```sh
# 点検器自体の回帰テスト。通信なし。
node --test tests/security-check.test.mjs

# アプリの実際の認証・APIコードを使う合成データテスト。通信なし。
node tests/security-boundaries.cjs

# オフライン点検。依存の最新脆弱性情報はunknown。
node scripts/security-check.mjs

# オンライン依存監査を加える場合だけ指定。
node scripts/security-check.mjs --online
```

クラウド環境では事前に用意済みのCorepackキャッシュを使い、今回は次で実行しました。

```sh
COREPACK_HOME=/workspace/.cache/corepack node scripts/security-check.mjs --online > /tmp/mochi-security-online.json
status=$?
printf 'security-check exit=%s\n' "$status"
```

JSONを保存する場合は、呼出側で`> /tmp/security-result.json`など明示的にリダイレクトします。スクリプト自身に出力ファイルの作成機能はありません。結果にはリポジトリのパス・ブランチ・コミット・パッケージ構成が含まれるので、必要な範囲に共有してください。

PowerShellの場合：

```powershell
node --test tests/security-check.test.mjs
node tests/security-boundaries.cjs
node scripts/security-check.mjs --online | Set-Content -Encoding utf8 "$env:TEMP\mochi-security-result.json"
$LASTEXITCODE
explorer.exe /select,"$env:TEMP\mochi-security-result.json"
```

WindowsでCorepack実行に失敗した場合もerrorとして記録します。インストールやポリシー変更を自動実施しません。

## 外部通信と変更しない範囲

- 既定はネットワーク検査なし。`--online`でのみ`corepack pnpm audit --json`を実行し、npmレジストリ`https://registry.npmjs.org`へ依存関係メタデータを送信します。今回の依存に非公開パッケージは見当たりませんが、将来追加する場合は送信可否を確認してください。
- pnpm/Corepackが未導入の環境では起動時に配布元への取得を試みる可能性があります。既存の指定バージョンとキャッシュを準備してください。スクリプトは監査の自動修正、`install`、`update`、`audit --fix`を実行しません。
- IPA、GitHub、GitHub Pages、Sites、本番API、クラウドDB、IdPへ検査通信しません。参考資料の取得は今回の手動調査として別に実行しています。
- ビルド、開発サーバー起動、マイグレーション、実アカウント作成、認証状態変更、実DB・ブラウザストレージ読取り、push、PR作成を行いません。
- 合成データテストはSQLite `:memory:`、偽のヘッダー・Storageを使います。実際のアプリソースは読取り・メモリ内コンパイルだけです。既存の`auth-storage.cjs`と`device-store.cjs`も再利用します。
- TypeScriptは`--noEmit --incremental false`で実行します。点検前後で対象ファイルのハッシュを比較します。Git無視のランタイム状態やツールキャッシュを含む全ファイルシステムの不変性まで証明するものではありません。
- 子プロセスの生stdout/stderr、例外スタック、秘密候補の実値・抜粋・その値のハッシュは出力しません。秘密候補は種類・ファイル・行だけを記録します。環境変数や秘密ファイルを表示しません。

## 結果の読み方

| status | 意味 |
| --- | --- |
| pass | **その検査だけ**実行・完了。限定された検査の範囲で期待条件を確認した |
| review | 結果あり。人による文脈確認が必要。脆弱性確定ではない |
| unknown | 未実行・情報不足・本番確認不能。正常ではない |
| error | 実行失敗・タイムアウト・JSON/ソース解析失敗・整合性不良 |
| not_applicable | 理由を付けて対象外とした項目。外部基盤まで安全という意味ではない |

終了コードは`0=全適用検査が完了しreviewなし`、`1=reviewあり`、`2=unknown/errorあり`です。unknown/errorがreviewより優先されます。**今回の期待結果は2**です。本番設定・ログなどが確認できないためで、テスト成功だけで0にしません。

依存監査はロックファイル全体を対象にし、devDependencyも除外しません。Sitesの実行時コードに使われる開発区分の依存があるためです。監査JSONは件数・バージョン・経路・修正範囲を保持し、適用性は`manual_review_required`とします。同じGHSAが複数バージョン区分に出るので`advisoryCount`と`uniqueAdvisoryCount`を分けています。

AST解析はAPI export、raw HTML、fetch、動的SQLなどの**調査入口**を列挙します。文字列検索やAST検出だけでは脆弱性を確定しません。今回の入力から防御処理への追跡結果は日付付き報告を参照してください。

秘密情報検査は現在のGit管理・非無視未追跡テキストの限定的なパターン検出です。画像等のバイナリ、4MiB超、シンボリックリンク、Git履歴、無視対象、ランタイム秘密は網羅しません。専用gitleaks/SAST等の未実施を別途unknownとして残します。新たなファイル形式・入力経路には手動レビューを追加してください。

## 本番担当者が別途確認する項目

1. **配布物・公開境界**：GitHub Actionsの実際のデプロイSHAとPages設定、Sitesの所有者・招待一覧・public/private設定、Workers直通経路、R2の公開設定とCORSを管理画面で確認する。コードのビルド設定だけでは実際の公開範囲は確定しない。
2. **認証**：Sitesエッジがクライアント由来の`oai-authenticated-user-*`を除去・上書きする契約、エッジを迂回できない構成、IdPのMFA・セッション寿命・失効・Cookie属性、退職者/招待取消/再有効化を確認する。実送信による検証は今回行っていないため、別途承認されたステージングで実施する。
3. **権限と連携**：GitHub管理者・Actions/OIDC/environment保護、Cloudflare APIトークンの用途・期限・最小権限、D1管理者・バックアップ閲覧者、外部IdP設定・監査ログを確認する。資格情報を報告書やチャットに貼らない。
4. **保持・削除・暗号化**：D1の保存期間とTime Travel/バックアップ、削除依頼処理、転送/保存時暗号化設定、JSON書出しの保管先、共有端末とブラウザストレージ、ログアウト後の下書きを確認する。
5. **ログ**：IdP、Sites/Cloudflare、GitHubの既存ログをまず実行時刻から直近1か月、次に3か月へ広げる。2026-10-15基準なら9/15以降、続いて7/15以降。取得できる保持期間が短ければ不足を明記し、欠落期間を0件と扱わない。タイムゾーンをUTC/JSTで統一する。
6. **比較方法**：時間帯・曜日・利用者数・総リクエスト数をそろえ、認証失敗率、作成/再有効化/招待/権限変更、重要データの読取・書込・書出し件数、401/403/5xx、未知の送信元/UA、通常外の時間・頻度・対象ユーザー数を前期間と比較する。変更履歴・デプロイ時刻と照合する。単なる件数増加だけで侵害を断定しない。
7. **今後収集する項目**：UTC時刻、request/event ID、イベント種別、成功/失敗/拒否理由、IdP由来の仮名化主体ID、ロール/対象種別、応答コード、送信元ネットワーク（必要最小限）、管理操作の変更前後を記録する。パスワード、Cookie、トークン、メール、体重、メモ本文を記録しない。アクセス権・保持期間・改ざん防止・通知条件を定める。

今回はログや実アカウントを取得していません。不正アクセスの有無や過去の漏えいの不存在を結論しないでください。
