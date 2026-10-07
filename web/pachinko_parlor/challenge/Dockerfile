FROM node:22-alpine
WORKDIR /app
RUN chown node:node /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node", "server.js"]
