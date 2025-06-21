# Configuración Servidores de Bases de Datos (2 Servers)
## Configuración de Servidor DB Master en  la VM. - 
**Equipamiento Necesario:**
* Una máquina virtual con Ubuntu Server 24.04 LTS instalado
* 3 discos .vdi de 5gb para realizar el RAID

**PASOS:**

**1.  Instalar MySQL en la VM:**
Utilizando los siguientes comandos, realizamos la instalación del servicio:
 
```bash
sudo apt update
```

```bash
sudo apt install mysql-server -y 
```

**2. Configuración para la db-master:**

**2.1. Habilitar el puerto 3306 en UFW:**
Antes de realizar las configuraciones, el firewall está bloqueando el puerto 3306, que es el que usa MySQL utiliza para replicación. Por lo que debemos habilitar el puerto usando los comandos:

```bash
sudo ufw allow 3306/tcp
```
```bash
sudo ufw reload
```
**2.2.  Editar archivo de configuración:**
Para ello, ingresamos al archivo de configuración, este es el archivo que define cómo funciona mysqld (el "motor" de MySQL). 
Por lo que ingresamos a este con el comando: 

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```
**Configuraciones en el mysqld.cnf:**
* **`bind-address = 0.0.0.0`**: Con esto, le decimos a MySQL que acepte conexiones desde **cualquier IP**, no solo localhost. Si no se hace esto, el Slave no podría conectarse.
* **`server-id = 1`**: Se hace esto ya que cada servidor de replicación debe tener un **server-id único**. Por convención colocamos: 1 para el Master.
* **`log_bin = /var/log/mysql/mysql-bin.log`**: Esto, activa el **binary log**. MySQL usará este log para "contar" todas las operaciones que luego serán replicadas al Slave.
* **`binlog_do_db = crud_db`**:Con esto, se le dice a MySQL: **"replica solo esta base de datos"**, en este caso será la base de datos de **app CRUD (crud_db)**. 

Después de esto, se reinicia MySQL para aplicar los cambios con: 

```bash
sudo systemctl restart mysql 
```

Y se verifica que el servicio se encuentra actualmente activo, con el comando: 

```bash
sudo systemctl status mysql
```
La salida debería indicar que el servicio está **active (running)**.


**3. Crear el usuario de replicación:**
Se debe realizar esto, ya que el **Slave** necesita un usuario en el Master para conectarse y replicar. Este usuario debe tener el privilegio **REPLICATION SLAVE**.

**¿Por qué crear un usuario dedicado?**

Porque es más seguro, no se usa el usuario root, también porque el Slave se conecta siempre con este usuario. Si en el futuro se quiere cambiar la clave o restringir el acceso, solo afecta a replicación.

El objetivo de la replicación Master-Slave es que el Slave se conecte al Master para "escuchar" los cambios en la base de datos (INSERT, UPDATE, DELETE).
 
Por seguridad, no queremos que el Slave use el usuario root (que tiene demasiados permisos). Es mejor crear un usuario dedicado solo para la replicación. El Slave no puede leer el binlog del Master si no tiene un usuario autorizado.No es seguro usar el root. Separar los roles (principio de menor privilegio) es **mejor práctica profesional**.

**Para ello:**

Dentro del DB Master utilizamos el siguiente comando:

```bash
sudo mysql -u root -p
```
Esta es la forma de entrar como administrador a MySQL. Así podemos crear bases, usuarios, permisos, ver logs, hacer la configuración manual,etc. 

**Dentro de `mysql>`:**
Creamos un usuario especial para la **replicación en el DB-MASTER.**

```sql
CREATE USER 'replicador'@'%' IDENTIFIED BY '12345678';
GRANT REPLICATION SLAVE ON *.* TO 'replicador'@'%';
FLUSH PRIVILEGES;
```
**¿Que hace esto?**
* Crea un usuario llamado **replicador**, que se podrá conectar desde cualquier IP **(@'%')**.
* La contraseña del usuario es **'12345678'**.
*  Le da permisos de replicación al usuario replicador.
*  Solo con este permiso puede leer los logs binarios y copiar los cambios al Slave.

--> Este es el usuario que usará el DB-SLAVE para conectarse al MASTER.


**3.1. Ver el estado actual del Master (el binlog):**
Aún en MySQL, utilizamos el comando: 

```sql
SHOW MASTER STATUS;
```
Nos dará algo como: 
```text
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB  | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000001 |      868 | crud_db      |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
```
* Guardamos esta información ya que nos servirá para configurar el Slave. 
