FROM node:12-alpine

## INSTALL CLIENT

RUN mkdir /app
WORKDIR /app

# Copy needed build files
COPY ./.npmrc ./package.json ./package-lock.json ./angular.json ./tsconfig.json ./

# Install dependencies
ARG FA_TOKEN
RUN npm install

# Copy source files
COPY ./src ./src

# Build client for production
ENV NODE_ENV production
RUN npm run build:prod

## RUN NGINX

FROM nginx:mainline-alpine

COPY ./nginx.conf /etc/nginx/conf.d
RUN mkdir /etc/nginx/conf.d/proxy
COPY ./nginx-proxy.conf /etc/nginx/conf.d/proxy
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=0 /app /app