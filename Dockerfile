FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build --configuration=production

FROM nginx:alpine


RUN npx ng build --configuration production
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
