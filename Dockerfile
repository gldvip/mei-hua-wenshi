FROM docker.m.daocloud.io/library/node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY index.html vite.config.mjs ./
COPY src ./src
RUN npm run build:h5

FROM nginx:alpine

COPY --from=builder /app/dist/build/h5 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
