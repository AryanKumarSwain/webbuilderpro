# Build Stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Static Server Stage (Nginx)
FROM nginx:alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY ../nginx/docker-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
