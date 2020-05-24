FROM arm32v7/node:14.3

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN npm install

CMD [ "npm", "start" ]
