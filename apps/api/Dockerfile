FROM node:18-alpine

WORKDIR /app

# 複製 package files
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源代碼
COPY . .

# 構建
RUN npm run build

# 暴露端口
EXPOSE 3001

# 啟動應用
CMD ["npm", "start"]
