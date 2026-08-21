# 快速開始指南

ACE Sign 行銷追蹤儀表板 - 快速上手

## 5 分鐘快速開始

### 1. 克隆倉庫

```bash
git clone <your-repo-url>
cd hannah
```

### 2. 設置環境

```bash
# 複製環境配置
cp .env.example .env

# 編輯 .env 文件並填入你的 API 密鑰
nano .env
```

最小必需配置：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ace_sign_marketing
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-this
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 啟動應用

**方式 A：使用 Docker（推薦）**

```bash
docker-compose up -d
```

**方式 B：本地開發**

```bash
# 安裝依賴
npm install

# 運行遷移
npm run db:migrate

# 啟動開發服務器
npm run dev
```

### 4. 訪問應用

- **儀表板**：http://localhost:3000
- **API**：http://localhost:3001

### 5. 創建帳戶

1. 點擊「立即註冊」
2. 填入姓名、電子郵件和密碼
3. 點擊「立即註冊」
4. 完成！你現在可以訪問儀表板

## 初始設置步驟

### 第 1 步：連接 Meta 帳戶

1. 在儀表板中轉到「設置 > 社群媒體」
2. 點擊「連接 Facebook/Instagram」
3. 使用你的 Meta 帳戶授權應用
4. 選擇你想要管理的 Instagram/Facebook 帳戶
5. 點擊「連接」

### 第 2 步：連接 MailerLite（電子郵件）

1. 轉到「設置 > 電子郵件」
2. 點擊「連接 MailerLite」
3. 輸入你的 MailerLite API 密鑰
4. 點擊「驗證並連接」

**如何獲取 MailerLite API 密鑰：**

1. 登入 [MailerLite](https://mailerlite.com)
2. 轉到帳戶 > 集成 > API
3. 複製 API 密鑰
4. 粘貼到儀表板中

### 第 3 步：連接 LinkedIn（可選）

1. 轉到「設置 > 社群媒體」
2. 點擊「連接 LinkedIn」
3. 使用你的 LinkedIn 帳戶授權
4. 點擊「連接」

### 第 4 步：連接 Google Ads（可選）

1. 轉到「設置 > 廣告」
2. 點擊「連接 Google Ads」
3. 選擇你的 Google Ads 帳戶
4. 點擊「授權」

## 常見工作流程

### 發送 EDM 活動

1. 轉到「EDM 管理」
2. 點擊「新建活動」
3. 填入主題和內容
4. 選擇收件人
5. 設置發送時間（立即或排程）
6. 點擊「發送」

### 排程 Instagram 貼文

1. 轉到「社群媒體」
2. 選擇「Instagram」
3. 點擊「新建貼文」
4. 上傳圖片並寫入文案
5. 設置發布時間
6. 點擊「排程」

### 創建 LinkedIn 貼文

1. 轉到「社群媒體」
2. 選擇「LinkedIn」
3. 點擊「新建貼文」
4. 寫入文案（支援格式）
5. 設置發布時間
6. 點擊「排程」

### 生成 UTM 鏈接

1. 轉到「工具 > UTM 管理器」
2. 點擊「生成 UTM 鏈接」
3. 填入詳細信息：
   - 基礎 URL：`https://example.com/product`
   - 來源：`instagram`
   - 媒介：`social`
   - 活動：`summer_sale`
4. 點擊「生成」
5. 複製鏈接並在貼文中使用

### 查看 UTM 效果

1. 轉到「工具 > UTM 管理器」
2. 點擊你想查看的鏈接
3. 查看點擊數和訪客來源

### 生成月度報告

1. 轉到「報告」
2. 點擊「生成新報告」
3. 選擇月份和年份
4. 點擊「生成」
5. 查看或下載 PDF

### 設置自動報告

1. 轉到「報告」
2. 點擊「排程報告」
3. 選擇頻率（每週/每月/每季）
4. 填入收件電子郵件
5. 點擊「保存」

## 內容排程規則

系統自動幫助你管理內容發布計畫：

### Instagram

- **貼文**：每週 2 條（每 3.5 天）
  - 最佳時間：上午 10:00、晚上 7:00（UTC）
  
- **故事**：每 72 小時 1 條
  - 最佳時間：中午 12:00、下午 6:00（UTC）

### LinkedIn

- **貼文**：每週 1 條
  - 最佳時間：上午 8:00、下午 1:00（UTC）

### 電子郵件（MailerLite）

- **新聞通訊**：每月 1 份
  - 最佳時間：周一上午 10:00（UTC）

## 數據分析

### 儀表板指標

**EDM 指標：**
- 發送的活動數
- 總收件人數
- 打開率
- 點擊率
- 反彈率

**社群媒體指標：**
- 貼文數
- 總讚數
- 留言數
- 分享數
- 互動率

**廣告指標：**
- 活躍活動
- 總支出
- 展示次數
- 點擊數
- 轉換率
- ROI

### 自定義報告

1. 轉到「報告」
2. 點擊「自定義報告」
3. 選擇要包含的指標
4. 設置日期範圍
5. 點擊「生成」

## 最佳實踐

### 社群媒體管理

1. **保持一致的發布時間表**
   - 使用排程功能提前準備內容
   - 在最佳時間自動發布

2. **監控互動**
   - 每天檢查評論和私訊
   - 及時回復粉絲

3. **分析效果**
   - 每週檢查分析數據
   - 確定表現最好的內容

### EDM 行銷

1. **保留訂閱者列表**
   - 定期清理無效地址
   - 設置自動退訂管理

2. **A/B 測試**
   - 測試不同的主題行
   - 測試不同的發送時間

3. **個性化內容**
   - 根據訂閱者興趣分段
   - 使用動態內容

### 廣告投放

1. **預算規劃**
   - 根據平台分配預算
   - 監控每日支出

2. **目標受眾**
   - 明確定義目標人群
   - 定期優化受眾設置

3. **創意測試**
   - A/B 測試不同廣告創意
   - 跟蹤轉換來源

### UTM 追蹤

1. **命名規範**
   - 使用一致的命名規則
   - 保持簡潔清晰

2. **全面追蹤**
   - 為所有行銷鏈接添加 UTM
   - 包括社群媒體、電子郵件、廣告

3. **定期分析**
   - 每週檢查 UTM 效果
   - 優化效果不佳的活動

## 常見問題

### Q: 如何導出數據？

A: 進入任何報告頁面，點擊「下載」按鈕選擇 CSV 或 PDF 格式。

### Q: 我可以管理多個帳戶嗎？

A: 當前版本支持連接多個 Meta、LinkedIn 和 MailerLite 帳戶。

### Q: 歷史數據會保留多久？

A: 所有數據永久保存，除非手動刪除。

### Q: 支持哪些語言？

A: 目前支持中文和英文。

### Q: 有 API 嗎？

A: 是的！詳見 [API 文檔](./API.md)。

### Q: 如何重置密碼？

A: 在登入頁面點擊「忘記密碼」。

## 獲取幫助

### 文檔

- [API 文檔](./API.md)
- [部署指南](./DEPLOYMENT.md)
- [故障排除](./TROUBLESHOOTING.md)

### 聯繫支持

- 📧 郵件：support@acesign.com
- 💬 在線聊天：訪問 https://acesign.com/chat
- 📞 電話：+886-2-XXXX-XXXX

### 社群

- 🐦 Twitter：[@ACESignMarketing](https://twitter.com/ACESignMarketing)
- 📘 Facebook：[ACE Sign](https://facebook.com/acesign)

## 下一步

1. ✅ 設置所有社群媒體帳戶
2. ✅ 創建你的第一個 EDM 活動
3. ✅ 排程 Instagram 貼文
4. ✅ 生成 UTM 鏈接
5. ✅ 設置自動月度報告

準備好了嗎？[開始使用儀表板](http://localhost:3000)
