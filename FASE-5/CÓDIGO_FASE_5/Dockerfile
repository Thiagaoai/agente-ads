FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
COPY index.js ./

ENV NODE_ENV=production
EXPOSE 3200

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3200/health || exit 1

CMD ["node", "index.js"]
