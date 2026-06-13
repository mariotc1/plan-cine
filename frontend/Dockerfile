FROM node:22-alpine

WORKDIR /app

# Install deps (separate layer for cache)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
