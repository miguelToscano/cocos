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

### Tests
Para ejecutar los tests usar el siguiente comando (el mismo tambien levantara la base de datos de prueba):
```bash
npm run test:e2e
```