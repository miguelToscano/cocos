### Requirimientos
- Docker
- Node.js (v18 o superior)

### Instalacion

1 - Clonar repositorio
```bash
git clone https://github.com/miguelToscano/cocos.git
```

2 - Entrar al directorio del proyecto
```bash
cd cocos
```

3 - Instalar dependencias
```bash   
npm install
```

4 - Crear archivo de variables de entorno
```bash
cp .env.example .env
```

5 - Levantar base de datos
```bash
docker compose up -d db --build
```

6 - Levantar el servidor
```bash
npm run start
```

Al momento de levantar la base de datos se ejecutara un script que creara las tablas necesarias y cargara datos de prueba. Para poder verdaderamente testear la performance de la aplicacion se crea un usuario con `id` = 1 para el cual se crean 140000 ordenes (10000 de CASH_IN + 2000 de BUY). Asi mismo tambien se crean 10000 instrumentos para comprobar la performance de los endpoints de busqueda.

### Tests
Para ejecutar los tests usar el siguiente comando (el mismo tambien levantara la base de datos de prueba):
```bash
npm run test:e2e
```