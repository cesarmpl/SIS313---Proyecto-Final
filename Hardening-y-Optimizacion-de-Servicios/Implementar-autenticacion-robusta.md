## Configuración SSH (Secure Shell) para Acceso Remoto:

# Implementar autenticación robusta (ej. claves SSH).:

**Equipamiento Necesario:**

* Máquinas Virtuales creadas con Ubuntu Server 24.04 LTS instalado.
* Cada VM debe tener el servicio ssh instalado con **sudo apt install openssh-server**

**1. Configuración de la Autenticación por Clave Pública**

Primero se necesita generar el **par de claves**, una **pública y otra privada**, para ello escribimos el siguiente comando en mi caso desde **PowerShell**:  

```bash
ssh-keygen -t rsa -b 4096
```
Este comando generará un par de archivos **public/private rsa key**.

* Confirmamos la ubicación de los archivos que nos solicita **PowerShell** e inmediatamente nos creará los dos archivos en la ruta que escogimos. 
* Nos solicitará una **frase de seguridad**, es opcional, pero yo recomiendo colocarla. 

**2. Copiar la clave pública al servidor Ubuntu:**

Para copiar la clave pública (en mi caso), tuve que hacerlo de forma manual, aplicando el siguiente comando dentro del servidor SSH:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

Aseguramos los permisos con:

```bash
chmod 600 ~/ssh/authotized_keys
```

* Al colocar el último comando te aparecerá un apartado donde debes pegar **la clave pública** (yo la tenía abierta en el Bloc de Notas), y nuevamente CTRL+O para guardar y posteriormente **reiniciar el servidor para guardar cambios**.

* Para probar, entramos nuevamente y ahora nos autentica con la clave que colocamos, y nos pide una frase que es opcional (yo la coloqué). 

```text
login as: cesar
Authenticating with public key "maplehugs_2@DESKTOP-HVSLC2D" 
Passphrase for key "maplehugs_2@DESKTOP-HVSLC2D":
```
Y ya estaría configurada nuestra autenticación por clave exitosamente.


**Copiar nuestra clave pública en cada uno de los servidores**