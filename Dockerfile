# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /bot
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/src/app.js"]