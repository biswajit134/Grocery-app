# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

# Build-time arguments for frontend environment variables
ARG VITE_AUTH_URL
ARG VITE_PRODUCT_URL
ARG VITE_ORDER_URL

ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_PRODUCT_URL=$VITE_PRODUCT_URL
ENV VITE_ORDER_URL=$VITE_ORDER_URL

RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy static assets from build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Modify permissions to run Nginx as a non-root user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html

USER nginx

EXPOSE 3000

# Health check to ensure nginx is serving the files
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --spider --tries=1 http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
