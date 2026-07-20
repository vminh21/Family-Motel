FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Accept build-time arg for backend URL (used in next.config.ts rewrites)
ARG INTERNAL_API_URL=http://backend:5000/api/v1
ENV INTERNAL_API_URL=${INTERNAL_API_URL}

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Pass runtime env for the Next.js server process
ARG INTERNAL_API_URL=http://backend:5000/api/v1
ENV INTERNAL_API_URL=${INTERNAL_API_URL}

EXPOSE 3000
CMD ["node", "server.js"]
