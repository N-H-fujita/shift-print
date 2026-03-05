window.SHIFT_DATA = {
  version: 1,
  note: "sample",

  mode: "anchor",
  anchorDate: "2026-01-01",

  members: [
    "田中","佐藤","鈴木","高橋","伊藤",
    "渡辺","山本","中村","小林","加藤","吉田"
  ],

  rows: [
    { key: "early", label: "早番", offsetFromTrip: 6 },
    { key: "late",  label: "遅番", offsetFromTrip: 3 },
    { key: "trip",  label: "出張", offsetFromTrip: 0 },
    { key: "off1",  label: "休み①", offsetFromTrip: -1 },
    { key: "off2",  label: "休み②", offsetFromTrip: -2 },
    { key: "off3",  label: "休み③", offsetFromTrip: -3 },
  ]
};