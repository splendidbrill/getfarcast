# Stage 1: Build the application
FROM node:20 AS builder
WORKDIR /app

# Skip Playwright browser download in builder — browser lives in runner via apt
ENV DOCKER_BUILD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install build dependencies required for native modules
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --include=optional

COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_YANDEX_METRICA_ID
ARG NEXT_PUBLIC_WHOP_PLAN_ID
ARG NEXT_PUBLIC_CLOUDFRONT_DOMAIN
ARG NEXT_PUBLIC_PAYMENT_PROVIDER
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_YANDEX_METRICA_ID=$NEXT_PUBLIC_YANDEX_METRICA_ID
ENV NEXT_PUBLIC_WHOP_PLAN_ID=$NEXT_PUBLIC_WHOP_PLAN_ID
ENV NEXT_PUBLIC_CLOUDFRONT_DOMAIN=$NEXT_PUBLIC_CLOUDFRONT_DOMAIN
ENV NEXT_PUBLIC_PAYMENT_PROVIDER=$NEXT_PUBLIC_PAYMENT_PROVIDER

RUN npm run build

# Stage 2: Production runner
FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
# Use system Chromium instead of Playwright's download — saves ~300MB from image layers
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# Install system Chromium (pulls all its own deps automatically)
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Install playwright npm packages only — browser binary comes from apt above
RUN npm install --no-save --no-audit --no-fund \
      playwright playwright-extra \
      puppeteer-extra-plugin-stealth puppeteer-extra-plugin \
      merge-deep clone-deep \
    && npm cache clean --force \
    && chown -R nextjs:nodejs /app/node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
