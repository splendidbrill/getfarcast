# Stage 1: Build the application
FROM node:20 AS builder
WORKDIR /app

# Install build dependencies required for native modules
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

# Store Playwright browsers inside /app so we can COPY them to the runner
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright

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

# Install Chromium system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxcb1 libxkbcommon0 libx11-6 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.playwright /app/.playwright

# Playwright and stealth plugin are in serverExternalPackages so Next.js standalone
# does not bundle them — copy the packages explicitly so they can be required at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/playwright ./node_modules/playwright
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/playwright-core ./node_modules/playwright-core
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/playwright-extra ./node_modules/playwright-extra
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/puppeteer-extra-plugin-stealth ./node_modules/puppeteer-extra-plugin-stealth
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/puppeteer-extra-plugin ./node_modules/puppeteer-extra-plugin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/merge-deep ./node_modules/merge-deep
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/clone-deep ./node_modules/clone-deep

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
