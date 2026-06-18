FROM node:20-alpine

# Set to production environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies only, with caching cleanup
RUN npm install --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy application source code
COPY --chown=node:node . .

# Run as non-root user for security
USER node

EXPOSE 5002

# Liveness/Readiness healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --spider --tries=1 http://localhost:5002/health || exit 1

CMD ["node", "src/index.js"]
