# 台灣市場廣告到達頁（一頁式網站）

純 HTML / CSS / JS 打造的一頁式 Landing Page，設計目的是承接台灣市場的廣告流量（Google Ads / Meta 廣告等），主網站仍在澳洲，這裡只做導流與收單。

## 檔案結構

```
index.html   單頁內容（Hero、特色、產品介紹、見證、FAQ、CTA 表單、頁尾）
styles.css   樣式（手機優先，含響應式）
script.js    表單送出邏輯、動態年份
assets/      圖片素材（目前為佔位圖，請替換成正式素材）
```

## 本機開發

```bash
npm run dev
```

會啟動本機伺服器（http://localhost:3000），修改 index.html / styles.css / script.js 後重新整理瀏覽器即可看到變化。

也可以不裝任何東西，直接用瀏覽器打開 `index.html`（部分瀏覽器功能如 fetch 可能受限，建議仍用上面的方式）。

## 待填內容（上線前必做）

- [ ] `index.html` 內所有「在這裡填入 / 這裡填入」的文案，換成實際產品/服務內容
- [ ] `assets/product-placeholder.svg`、`assets/og-image.svg` 換成正式圖片
- [ ] Hero 標題與 CTA 文案，建議依廣告受眾調整
- [ ] `<title>` 與 `<meta name="description">`，影響 SEO 與廣告品質分數
- [ ] 表單送出邏輯（`script.js` 內 TODO）：可接第三方表單服務（如 Formspree、Google Sheet）或自己的後端 API
- [ ] 追蹤碼：`index.html` 頭部已預留 GA4 與 Meta Pixel 的註解區塊，換上正式的 Measurement ID / Pixel ID 並取消註解
- [ ] 轉換事件：表單送出成功後，在 `script.js` 觸發 `gtag('event', 'generate_lead')` / `fbq('track', 'Lead')`，才能在廣告後台看到轉換數據
- [ ] 頁尾的澳洲官網連結，確認網址正確

## 部署建議

靜態網站，可直接部署到免費的靜態託管服務，不需要伺服器：

- **Cloudflare Pages**：連接 GitHub repo，自動部署，速度快、有台灣附近的 CDN 節點
- **Vercel** / **Netlify**：同樣支援連接 repo 自動部署
- **GitHub Pages**：免費但自訂網域設定稍微多一步

部署後記得：
1. 綁定正式網域（例如 `landing.yourbrand.com`）
2. 確認手機版顯示正常（廣告流量大多來自手機）
3. 用 Google PageSpeed Insights 測一下速度，影響廣告品質分數與轉換率
