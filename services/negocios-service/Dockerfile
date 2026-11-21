FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
RUN mkdir -p /data/uploads
EXPOSE 4002
CMD ["node", "src/index.js"]
