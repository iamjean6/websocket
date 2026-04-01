FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
