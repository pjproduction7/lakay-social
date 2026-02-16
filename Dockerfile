# Use official Node.js image as the build environment
FROM node:20 AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies (ensure devDependencies are installed for the build)
RUN npm ci --include=dev --no-audit --progress=false

# Fallback: explicitly install the Vite React plugin so production Docker builds
# that (for any reason) miss devDeps still have the required plugin available.
# We use --no-save so package.json / package-lock.json are not changed here.
RUN npm install --no-audit --no-fund @vitejs/plugin-react --no-save

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Use a lightweight web server to serve the built files
FROM node:20-slim AS production
WORKDIR /app

# Install 'serve' to serve static files
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
