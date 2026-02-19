# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --no-audit --progress=false

# Copy the rest of the server code
COPY . .

# Expose the port your server listens on
EXPOSE 4001

# Start the server using the actual entrypoint in this repo
CMD ["node", "server/src/index.js"]
