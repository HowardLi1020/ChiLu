/*
 * ────────────────────────────────────────────────
 *  日記相簿內容設定檔 —— 之後只要改這個檔案就好
 * ────────────────────────────────────────────────
 *  順序：封面 → 前言 → 每趟出遊（日記 → 照片）→ 關於你 → 結語
 *
 *  文字：把 "" 之間填上內容即可，換行用 \n，空一行（段落）用 \n\n
 *  照片：每張照片都有 note 欄位，寫了字的照片會出現「翻面」提示，
 *        點一下就能翻到背面看那段話；沒寫的照片點一下是放大看
 *  照片排列：照片會依清單順序，每 2～3 張貼成一頁
 *  新增或替換照片：放進 photos/ 後執行 python tools/compress_photos.py
 */
window.MEMORY = {
  to: "",            // 封面上的字，例如「給 ○○」
  heroTitle: "",     // 封面標題；用全形逗號「，」分隔時會換行
  heroSub: "",       // 封面標題下方的小字
  postcardPhoto: "images/IMG_7067.jpg",   // 明信片上貼的小照片（完整顯示）；留空就不貼
  coverPhoto: "",   // 封面要貼的照片，例如 "images/2026.09.19-21/IMG_5536.jpg"；留空就用燙金向日葵

  // 背景音樂：填 YouTube 影片 ID（網址 watch?v= 後面那串）；留空 "" 改用 music/song.mp3
  music: {
    youtube: "JqR0_IFpdcg",
    start: 0,          // 從第幾秒開始播
    volume: 60         // 音量 0–100
  },

  // 前言：翻開封面後的第一頁
  preface: {
    title: "前言",
    text: ""
  },

  // 每趟出遊：先是一頁日記，接著是這趟的照片
  trips: [
    {
      date: "2026.06.25 – 06.28",
      dot: "6/25",
      title: "",        // 這趟的標題
      diary: "",        // 這趟的日記（寫多長都可以，超過一頁會自動可以往下捲）
      photos: [
        { src: "images/2026.06.25-28/IMG_4768.jpg", note: "" },
        { src: "images/2026.06.25-28/IMG_4772.jpg", note: "" },
        { src: "images/2026.06.25-28/IMG_4782.jpg", note: "" },
        { src: "images/2026.06.25-28/IMG_4793.jpg", note: "" },
        { src: "images/2026.06.25-28/IMG_4818.jpg", note: "" },
        { src: "images/2026.06.25-28/IMG_4822.jpg", note: "" }
      ]
    },
    {
      date: "2026.07.23 – 07.26",
      dot: "7/23",
      title: "",        // 這趟的標題
      diary: "",        // 這趟的日記（寫多長都可以，超過一頁會自動可以往下捲）
      photos: [
        { src: "images/2026.07.23-26/IMG_4234.jpg", note: "" },
        { src: "images/2026.07.23-26/IMG_4997.jpg", note: "" },
        { src: "images/2026.07.23-26/IMG_4985.jpg", note: "" },
        { src: "images/2026.07.23-26/IMG_4996.jpg", note: "" },
        { src: "images/2026.07.23-26/IMG_5003.jpg", note: "" },
        { src: "images/2026.07.23-26/IMG_5020.jpg", note: "" },
        { src: "images/2026.07.23-26/IMG_5031.jpg", note: "" }
      ]
    },
    {
      date: "2026.08.18 – 08.20",
      dot: "8/18",
      title: "",        // 這趟的標題
      diary: "",        // 這趟的日記（寫多長都可以，超過一頁會自動可以往下捲）
      photos: [
        { src: "images/2026.08.18-20/IMG_5260.jpg", note: "" },
        { src: "images/2026.08.18-20/IMG_0198.jpg", note: "" },
        { src: "images/2026.08.18-20/IMG_5271.jpg", note: "" },
        { src: "images/2026.08.18-20/IMG_5273.jpg", note: "" },
        { src: "images/2026.08.18-20/IMG_5275.jpg", note: "" },
        { src: "images/2026.08.18-20/IMG_5282.jpg", note: "" }
      ]
    },
    {
      date: "2026.09.06 – 09.08",
      dot: "9/6",
      title: "",        // 這趟的標題
      diary: "",        // 這趟的日記（寫多長都可以，超過一頁會自動可以往下捲）
      photos: [
        { src: "images/2026.09.06-08/IMG_5396.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5388.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5401.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5402.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5422.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5428.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5435.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5450.jpg", note: "" },
        { src: "images/2026.09.06-08/IMG_5451.jpg", note: "" }
      ]
    },
    {
      date: "2026.09.19 – 09.21",
      dot: "9/19",
      title: "",        // 這趟的標題
      diary: "",        // 這趟的日記（寫多長都可以，超過一頁會自動可以往下捲）
      photos: [
        { src: "images/2026.09.19-21/IMG_5553.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5507.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5509.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5510.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5519.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5524.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5529.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5535.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5536.jpg", note: "" },
        { src: "images/2026.09.19-21/IMG_5543.jpg", note: "" }
      ]
    },
    {
      date: "2026.09.25 – 09.27",
      dot: "9/25",
      title: "",        // 這趟的標題
      diary: "",        // 這趟的日記（寫多長都可以，超過一頁會自動可以往下捲）
      photos: [
        { src: "images/2026.09.25-27/IMG_5595.jpg", note: "" },
        { src: "images/2026.09.25-27/IMG_4818.jpg", note: "" },
        { src: "images/2026.09.25-27/IMG_5578.jpg", note: "" },
        { src: "images/2026.09.25-27/IMG_5584.jpg", note: "" },
        { src: "images/2026.09.25-27/IMG_5599.jpg", note: "" },
        { src: "images/2026.09.25-27/IMG_5602.jpg", note: "" },
        { src: "images/2026.09.25-27/IMG_5612.jpg", note: "" }
      ]
    }
  ],

  // 「關於你」翻牌卡：back 是翻到背面的話
  traits: [
    { icon: "", word: "認真感性的你", back: "" },
    { icon: "", word: "喜歡搞怪的你", back: "" },
    { icon: "", word: "勇於面對的你", back: "" }
  ],

  // 結語：最後一頁，文字會一行一行慢慢浮現
  epilogue: {
    title: "結語",
    text: "",
    bigLast: true,     // 最後一行要不要用大字強調；不要就改成 false
    sign: ""           // 落款，例如「— ○○，2026.10」（留空就不顯示）
  }
};
