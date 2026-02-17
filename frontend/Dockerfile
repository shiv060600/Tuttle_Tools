FROM node:18-bullseye-slim as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the app (script does: cd frontend && vite build)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built app from build stage
COPY --from=build /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
