# HEXA 墨爾本置產｜台灣導流頁（一頁式網站）

純 HTML / CSS / JS 打造的一頁式 Landing Page，目的是承接台灣市場廣告流量（Google Ads / Meta 廣告等），
介紹 HEXA 旗下三大墨爾本建案，導向諮詢表單供業務跟進。

三大建案（原始英文官網）：
- [Panorama Box Hill](https://hexa.com.au/en/portfolio/panorama/) — 住宅公寓，Box Hill
- [Lumina Townhomes](https://luminatownhomes.com.au/) — 聯排別墅，Wollert
- [FOUND](https://foundhuntingdale.com.au/) — **商用工業地產**（倉庫／自儲空間／辦公室），Huntingdale + Braeside，由 Sportie Property Group 與 HEXA Group 聯合開發

> 這個執行環境的網路政策擋掉了對這三個網域的連線，無法自動抓取官網內容。
> 頁面內容（含戶型／坪數／價格）是依你提供的官網與銷售 flyer 截圖手動謄寫，畫面字體過小或模糊之處
> （例如 Lumina 的通勤時間表、Panorama 的中文別名「白馬・湧泉」是否為正式譯名）標記或需要你再核對一次，
> 尚未確定的地方沒有用猜測數字填入。

## 檔案結構

```
index.html        單頁內容（見下方「頁面內容架構」）
styles.css        樣式（手機優先，含響應式）
script.js         表單送出邏輯、動態年份、輪播圖邏輯
assets/carousel/  三案輪播圖（已壓縮至網頁適用大小）
```

## 頁面內容架構

- **Hero**：HEXA 品牌一句話定位 + CTA（索取資料 / 查看三大建案）
- **為什麼選擇墨爾本置產**：市場穩定度、教育資源、宜居城市、開發商實績，四張卡片
- **三大建案總覽**（`#projects`）：三張卡片，各自連到下方詳細區塊錨點
- **建案詳細區塊**（各自獨立、可分開編輯）：
  - `#panorama` Panorama Box Hill
  - `#lumina` Lumina Townhomes
  - `#found` FOUND
  - 每個區塊都有：地點、建築類型、賣點條列、**圖片輪播**、**戶型與價格表**（依業主提供的銷售 flyer 填入）、連回官方英文原始頁面的按鈕
- **業務直聯**：Kelvin Wang（開發商直銷總監）的 WhatsApp 連結，導覽列與此區塊都有放置
- **常見問題**：海外購屋資格、付款匯款流程、代管出租，可依實際情況調整
- **諮詢表單**（`#cta`）：姓名、電話、Email、感興趣建案（複選）
- **頁尾**：品牌資訊 + 海外不動產廣告免責聲明（見下方合規提醒）

因為每個建案都是獨立的 `<section>` 且有自己的 id，你可以照順序一段一段修改內容，不用擔心互相干擇到其他區塊。

## 本機開發

```bash
npm run dev
```

會啟動本機伺服器（http://localhost:3000），修改 index.html / styles.css / script.js 後重新整理瀏覽器即可看到變化。

## 待填內容（依區塊列出，可逐一完成）

**Hero**
- [ ] HEXA 品牌實績一句話（成立年份／已完成建案數／開發總額等）

**三大建案總覽卡片**
- [x] 每張卡片的一句話賣點（已依官網內容初填，可再潤飾）
- [x] 三張建案代表圖（見下方「建案圖片」說明）

**Panorama Box Hill**（住宅公寓）
- [x] 接待中心地址、建築設計／規模、地段定位、公共設施
- [x] 戶型與價格表（TYPE 12／05／19，坪數與起價，含「最後一戶」等標籤）
- [x] 圖片輪播：6 張（頂樓公設外觀黃昏景、健身房、兒童遊戲區、客廳、廚房、交誼廳）
- [ ] 車位規劃細節、預計完工／交屋時間（flyer 未列出）

**Lumina Townhomes**（聯排別墅）
- [x] 地址、案名系列、總體規劃背景、合作建商 Glenvill
- [x] 生活機能：Woolworths／Costco／Coles／Epping 商圈
- [x] 戶型與價格表（TYPE C-M／A1-E，坪數與起價）
- [x] 圖片輪播：6 張（外觀、開放式廚房、客廳、衛浴等）
- [ ] 確切通勤時間表（官網截圖字體過小，需對照原文核對）、預計完工／交屋時間

**FOUND**（商用工業地產，非住宅）
- [x] 兩處基地地址、產品定位、開發團隊
- [x] 產品規格與價格表（Studio Warehouse／Office Warehouse／Showroom，未稅價）
- [x] 圖片輪播：6 張（建築外觀日／夜景、玻璃立面、展示空間、挑高倉儲內部）
- [ ] 預計完工時間（Studio Warehouse 標示「施工中」，確切日期待補）

**圖片輪播**
- 三案都是 6 張輪播（左右箭頭 + 下方圓點切換，純 CSS/JS 實作，無外部套件；只有 1 張圖時會自動隱藏箭頭與圓點）
- Panorama 的 6 張是你直接傳到對話裡的實景照（頂樓公設外觀黃昏景、健身房、兒童遊戲區、客廳、廚房），
  加上先前從 Drive 抓的交誼廳照片
- Lumina 與 FOUND 的圖來自你分享的 Google Drive 資料夾
- 三個 Drive 資料夾裡都還有更多張沒用到（Panorama 9 張、Lumina 11 張、FOUND 18 張），如果想換掉某張或調整順序，
  跟我說檔名或描述即可

**業務聯絡資訊**
- [x] Kelvin Wang（開發商直銷總監）WhatsApp：+61 416 156 826，已加入導覽列與獨立「業務直聯」區塊

**其他**
- [ ] FAQ 內容依實際常見問題調整
- [ ] 表單送出邏輯（`script.js` 內 TODO）：接第三方表單服務（如 Formspree、Google Sheet）或業務端 CRM
- [ ] 追蹤碼：`index.html` 頭部已預留 GA4 與 Meta Pixel 註解區塊，換上正式 ID 並取消註解
- [ ] 轉換事件：表單送出成功後，在 `script.js` 觸發 `gtag('event', 'generate_lead')` / `fbq('track', 'Lead')`

## 海外不動產廣告合規提醒（重要）

這三個建案都是**澳洲不動產**，在台灣廣告銷售海外不動產受《不動產經紀業管理條例》規範，上線前務必請業主／代銷法務確認：

- 廣告需明確標示該不動產為國外標的，非我國政府機關管轄之預售屋或成屋（頁尾已加入基本聲明）
- 若委託台灣的不動產經紀業者銷售，廣告應載明該經紀業名稱、地址、電話及經紀人員證書字號等法定應記載事項（目前為預留提示文字，需依實際銷售方式補上）
- 涉及海外購屋資格（如澳洲 FIRB 規定）、匯出資金、稅務等內容，建議由熟悉跨境交易的律師或會計師確認 FAQ 文字
- 若廣告投放 Google Ads／Meta，部分廣告平台對「金融／不動產」類別有額外的廣告審核政策，建議先確認帳戶資格

## 部署建議

### GitHub Pages（已設定自動部署）

`.github/workflows/deploy-pages.yml` 會在每次 push 到 `main` 或
`claude/chinese-single-page-setup-httixz` 時自動把整個 repo 部署到 GitHub Pages，
不需要手動操作，之後每次改完內容 push 上去，網站會自動更新。

**第一次使用前，需要手動做一次**：到 repo 的 Settings → Pages → Build and deployment →
Source，選擇「GitHub Actions」（預設可能是「Deploy from a branch」，要手動切換一次）。
切換後下一次 push 就會自動部署，網址會顯示在 Settings → Pages 頁面上
（通常是 `https://<github-帳號>.github.io/<repo名稱>/`）。

### 其他靜態託管選項

如果想要更快的 CDN 節點、自訂網域更方便，也可以改連接：

- **Cloudflare Pages**：連接 GitHub repo，自動部署，速度快、有台灣附近的 CDN 節點
- **Vercel** / **Netlify**：同樣支援連接 repo 自動部署

部署後記得：
1. 綁定正式網域（例如 `tw.hexa.com.au` 或獨立網域）
2. 確認手機版顯示正常（廣告流量大多來自手機）
3. 用 Google PageSpeed Insights 測一下速度，影響廣告品質分數與轉換率
