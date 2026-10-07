FROM node:slim

WORKDIR /app

COPY app.js .
COPY package.json .
COPY package-lock.json .

RUN npm i

CMD ["npm", "run", "serve"]
