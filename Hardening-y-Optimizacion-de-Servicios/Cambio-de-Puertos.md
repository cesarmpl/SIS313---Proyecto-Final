## Configuración SSH (Secure Shell) para Acceso Remoto:

# Cambio de Puertos Predeterminados:

**Equipamiento Necesario:**

* Máquinas Virtuales creadas con Ubuntu Server 24.04 LTS instalado.
* Cada VM debe tener el servicio ssh instalado con **sudo apt install openssh-server**

**1. Verificación del Estado del Servicio SSH**

Para verificar esto, debemos utilizar el comando:

```bash
sudo systemctl status ssh
```
Esto nos mostrará el estado actual de servicio, y debe aparecer como **Active (Running)**.


**2. Configuración del Servidor SSH (Archivo sshd_config):** 

Para ello, ingresamos al archivo de configuración con el comando:

```bash
sudo nano /etc/ssh/sshd_config
```
* Dentro del archivo, localizamos el campo **`#Port 22`**. Quitamos el **#** para descomentar la línea y cambiamos el puerto, por lo general debe ser un puerto con un número alto para evitar problemas. Como por ejemplo: **Port 22222**.


**OTRAS CONFIGURACIONES CONVENIENTES PARA LA SEGURIDAD:**

*	**`ListenAddress 0.0.0.0`:** Se estableció esta directiva para que el servidor SSH escuche en todas las interfaces de red disponibles. Permite conexiones entrantes desde cualquier red a la que el servidor esté conectado.

*	**`PermitRootLogin no`:** Se deshabilitó el inicio de sesión SSH directo como root. Refuerza la seguridad al impedir accesos con la cuenta administrativa principal. Se recomienda usar sudo desde un usuario autorizado.

*	**`PasswordAuthentication:`** no Se deshabilitó el acceso por contraseña. Obligando el uso de autenticación por clave pública SSH, una forma más segura de autenticación.

*	**`PubkeyAuthentication yes:`** Se habilitó el uso de autenticación por clave pública la cual permite acceder al servidor solo a quienes posean una clave privada válida correspondiente a una clave pública autorizada.

*	**`ClientAliveInterval 300 y ClientAliveCountMax 3:`** Se configuraron intervalos de verificación de conexión para cerrar sesiones inactivas, ahorrando recursos del sistema y mejorando la seguridad.


*  	Finalmente se guarda el archivo con el comando CTRL+O->Enter->CTRL+X(Salir) y para aplicar los cambios debemos reiniciar el servicio ssh con: 

```bash
sudo systemctl restart ssh
```

**ESTAS CONFIGURACIONES SE REALIZAN EN TODAS LAS VM DE LOS SERVIDORES**