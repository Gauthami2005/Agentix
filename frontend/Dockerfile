# Stage 1: Build React Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files and build
COPY . .
RUN npm run build

# Stage 2: Serve React Application with Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration to handle SPA routing if needed
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
