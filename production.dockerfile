FROM arm32v7/node:17.3

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN npm install

RUN mkdir -p data/stats

CMD [ "npm", "start" ]
