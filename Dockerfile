# Dependencies
FROM node:21-alpine3.19 AS deps

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install


# Builder - Builds the application
FROM node:21-alpine3.19 AS build

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules

COPY . .

RUN npm run build -- --configuration=production


# Final production image — Angular outputs static files, served via nginx
FROM nginx:1.27-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist/SchoolBuyAoCPro/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

ENV NODE_ENV=production

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
