# もち共通素材 — ふたつむぎ企画室

`@futatsumugi/mochi-assets` v0.2.1。もちと、まいにち／おでかけ／かでん／まんが／こそだておうえんにっきで共有するための、アプリ非依存の素材パッケージです。

## このフォルダが原本

- `assets/`: 原本の白い子犬、新しい犬・猫・ペンギンの基本表情と衣装、ホーム画面用アイコン。
- `index.js` / `index.d.ts`: 種類・表情・衣装のIDと、スプライトのセル位置。依存パッケージなし、ReactにもSitesにも依存しません。
- `manifest.json`: バージョン、サイズ、SHA-256。原本の取り違えを防ぎます。
- `generation-prompts.json`: 生成と修正に使った指示。
- `reward-generation-prompts.json`: 新しい衣装24種類・3匹・各2姿と、特別なもち3匹・各4姿の生成指示。built-in image_genで生成しています。
- `copy-assets.mjs`: 任意のアプリの公開フォルダに素材をコピーし、ハッシュを確認します。

体重・習慣・ログイン・ユーザー情報・衣装を解放する星の数は含みません。これらは各アプリの責任です。素材の共有と、ユーザーの記録や衣装所有権の共有は別です。今回、姉妹アプリ間のアカウント連携は行いません。

## ごほうび素材 v0.2.0

3匹それぞれに衣装32種類・各2姿、基本表情8姿、特別なもち4姿を収録しています。全228姿です。今回の追加は156姿（新しい衣装144姿＋特別なもち12姿）。原本は `assets/`、公開サイト用コピーは `public/pets/` です。

- `*-wardrobe.png`: これまでの衣装8種類、4列×4行。
- `*-rewards-garden.png`: みつばち・ちょうちょ・いちご・れもん・さくらんぼ・ひまわり・あじさい・きのこ。
- `*-rewards-cozy.png`: コック・パン屋・絵描き・探偵・船員・レインコート・冬じたく・パジャマ。
- `*-rewards-dream.png`: 宇宙旅行・魔法使い・ようせい・ドラゴン・天使・海・夏まつり・パーティー。
- `*-special.png`: ほしぞらの特別なもち、2列×2行。

各衣装シートは4列×4行、衣装ごとに左が通常・右がよろこびです。特別なもちは左上にっこり・右上ばんざい・左下すやすや・右下きらめきです。実際の座標は `petSprite` に任せてください。

v0.2.1では `petFrame(sprite)` に衣装192姿の実測表示範囲を追加しました。生成画像のイラストは厳密な等間隔ではないため、衣装を単純な400%の背景で表示すると隣のイラストが混入したり、帽子や足が切れたりします。衣装は `petFrame` の矩形を独立した要素の背景として表示し、縦横比を保って枠内へ収めてください。元のPNG・衣装ID・セルの番号は変わりません。基本表情と特別なもちは `petFrame` が `null` を返し、従来の表示方法を使います。

## 別のアプリで使う

このフォルダを丸ごと別アプリの `packages/mochi-assets` にコピーし、バージョンを固定します。

```sh
node packages/mochi-assets/copy-assets.mjs public
```

```js
import {petSprite,petFrame} from './packages/mochi-assets/index.js';
const sprite = petSprite('cat', 3, 'flower');
// {src:'/pets/cat-wardrobe.png', columns:4, rows:4, cell:9}
const frame = petFrame(sprite);
const side = Math.max(frame.width, frame.height);
// Place this background element inside a square, position:relative container.
const style = {
  position: 'absolute', left: '50%', top: '50%',
  transform: 'translate(-50%, -50%)',
  width: `${frame.width / side * 94}%`,
  height: `${frame.height / side * 94}%`,
  backgroundImage: `url('${sprite.src}')`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: `${frame.sheetWidth / frame.width * 100}% ${frame.sheetHeight / frame.height * 100}%`,
  backgroundPosition: `${frame.x / (frame.sheetWidth - frame.width) * 100}% ${frame.y / (frame.sheetHeight - frame.height) * 100}%`,
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
