# HEXA 墨爾本置產｜台灣導流頁

純 HTML / CSS / JS 打造的導流頁面，目的是承接台灣市場廣告流量（Google Ads / Meta 廣告等），
介紹 HEXA 旗下三大墨爾本建案，導向諮詢表單供業務跟進。

網站架構為「首頁 + 三個獨立建案頁面」（非單一頁面）：首頁介紹品牌與三大建案總覽，
點擊建案卡片會直接跳轉到該建案自己的完整頁面（各自有專屬版頭標題與圖片），
而不是在同一頁往下捲動或切換分頁——這樣每個建案都有自己的網址，也不會有頁面上重複資訊的問題。

三大建案（原始英文官網）：
- [Panorama Box Hill](https://hexa.com.au/en/portfolio/panorama/) — 住宅公寓，Box Hill
- [Lumina Townhomes](https://luminatownhomes.com.au/) — 聯排別墅，Wollert
- [FOUND](https://foundhuntingdale.com.au/) — **商用工業地產**（倉庫／自儲空間／辦公室），Huntingdale + Braeside，由 Spectre Property 與 HEXA Group 聯合開發

> 這個執行環境的網路政策擋掉了對這三個網域的連線，無法自動抓取官網內容。
> 頁面內容（含戶型／坪數／價格）是依你提供的官網與銷售 flyer 截圖手動謄寫，畫面字體過小或模糊之處
> （例如 Lumina 的通勤時間表、Panorama 的中文別名「白馬・湧泉」是否為正式譯名）標記或需要你再核對一次，
> 尚未確定的地方沒有用猜測數字填入。

## 檔案結構

```
index.html        首頁（見下方「頁面內容架構」）
panorama.html     Panorama Box Hill 獨立頁面
lumina.html       Lumina Townhomes 獨立頁面
found.html        FOUND 獨立頁面（Huntingdale + Braeside 兩基地皆在此頁）
styles.css        樣式（手機優先，含響應式，四個頁面共用）
script.js         表單送出邏輯、動態年份、輪播圖邏輯、回到頂部（四個頁面共用）
assets/carousel/  三案輪播圖（已壓縮至網頁適用大小）
assets/logo-butterfly.png  導覽列蝴蝶圖示（取自 Panorama 官方 logo 檔案，僅裁切金色蝴蝶圖形本身，
                    未包含檔案內「PANORAMA」英文字標與簡體中文「白马・御景」字樣，避免簡體字混入頁面）
```

因為是純 HTML/CSS/JS、沒有共用模板系統，四個頁面的導覽列／業務直聯／常見問題／諮詢表單／頁尾
是各自複製一份（沒有用 include 或框架），修改這些共用區塊時記得四個檔案都要改到。

## 頁面內容架構

**index.html（首頁）**
- **Hero**：HEXA 品牌一句話定位 + CTA（索取資料 / 查看三大建案）
- **關於 HEXA**：品牌介紹 + 成立年份／累計建案／開發總金額統計
- **為什麼選擇墨爾本置產**：市場穩定度、教育資源、宜居城市、開發商實績，四張卡片
- **三大建案總覽**（`#projects`）：三張卡片，點擊會跳轉到對應的獨立頁面（panorama.html／lumina.html／found.html）
- 以下（業務直聯／常見問題／諮詢表單／頁尾）與三個建案頁面共用同樣內容

**panorama.html／lumina.html／found.html（各建案獨立頁面）**
- **專屬 Hero**：各自的背景圖與標題（例如 Panorama 是「在白馬・御景／解鎖墨爾本 CBD 核心的高空生活提案」，
  兩行置中呈現），不是共用首頁那個 HEXA 品牌 Hero
- 地點、建築類型、賣點條列、**圖片輪播**、深入內容區塊（在地生活機能／交通／室內佈置等）、
  **戶型與價格表**（依業主提供的銷售 flyer 填入）、連回官方英文原始頁面的按鈕
- found.html 內有兩個基地（Huntingdale + Braeside），用一條「Braeside 基地」分隔線隔開，
  在同一頁面依序介紹，不是分開成兩個檔案
- 業務直聯／常見問題／諮詢表單／頁尾（與首頁共用同樣內容）

## 本機開發

```bash
npm run dev
```

會啟動本機伺服器（http://localhost:3000），可以直接在瀏覽器網址列輸入
`localhost:3000/panorama.html`（或 lumina.html／found.html）分別測試每個頁面，
修改 index.html / panorama.html / lumina.html / found.html / styles.css / script.js
後重新整理瀏覽器即可看到變化。

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
- [x] 地址、案名系列、總體規劃背景
- [x] 官方文件內容：開發團隊（HEXA + IFD）、建築師 Rothelowman、建商 Glenvill Projects、
      建築與規劃設計、室內佈置、生活機能與 Lumina Central 未來城中心、交通機能（各地車程）
- [x] 戶型與價格表（TYPE C-M／A1-E，坪數與起價）
- [x] 圖片輪播：6 張（外觀、開放式廚房、客廳、衛浴等）
- [ ] 預計完工／交屋時間（目前資料未提供）

**FOUND**（商用工業地產，非住宅；Huntingdale + Braeside 兩個基地）
- [x] 兩處基地正確地址（Huntingdale: 17-31 Franklyn Street；Braeside: 280 Governor Road）
- [x] Huntingdale 官方文件內容：開發團隊（HEXA + Spectre Property，已修正原本誤植的「Sportie」）、
      地段與生活機能（零售/教育/醫療/交通距離）、建築設計理念、自儲空間規格與 The Hub 公設、規格與配置
- [x] Braeside 官方文件內容（原文簡體中文，已轉繁體）：地段與生活機能、園區亮點與永續設計、
      金斯頓市經濟數據、四種倉儲類型（Showroom／Office／Studio／Micro Warehouse）規格
- [x] 產品規格與價格表（Studio Warehouse／Office Warehouse／Showroom，未稅價）——已重新歸屬為
      Braeside 基地資料（坪數與挑高規格對得上 Braeside，而非 Huntingdale 的自儲空間產品）
- [x] 圖片輪播：6 張（建築外觀日／夜景、玻璃立面、展示空間、挑高倉儲內部）
- [ ] 預計完工時間（Studio Warehouse 標示「施工中」，確切日期待補）
- [ ] Huntingdale 自儲空間（Storage Spaces）的正式報價（Braeside 官方文件未涵蓋）
- [ ] Braeside Micro Warehouse（39–193 m²）報價

**待確認事項**
- HEXA 集團「開發總金額」數字，Lumina 官方文件寫約 AUD $500M，FOUND Huntingdale 官方文件則寫
  「超過 AUD $10 億（delivered and under development）」，兩份業主提供的官方文件數字不一致，
  目前網站採用較大／較新的 FOUND 文件數字，正式對外前請跟業主確認正確金額
- **FOUND Braeside 的開發商標示為「Panorama Investment Group」**（其作品列表包含 Panorama Box Hill、
  Panorama Doncaster、Lumina Townhomes），與 Huntingdale 標示的「HEXA Group + Spectre Property」
  不同。網站上已如實呈現兩者並註明差異，但正式對外前務必向業主確認這兩個名稱之間的實際關係
  （是否為同一集團的不同稱呼、母子公司，或個別合作案的專案公司）
- 業務直聯信箱網域為 `kelvin@panoramagroup.net.au`（panoramagroup.net.au），與上述「Panorama Investment
  Group」的關聯性看起來一致，但和網站主要以「HEXA」品牌對外呈現的方式仍是兩個不同名稱，建議一併向業主確認
  對外正式聯絡窗口該用哪個品牌名稱／網域比較恰當

**圖片輪播**
- 三案都是 6 張輪播（左右箭頭 + 下方圓點切換，純 CSS/JS 實作，無外部套件；只有 1 張圖時會自動隱藏箭頭與圓點）
- Panorama 的 6 張是你直接傳到對話裡的實景照（頂樓公設外觀黃昏景、健身房、兒童遊戲區、客廳、廚房），
  加上先前從 Drive 抓的交誼廳照片
- Lumina 與 FOUND 的圖來自你分享的 Google Drive 資料夾
- 三個 Drive 資料夾裡都還有更多張沒用到（Panorama 9 張、Lumina 11 張、FOUND 18 張），如果想換掉某張或調整順序，
  跟我說檔名或描述即可

**業務聯絡資訊**
- [x] 因應台灣受眾不使用 WhatsApp／微信的習慣，導覽列與「業務直聯」區塊的 WhatsApp 按鈕已全數改為
      「立即聯繫」按鈕，點擊後蓋板顯示 Kelvin Wang 的聯絡小卡片（姓名／職稱／電話／信箱），四個頁面共用同一組
      `#contactModal` 標記與 `script.js` 內的開關邏輯
- [x] Kelvin Wang（開發商直銷總監），電話 +61 416 156 826（tel: 連結），
      信箱 kelvin@panoramagroup.net.au（mailto: 連結）
- ⚠️ 你提供的電話格式為「+61 0416 156 826」，多了一個 0；澳洲手機國際格式慣例是拿掉開頭的 0
  （本地寫法 0416 156 826 → 國際寫法 +61 416 156 826），網站上已依國際格式呈現為 +61 416 156 826，
  請確認這支號碼在澳洲當地撥打／WhatsApp 綁定是否正確

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
