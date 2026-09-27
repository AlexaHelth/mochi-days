# もち共通素材 — ふたつむぎ企画室

`@futatsumugi/mochi-assets` v0.1.0。もちと、まいにち／おでかけ／かでん／まんが／こそだておうえんにっきで共有するための、アプリ非依存の素材パッケージです。

## このフォルダが原本

- `assets/`: 原本の白い子犬、新しい犬・猫・ペンギンの基本表情と衣装、ホーム画面用アイコン。
- `index.js` / `index.d.ts`: 種類・表情・衣装のIDと、スプライトのセル位置。依存パッケージなし、ReactにもSitesにも依存しません。
- `manifest.json`: バージョン、サイズ、SHA-256。原本の取り違えを防ぎます。
- `generation-prompts.json`: 生成と修正に使った指示。
- `copy-assets.mjs`: 任意のアプリの公開フォルダに素材をコピーし、ハッシュを確認します。

体重・習慣・ログイン・ユーザー情報・衣装を解放する星の数は含みません。これらは各アプリの責任です。素材の共有と、ユーザーの記録や衣装所有権の共有は別です。今回、姉妹アプリ間のアカウント連携は行いません。

## 別のアプリで使う

このフォルダを丸ごと別アプリの `packages/mochi-assets` にコピーし、バージョンを固定します。

```sh
node packages/mochi-assets/copy-assets.mjs public
```

```js
import {petSprite} from './packages/mochi-assets/index.js';
const sprite = petSprite('cat', 3, 'flower');
// {src:'/pets/cat-wardrobe.png', columns:4, rows:4, cell:9}
const column = sprite.cell % sprite.columns;
const row = Math.floor(sprite.cell / sprite.columns);
const style = {
  backgroundImage: `url('${sprite.src}')`,
  backgroundSize: `${sprite.columns * 100}% ${sprite.rows * 100}%`,
  backgroundPosition: `${column / (sprite.columns - 1) * 100}% ${row / (sprite.rows - 1) * 100}%`,
  aspectRatio: '1',
};
```

4番目の引数でアセットのURLプレフィックスを変更できます。画像をGitHubのraw URLから直接読み込ませず、アプリに同梱してください。非公開GitHubの認証情報をクライアントに渡す必要はありません。

## リポジトリ分割の方針

最初のスマホ検証を遅らせないため、v0.1.0は `mochi-days` 内の独立パッケージとして管理します。次のアプリが実装を始める時点で、専用の非公開 `mochi-assets` リポジトリへ切り出す方針です。このフォルダだけで動くので、アプリの履歴や健康記録を渡さずに分離できます。

GitHub上に新しいリポジトリはまだ作っていません。分割時の作業例:

```sh
# mochi-days のチェックアウトで実行。新しい非公開リポジトリを別途用意する。
git subtree split --prefix=packages/mochi-assets -b mochi-assets-export
# 作ったエクスポートブランチを専用リポジトリへpushする。
```

切り出し後は専用リポジトリを唯一の原本とし、各アプリは特定のリリース/コミットを取り込みます。古いアプリの見た目を自動で変えないため、追従するバージョンは明示的に更新します。npm公開や画像CDN、共通ログイン基盤は今は不要です。

## 利用方針

ふたつむぎ企画室のアプリ用。外部への再配布許諾は設定していません（private / UNLICENSED）。デザインの基準は最初の白い子犬です。参考案リポジトリのSVG・画像・描画コードは含めません。
