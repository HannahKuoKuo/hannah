FROM node:18-alpine AS builder

WORKDIR /app

# 複製 package files
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源代碼
COPY . .

# 構建
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# 僅複製必需的文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 安裝生產依賴
RUN npm ci --omit=dev

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["npm", "start"]
