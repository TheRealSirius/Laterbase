FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV WISHLIST_DATA_DIR=/data

COPY --from=build /app/dist ./dist
COPY server ./server

RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 8080

CMD ["node", "server/server.js"]
