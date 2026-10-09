# Stage 1: Build static assets
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency manifests and install packages
COPY package*.json ./
RUN npm ci

# Copy application source files and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
