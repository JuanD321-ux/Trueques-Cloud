FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY uploads ./uploads

EXPOSE 3003
CMD ["npm", "start"]
