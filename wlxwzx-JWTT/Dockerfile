# 使用官方 Node.js 运行时作为构建环境
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖，因为vite是devDependency）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用轻量级 Nginx 作为生产环境
FROM nginx:alpine

# 复制构建好的文件到 Nginx 静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（可选）
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]