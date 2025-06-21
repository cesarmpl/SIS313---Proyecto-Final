## Configuración de Servidor DB Slave en  la VM 
**Equipamiento Necesario:**
* Una máquina virtual con Ubuntu Server 24.04 LTS instalado.
* La información obtenida en el **SHOW MASTER STATUS**. 

**PASOS:**

**1.  Instalar MySQL en la VM:**
Utilizando los siguientes comandos, realizamos la instalación del servicio:
 
```bash
sudo apt update
```

```bash
sudo apt install mysql-server -y 
```
**2. Configuración para la db-slave:**
Configuramos el archivo de hosts, colocamos la IP del **db-master** configurado anteriormente y su hostname: 

```bash
sudo nano /etc/hosts
```

Debería verse algo así:
```text
127.0.0.1 localhost
127.0.1.1 db-slave
17.5.x.x db-master --> Ip del db-master y el hostname
```

* Obtenemos la IP dentro del servidor **db-master** utilizando el comando **`ip a`**. 


**3. Configurar /etc/mysql/mysql.conf.d/mysqld.cnf en el Slave:**
Esto se configura para que el servidor se identifique como Slave y prepare el **relay log**. Para ello, ingresamos al archivo con el comando: 

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Dentro de este se realizan los siguientes cambios:

* **`bind-address = 0.0.0.0`**: Esto para que sea accesible en red (en caso de monitoreo o administración remota).
* **`server-id = 2`**: Debido a que cada server en replicación debe tener ID único (Master=1, Slave=2).
* **`relay_log = /var/log/mysql/mysql-relay-bin.log`**: Es el log que el Slave usa para aplicar los cambios que recibe del Master.

Y reiniciamos el servicio para aplicar los cambios: 

```bash
sudo systemctl restart mysql
```

**4. Configurar la replicación en el Slave:**

Para ello, entramos a **MySQL** colocando en el db-slave:

```bash
sudo mysql -u root -p
```
La línea de comandos cambiará a **`mysql>`** y ahí configuramos: 

```sql
STOP SLAVE;
CHANGE MASTER TO MASTER_HOST='db-master', MASTER_USER= 'replicador', MASTER_PASSWORD='12345678', MASTER_LOG_FILE='mysql-bin.000003', MASTER_LOG_POS=868;
mysql> START SLAVE;
```

* Con esto, le decimos que se conecte al Master (MASTER_HOST='db-master'),usando el usuario de replicación que creamos en el **db-master** y que empiece a replicar a partir del File y Position que vimos en el **SHOW MASTER STATUS** **`(IMPORTANTE)`**.


**5. Probar conexión desde el Slave:**

Para realizar esto, salimos de MySQL y seguimos los siguientes pasos:

**5.1. Instalamos telnet con el siguiente comando:**

```bash
sudo apt install telnet -y
```

El comando **telnet** es una herramienta que te permite probar si puedes conectar a un puerto en otra máquina.

* Una vez **instalado**, colocamos el siguiente comando:

```bash
telnet db-master 3306
```

* **`db-master`**: Es el nombre o IP del servidor Master de la base de datos.

* **`3306`** Es es el puerto por donde escucha MySQL (el puerto estándar).


Una vez ejecutado el comando, nos debe salir: **Connected to db-master**. Que significa que el slave puede llegar al master. 

**6. Reiniciar la aplicación:**

Ingresamos nuevamente a MYSQL dentro del Slave y ejecutamos los siguientes comandos sql: 


```sql
STOP SLAVE;
START SLAVE;
SHOW SLAVE STATUS\G;
```

* Ejecutando el comando **SHOW SLAVE STATUS\G;** nos muestra una serie de datos. De los cuales **`Slave_IO_Running`** y **`Slave_SQL_Running`** deben estar marcados como **YES** y no debe mostrar ningún error.


**Nuestro Caso: Connecting**

Al ejecutar el comando **SHOW SLAVE STATUS\G;**,notamos que hay conexión con MYSQL (yes), pero el **Slave_IO_Running** dice **Connecting**, y además nos muestra un error. El Slave intenta loguearse como replicador al Master, pero falla.

**¿Que hacer?**

**1. Revisar como se creó el usuario ‘replicador’:**

Para ello dentro del **DB Master**, en MYSQL, utilizamos el siguiente comando: 

```sql
SELECT user, host, plugin FROM mysql.user;
```

Y nos mostrará algo como esto: 

```text
+------------------+----------+-----------------------+
| user             | host     | plugin                |
+------------------+----------+-----------------------+
| replicador       |      %   | caching sha2_password |
+------------------+----------+-----------------------+
```

* Y aquí es donde notamos el error. El **`caching_sha2_password`** no es compatible por defecto con replicación entre servidores MySQL 5.x/8.x. El Slave espera que sea: **`mysql_native_password`**. 

* Por lo que para solucionarlo eliminamos el usuario viejo por seguridad, lo volvemos a crear con el plugin correcto y le damos permisos con los siguientes comandos:

```sql
DROP USER IF EXISTS 'replicador '@'%'; --Borra el usuario
CREATE USER 'replicador '@'%' IDENTIFIED WITH mysql_native_password BY '12345678'; -- Crear usuario con el plugin correcto
GRANT REPLICATION SLAVE ON *.* TO 'replicador '@'%';
FLUSH PRIVILEGES; --Darle privilegios
```

Y luego en el Slave volvemos a corregir nuestro usuario de replicación:

```sql
STOP SLAVE;
CHANGE MASTER TO MASTER_HOST='db-master', MASTER_USER= 'replicador', MASTER_PASSWORD='12345678', MASTER_LOG_FILE='mysql-bin.000003', MASTER_LOG_POS=868;
mysql> START SLAVE;
```

* Y una vez dando en el **SHOW SLAVE STATUS\G**, podemos notar que efectivamente ya no nos muestra ningún error y además ambos campos 
**(Slave Slave_IO_Running y Slave_SQL_Running)** se encuentran en **YES**, por lo que la replicación está funcionando con éxito. 

**7. Validar la Replicación**
Para la prueba, crearemos una **Base de Datos**, la cual es la misma que configuramos en el **mysqld.cnf** en pasos anteriores del 
**DB MASTER (binlog_do_db = crud_db)**.


Por lo que para ello en el **DB MASTER**, creamos una Base de datos llamada **db_crud** y dentro de ella crearemos una tabla llamada **test_table**. Para ello:

```sql
CREATE DATABASE crud_db; --Crear base de datos
USE crud_db;
CREATE TABLE test_table (id INT PRIMARY KEY AUTO_INCREMENT, data VARCHAR(100)); --crear la tabla
```
Y dentro de esta tabla añadimos un registro:

```sql
INSERT INTO test_table (data) VALUES ('Primer Registro desde mi Master');
```

* Ahora, desde nuestra **DB SLAVE** comprobamos que los cambios hechos en el Master se replican en el Slave en tiempo real:

**En el DB Slave.**

```sql
USE crud_db;
SELECT * FROM test_table;
```

Y nos debe mostrar algo como esto:

```text
+---------------------------------------+
| id | data                             |             
+---------------------------------------+
| 1  | Primer Registro desde mi Master  | 
+---------------------------------------+
```

Y con esto confirmamos que efectivamente nuestra Base de Datos tanto **Master como Slave están funcionando**, demostrando replicación para tolerancia a fallos y consistencia de datos. 

