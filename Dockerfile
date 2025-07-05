FROM node:18-alpine as build-stage

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy the built app to nginx's serve directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime config and entrypoint script
COPY public/config.js /usr/share/nginx/html/config.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Use custom entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
