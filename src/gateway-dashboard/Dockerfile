FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the vite app
RUN npm run build

# Install a simple static server
RUN npm install -g serve

# Run serve on port 3004
EXPOSE 3004
CMD ["serve", "-s", "dist", "-p", "3004"]
