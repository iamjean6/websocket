# Stage 1: Build the Vite app
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Default environment variables for envsubst
ENV PORT=80
ENV BACKEND_URL=http://localhost:8080

# Copy the build output to Nginx's html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration as a template so envsubst runs on it
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Force Nginx to run only 2 workers instead of 'auto' (which spawns 100+ on Railway's large nodes causing OOM/Restarts)
RUN sed -i 's/worker_processes.*/worker_processes 2;/g' /etc/nginx/nginx.conf

# At runtime, Nginx's entrypoint script will use envsubst to process 
# /etc/nginx/templates/default.conf.template into /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
