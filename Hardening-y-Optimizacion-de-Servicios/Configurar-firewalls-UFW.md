## Configuración de Firewalls UFW dentro de cada Servidor:

# Configurar Puertos:

El firewall ufw (Uncomplicated Firewall) controla qué puertos permite o bloquea el servidor. Sirve para que solo los servicios que queremos estén accesibles desde afuera. Todo lo que no sea necesario queda bloqueado (esto ayuda a proteger los servidores).

**POR SERVIDOR:**

Para visualizar los puertos o servicios que permitimos dentro del servidor utilizamos el comando:

```bash
sudo ufw status
```
Cada servidor tiene puertos que permite u otros comunes, como tal estas son las configuraciones por servidor que tenemos (cada caso es diferente):

**DB Master (db-master):**

```text
Status: active

To                         Action      From
--                         ------      ----
22/tcp                      ALLOW       Anywhere
<PUERTO SSH CAMBIADO>/tcp   ALLOW       Anywhere
3306/tcp                    ALLOW       <IP del DB Slave>
3306/tcp                    ALLOW       <IP del App Server>
```
* El puerto SSH con el que ahora nos conectas (por ejemplo 22222).
* 3306 solo accesible para App Server y Slave.
* No abierto "al mundo", por eso especifica la IP de cada servidor que interactúa.

**DB Slave (db-slave):**

```text
Status: active

To                         Action      From
--                         ------      ----
22/tcp                      ALLOW       Anywhere
<PUERTO SSH CAMBIADO>/tcp   ALLOW       Anywhere
```

**App Server (app-server):**

```text
Status: active

To                         Action      From
--                         ------      ----
22/tcp                      ALLOW       Anywhere
<PUERTO SSH CAMBIADO>/tcp   ALLOW       Anywhere
3000/tcp                    ALLOW       Anywhere 
```
**Balanceador:**

```text
Status: active

To                         Action      From
--                         ------      ----
22/tcp                      ALLOW       Anywhere
<PUERTO SSH CAMBIADO>/tcp   ALLOW       Anywhere
80/tcp                      ALLOW       Anywhere
443/tcp                     ALLOW       Anywhere
3000/tcp                    ALLOW       Anywhere     # Grafana
9090/tcp                    ALLOW       Anywhere     # Prometheus
9103/tcp                    ALLOW       Anywhere     # Node Exporter
```

Y como tal solo se aplica **sudo ufw allow "-"** para añadir el puerto que se le permitirá ingresar, y con esto tendríamos toda la configuración de UFW con los puertos que tienen acceso a los servidores.
