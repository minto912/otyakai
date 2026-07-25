# otyakai — お茶会の告知・申し込みサイト

季節ごとに開く小さなお茶会のための、一枚ものの案内サイトです。
ビルド不要・依存ライブラリなしの静的サイトなので、そのまま GitHub Pages などに置けます。

## 収録している内容

- **ヒーロー** — 日時・会場・参加費・定員と、開催までのカウントダウン
- **お茶会について** — 会の雰囲気を伝える 4 枚のカード
- **当日の流れ** — 受付からお開きまでのタイムライン
- **会場・アクセス** — 最寄り駅・駐車場などの情報と、SVG の簡略地図
- **よくある質問** — `<details>` による開閉式の FAQ
- **参加申し込み** — 入力チェック付きのフォームと、送信後の内容確認

## 動かす

サーバは要りません。`index.html` をブラウザで開くだけです。

```sh
open index.html          # macOS
xdg-open index.html      # Linux
```

ローカルサーバ越しに見たい場合は次のいずれかで。

```sh
python3 -m http.server 8000
npx serve .
```

## ファイル構成

```
.
├── index.html              # ページ本体（日本語・1 ページ完結）
├── assets/
│   ├── css/style.css       # 全スタイル。冒頭のカスタムプロパティで配色を管理
│   └── js/main.js          # ナビ・カウントダウン・フォームなどの挙動
└── .github/workflows/pages.yml   # GitHub Pages への自動デプロイ
```

## 内容を書き換える

| 変えたいもの | 場所 |
| --- | --- |
| 日時・会場・参加費・定員 | `index.html` の `.hero-facts` |
| カウントダウンの締切 | `index.html` の `#countdown` の `data-event` 属性（ISO 8601、例 `2026-10-11T13:00:00+09:00`） |
| 当日のタイムテーブル | `index.html` の `.timeline` |
| FAQ の項目 | `index.html` の `.faq-list` にある `<details>` |
| 配色・余白・フォント | `assets/css/style.css` 冒頭の `:root`（ダークモードは `prefers-color-scheme` のブロック） |

配色は「生成りの紙・墨・抹茶・朱」の 4 系統をカスタムプロパティにまとめてあるので、
`--matcha` と `--shu` を差し替えるだけで全体の印象が変わります。
ダークモードは OS の設定に自動で追従します。

## 申し込みフォームについて

現状のフォームは**入力チェックと内容確認までを行い、送信内容はブラウザの
localStorage に保存されるだけ**です。サーバへは送信されません。
実際に申し込みを受け取るには、`assets/js/main.js` の `initForm()` にある
`save(rows)` の呼び出しの前後で、任意の送信先へ `fetch` してください。

```js
// 例：フォーム受信サービスやご自身の API に送る場合
await fetch('https://example.com/rsvp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.fromEntries(new FormData(form)))
});
```

送信先を用意せずに運用する場合は、フォームを外部サービス（Google フォーム等）への
リンクに置き換えるのが手軽です。

## 公開する

`.github/workflows/pages.yml` を同梱しています。リポジトリの
**Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定すると、
`main` への push ごとに自動で公開されます。

## 補足

- 掲載している日付・会場名・アクセス情報はすべて記入例です。実際の内容に差し替えてください。
- アクセシビリティに配慮しています（スキップリンク、キーボード操作、`prefers-reduced-motion` 対応、
  エラーの読み上げ）。文言や構成を変える際も、`label` と入力欄の対応は保ったままにしてください。
