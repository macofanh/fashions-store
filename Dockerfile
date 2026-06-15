# ── Stage 1: Build ────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files và install dependencies trước (tận dụng Docker layer cache)
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Nhận tất cả VITE_* build args (được baked vào JS bundle lúc build)
ARG VITE_API_BASE_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Build production bundle (bỏ qua type-check để build nhanh hơn)
RUN npm run build-only

# ── Stage 2: Serve ────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Copy nginx config tùy chỉnh (xử lý SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output từ stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
