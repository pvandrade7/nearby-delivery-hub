# ──────────────────────────────────────────────────────────
# Stage 1 — build
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (camada cacheável)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copia o restante do código
COPY . .

# Variáveis de ambiente necessárias em build time (Vite injeta no bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN npm run build

# ──────────────────────────────────────────────────────────
# Stage 2 — serve
# ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia config customizada e os assets buildados
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html | grep -q "<div" || exit 1

CMD ["nginx", "-g", "daemon off;"]
