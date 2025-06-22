# Configuración Servidores de Aplicaciones (2 Servers)
## Configuramos el servidor VM App Server (app-server):

**Equipamiento Necesario:**

* Una máquina virtual o física con Ubuntu Server 24.04 LTS instalado.
* Servidor en modo bridge.
* Servidores DB previamente creados.

Como paso previo, dentro del **sudo nano /etc/hosts** del app server añadimos la IP del servidor DB Master y su hostname. Debería verse al como esto:

```text
127.0.0.0 localhost
127.0.1.1 app-server
17.5.x.x db-master ----> IP del db-master
```
**1. Instalar Node.js y npm:**

Para actualizar la lista de software disponible y sus versiones más recientes utilizamos el comando:

```bash
sudo apt update
```

Y ahora ejecutamos el siguiente comando para instalar todos los paquetes:

```bash
sudo apt install nodejs npm -y
```

Podemos verificar las versiones de los servicios con los siguientes comandos:

```bash
node -v
npm -v 
```

**2.	Crear estructura de la Aplicación:**

Para realizar este paso, debemos crear un nuevo directorio con **mkdir** donde se almacenará nuestra aplicación **(app-crud)**. Una vez hecho eso, ingresamos a la carpeta con **cd** y colocamos: 

```bash
sudo mkdir -p /opt/app-crud
```

```bash
sudo chown cesar:cesar /opt/app-crud
```

```bash
cd /opt/app-crud
```

Creamos el archivo **package.json** que define el proyecto de Node.js con el siguiente comando:

```bash
npm init -y
```

**3. Instalar librerías necesarias:**

Utilizamos la herramienta **npm** para instalar los paquetes/librerías necesarias **(Ojo: Debemos ejutarlo desde la carpeta /opt/app-crud abierta)**, instalamos:

```bash
npm install express mysql2 body-parser
```

**¿Que acabamos de instalar?**

*	**`Express`**, el cual es el framework de servidor web más usado en Node.js que nos permite crear fácilmente un servidor HTTP, rutas **(GET, POST, PUT, DELETE)** y responder a los clientes (navegadores o apps). Sin Express, tendríamos que escribir todo el código de red "a mano".

*	**`mysql2`**, que es el driver para conectarse a MySQL o MariaDB desde Node.js, este nos permite hacer consultas a la base de datos, además nos permite insertar, leer, actualizar, eliminar registros (CRUD). La versión mysql2 es más moderna y más rápida que la vieja mysql.

*	**`body-parser`** el cual es un middleware que permite que la app entienda el contenido de las peticiones POST y PUT. Cuando un cliente (Postman, navegador, app) envía un POST con datos en formato JSON, este paquete: Lee ese JSON, lo convierte en un objeto de JavaScript y lo pone en **req.body** para que podamos usarlo fácilmente.


**4.	Crear la aplicación CRUD:**

Previamente crearemos un usuario con privilegios en **MYSQL** para hacerlo mas seguro: 

```sql
 CREATE USER 'appuser '@'%' IDENTIFIED BY '12345678'; 
 GRANT ALL PRIVILEGES ON crud_db.* TO 'appuser'@'%'; 
 FLUSH PRIVILEGES;
 ```

**4.1. Crear el archivo index.js:**

Por lo que dentro de la carpeta del proyecto **/opt/app-crud** ejecutamos: 

```bash
nano index.js
```
Y dentro del index desarrollamos todo el código fuente de la aplicación **Node.js**:

```js

// Cargamos las librerías
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Creamos la app Express
const app = express();
const port = 3000;

// Habilitamos el parser de JSON
app.use(bodyParser.json());

// Configuración de conexión a la base de datos (DB Master)
const db = mysql.createConnection({
    host: 'db-master',   // el hostname del master 
    user: 'appuser',          // el usuario de MySQL (appuser)
    password: '12345678',  // la contraseña de appuser
    database: 'crud_db'    // la base de datos que se creó en el servidor
});

// Nos conectamos a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error de conexión:', err);
        return;
    }
    console.log('Conectado a la base de datos');
});

// --- RUTAS CRUD ---

// READ - obtener todos los registros
app.get('/items', (req, res) => {
    db.query('SELECT * FROM test_table', (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});

// CREATE - agregar un registro
app.post('/items', (req, res) => {
    const { data } = req.body;
    db.query('INSERT INTO test_table (data) VALUES (?)', [data], (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ message: 'Registro creado', id: result.insertId });
    });
});

// UPDATE - modificar un registro
app.put('/items/:id', (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    db.query('UPDATE test_table SET data = ? WHERE id = ?', [data, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ message: 'Registro actualizado' });
    });
});

// DELETE - eliminar un registro
app.delete('/items/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM test_table WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ message: 'Registro eliminado' });
    });
});

// Iniciamos el servidor
app.listen(port, () => {
    console.log(`App escuchando en http://0.0.0.0:${port}`);
});

```

**4.2. Probar la app:**

Después de crear el **index.js** exitosamente, ejecutamos el siguiente comando:

```bash
node index.js
```

Esto, dentro de la carpeta **/opt/app-crud$** y deberíamos ver el funcionamiento y conexión a la base de datos en la consola:

```text
cesar@app-server:~$ cd /opt/app-crud
cesar@app-server:/opt/app-crud$ node index.js 
App escuchando en http://0.0.0.0:${port}
Conectado a la Base de Datos
```
La App Server ya está **"en vivo"** y conectado al DB Master.

**4.3. Probar el CRUD:**

```text
Acción	   |  Método HTTP  |	URL
Leer	   | GET	       | http://17.5.44.173:3000/items
Crear	   | POST	       | http:// 17.5.44.173:3000/items
Actualizar | PUT	       | http:// 17.5.44.173:3000/items/:id
Eliminar   | DELETE	       | http:// 17.5.44.173:3000/items/:id

```

* **En la VM App Server:**

Primeramente, podemos utilizar **`curl`** desde el servidor ya que es más fácil y rápido para probar el funcionamiento: 

* **1. Leer (GET):**
Utilizamos: **curl http://localhost:3000/items**

```text
cesar@app-server:~$ curl http://localhost:3000/items
[{"id":1,"data": "Primer Registro desde mi Master"}] 
```

Y como podemos ver, funciona perfectamente la lectura del dato.

* **2. Crear (POST):**

Utilizamos la siguiente línea, para utilizar el **post**: 

```bash
curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d '{"data": "Archivo SQL1 funciona"}'
```
Una vez realizado eso, como salida nos dará algo como esto:

```text
 {"message": "Registro Creado", "id":2}
```
* Y si nos dirigimos a la **VM DB Master**, podemos notar que efectivamente el registro se realizó correctamente. (SELECT* FROM test_table).
* Como también el replicador hizo lo suyo y también se guardan los datos en la BD-Slave.

* **3. Actualizar (PUT):**

```bash
curl -X PUT http://localhost:3000/items/2 -H "Content-Type: application/json" -d '{"data": "Archivo SQL1 actualizado"}
```

Como podemos notar, el PUT también funciona exitosamente. Ahora verificamos si el registro actualizado se muestra en el BD-Slave y también se actualiza nuestra tabla. 

* **4. Eliminar (DELETE):**

```bash
 curl -X DELETE http://localhost:3000/items/1
 ```

Esto nos muestra el mensaje de “Registro Eliminado” con éxito, y dentro del Slave el ítem con data 1 fue eliminado del servidor exitosamente. 


**TAMBIÉN PODEMOS PROBAR LA API UTILIZANDO 'POSTMAN':**

Este, nos permite probar **GET, POST, PUT, DELETE** fácilmente sin tener que usar **curl** o recordar los comandos. Podemos enviar datos con formularios o JSON, con solo unos clics, además podemos ver las respuestas de la API bien formateadas.

**1. Dentro del App—Server**, permitimos el puerto 3000 al Firewall (UFW) con: 

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```
Y colocando eso, podemos utilizar el comando **sudo ufw status** para verificar que el puerto muestra **ALLOW**. 


**2.Ingresamos a Postman** y en “Enter url or request” colocamos la IP del App Server y el puerto 3000: 

```text
http://17.5.x.x:3000/items
```

Como resultado, ya nos muestra la base de datos. 

* Dentro de Postman hay un menú desplegable al lado izquierdo, donde podemos colocar la acción que deseamos realizar, por ejemplo:

**POST:**

Seleccionamos la acción **POST**. Nos dirigimos a **Body**, seleccionamos “raw” y JSON, y luego en las líneas de comando abajo, colocamos este formato y el Ítem que deseamos añadir:

```json
{
    "data": "Archivo MySQL postman 2"
}
```

 Posteriormente le damos **send**, y nos saldrá un mensaje como este: 

```json
{
    "message": "Registro Creado",
    "id": 4
}
```

* Verificamos en la base de datos Salve y en efecto todo se encuentra funcionando perfectamente.
