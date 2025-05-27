docker-compose down
docker-compose up db --build -d --remove-orphans
npm i
npm run start:dev