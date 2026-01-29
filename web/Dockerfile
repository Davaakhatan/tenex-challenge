FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY next.config.js tsconfig.json next-env.d.ts ./
COPY app ./app
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
