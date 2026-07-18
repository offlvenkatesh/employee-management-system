FROM node:20-alpine AS build
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm install --workspace client
COPY client ./client
WORKDIR /app/client
RUN npm run build

FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
