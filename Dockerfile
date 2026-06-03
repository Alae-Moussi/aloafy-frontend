# Stage 1: Build the Angular application
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the build output from the first stage to the Nginx HTML folder
COPY --from=build /app/dist/aloafy-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
