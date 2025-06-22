## Configuración SSH (Secure Shell) para Acceso Remoto:

# Deshabilitar Usuarios Innecesarios:

**Equipamiento Necesario:**

* Máquinas Virtuales creadas con Ubuntu Server 24.04 LTS instalado.
* Cada VM debe tener el servicio ssh instalado con **sudo apt install openssh-server**

**1. Ingresar al archivo de configuración de SSH**

Para ello ejecutamos el siguiente comando:

```bash
sudo nano /etc/ssh/sshd_config
```

Te diriges a la última línea y colocas **`DenyUsers`** junto al nombre del usuario. De la siguiente manera:

```bash
DenyUsers invitado 
```
Por ejemplo en este caso se le niega el ingreso al usuario **`"invitado"`** creado para el proyecto. 


**2. Comprobar configuración:**

Para prueba ingresé nuevamente con el usuario de manera remota y el acceso es denegado, mostrando un mensaje como este:

```text
login as: invitado
invitado@17.5.x.x's password:
Access denied
```

**3. Verifica en el servidor los intentos fallidos (opcional):**

Para visualizar los intentos, colocamos el comando:

```bash
sudo journalctl -u ssh
```

Y dentro de este, debería mostrar el intento denegado:

```text
may 29 16:26:30 db-master sshd [2404]: User invitado from 17.5.x.x not allowed because listed in DenyUsers
```