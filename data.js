/**
 * シフト設定ファイルのサンプルです。
 *
 * 使い方:
 * 1. このファイルをコピーして「data.js」という名前に変更します
 * 2. 必要な箇所だけ書き換えます
 * 3. index.html と bundle.js と同じ場所に置いて使います
 *
 * 注意:
 * - 文字や記号を消しすぎると動かなくなる場合があります
 * - カンマ（,）の消し忘れ / 消しすぎに注意してください
 */

window.SHIFT_DATA = {
  /**
   * データ形式のバージョン
   * 現在は 1 固定です
   */
  version: 1,

  /**
   * メモ欄（任意）
   * 運用メモを書きたい場合に使えます
   */
  note: "sample",

  /**
   * ローテーションモード
   *
   * "anchor":
   *   実運用用。anchorDate を基準にローテーションします
   *
   * "temp":
   *   開発確認用。日付ベースの仮ローテーションです
   */
  mode: "anchor",

  /**
   * ローテーション基準日
   * mode が "anchor" の場合に使用します
   *
   * 例:
   * "2026-01-01"
   */
  anchorDate: "2026-01-01",

  /**
   * メンバー一覧
   *
   * この並び順がローテーション順になります。
   * 人の入れ替わりがある場合は、この配列の名前を書き換えてください。
   *
   * 現状は固定人数のローテーションを前提にしています。
   */
  members: [
    "田中",
    "佐藤",
    "鈴木",
    "高橋",
    "伊藤",
    "渡辺",
    "山本",
    "中村",
    "小林",
    "加藤",
    "吉田",
  ],

  /**
   * 行設定
   *
   * 通常はこのままで使用してください。
   * 行の表示名や順番を変えたい場合に編集します。
   *
   * offsetFromTrip は「出張(trip)を基準に何日ずれているか」を表します。
   *
   * 例:
   * trip  = 0
   * off1  = -1
   * late  = 3
   * early = 6
   */
  rows: [
    { key: "early", label: "早番", offsetFromTrip: 6 },
    { key: "late", label: "遅番", offsetFromTrip: 3 },
    { key: "trip", label: "出張", offsetFromTrip: 0 },
    { key: "off1", label: "休み①", offsetFromTrip: -1 },
    { key: "off2", label: "休み②", offsetFromTrip: -2 },
    { key: "off3", label: "休み③", offsetFromTrip: -3 },
  ],

  /**
   * 指定した名前を表の中で目立たせます（任意）
   *
   * 例:
   * "田中"
   *
   * 不要な場合は、
   * highlightName: undefined
   * またはこの項目自体を削除してください
   */
  highlightName: "田中",
};
