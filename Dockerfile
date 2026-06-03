# Stage 1: Build Angular App
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We disable prerendering and ssr here so it builds directly into static files
RUN npm run build -- --configuration=production --prerender false --ssr false

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Points directly to the compiled project output folder seen in your angular.json
COPY --from=build /app/dist/spotify-clone/browser/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
