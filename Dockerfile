FROM node:16
WORKDIR /
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]