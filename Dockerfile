FROM node:20 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --progress=false
RUN npm install --no-audit --no-fund @vitejs/plugin-react --no-save
COPY . .

# Accept the variable as a build arg and expose it to Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build