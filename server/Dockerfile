FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --workspace server
COPY server ./server
WORKDIR /app/server
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --omit=dev --workspace server
COPY --from=build /app/server/dist ./server/dist
WORKDIR /app/server
CMD ["npm", "run", "start"]
