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

Al momento de levantar la base de datos automaticamente se ejecutara un script `init.sql` que creara las tablas e indices necesarios y cargara datos de prueba. Para poder testear la performance de la aplicacion se crea un usuario con `id` = 5 para el cual se crean 30.000 ordenes (10.000 de CASH_IN + 20.000 de BUY). Asi mismo tambien se crean 10.000 instrumentos para comprobar la performance de los endpoints de busqueda.

### Tests
Para ejecutar los tests usar el siguiente comando (el mismo tambien levantara la base de datos de prueba):
```bash
npm run test:e2e
```

### Consideraciones
- La inicializacion de la base de datos se deberia realizar a traves de migraciones.
- Las consultas a la base de datos deberian mapearse a modelos de ORM para asegurar la integridad de sus tipos.
- Priorice 100% la performance de la aplicacion por lo cual opte por usar raw SQL para tener el mayor control posible sobre las consultas y sus planes de ejecucion, logrando asi poder soportar una gran cantidad de datos sin problemas.
- Cree indices necesarios en las tablas para mejorar la performance de las consultas (Incluyendo optimizaciones para busqueda de texto).
- Si bien en todos los endpoints se envia `userId`, este dato deberia obtenerse a traves de la autenticacion del cliente.
  