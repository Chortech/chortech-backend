FROM node:14.15.0-alpine3.10

WORKDIR /app

COPY package.json .

RUN npm install -g typescript\
    && npm install --only=prod

COPY . .

RUN tsc

CMD [ "npm", "run","start:prod" ]