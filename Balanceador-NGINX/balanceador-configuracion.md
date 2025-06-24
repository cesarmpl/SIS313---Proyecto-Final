
# Balanceador de Carga con NGINX

## Requisitos

- Servidor Ubuntu ya instalado (en VM o físico)
- Acceso a internet

---

##  1. Actualizamos el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

Verificamos SSH:

```bash
sudo systemctl enable ssh      # Para que inicie al arrancar
sudo systemctl start ssh       # Para que inicie inmediatamente
sudo systemctl status ssh      # Para ver el estado de SSH
```

---

## 2. Instalamos NGINX

```bash
sudo apt install nginx -y
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

##  3. Simulamos dos App Servers

Instalamos `netcat-traditional`:

```bash
sudo apt install netcat-traditional -y
```

Comandos para simular servidores:

```bash
ncat -lk 3001 -c 'echo -e "HTTP/1.1 200 OK\r\n\r\n💻 App Server 1 funcionando (Simulado)"'
ncat -lk 3002 -c 'echo -e "HTTP/1.1 200 OK\r\n\r\n App Server 2 funcionando "'
```

Usamos `tmux` para múltiples terminales:

```bash
sudo apt install tmux -y
tmux
```

---

##  4. Crear archivo de configuración del balanceador

Hacemos un backup:

```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
```

Creamos archivo:

```bash
sudo nano /etc/nginx/conf.d/load_balancer.conf
```

---

##  5. Verificamos la configuración de NGINX

```bash
sudo nginx -t
```

---

##  6. Reiniciamos NGINX para aplicar cambios

```bash
sudo systemctl reload nginx
```

---

##  7. Probamos en navegador o con `curl`

Simulación de App Servers con respuestas HTTP bien formadas:

```bash
ncat -lk 3001 -c 'echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 24\r\nConnection: close\r\n\r\nApp Server 1 funcionando"'
```

### Explicación del encabezado HTTP:

- `HTTP/1.1 200 OK`: Respuesta válida
- `Content-Type`: Tipo de dato enviado
- `Content-Length`: Longitud exacta del cuerpo
- `Connection: close`: Cierra la conexión luego de responder

---

## Mejoras para el balanceador y monitoreo

### 1. Keepalive en `upstream`

Permite reutilizar conexiones TCP.

### 2. Limitación de tasa

```nginx
limit_req zone=req_limit_per_ip burst=20 nodelay;
```

### 3. Timeouts detallados

Evitan bloqueos por conexiones lentas.

### 4. Soporte HTTPS + redirección

```nginx
server {
    listen 80;
    server_name tu_dominio.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name tu_dominio.com;
    ssl_certificate /ruta/cert.pem;
    ssl_certificate_key /ruta/key.pem;
    location / {
        proxy_pass http://backend;
    }
}
```

### 5. Soporte WebSocket / HTTP/2

```nginx
location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## 6. Registro y monitoreo avanzado

### a) Logs con rotación

Archivo: `/etc/logrotate.d/nginx-balanceador`

```logrotate
daily
rotate 7
compress
notifempty
postrotate
    systemctl reload nginx > /dev/null
endscript
```

Pruebas:

```bash
sudo logrotate --debug /etc/logrotate.d/nginx-balanceador
sudo logrotate -f /etc/logrotate.d/nginx-balanceador
```

### b) Habilitar `stub_status`

Se habilita en un servidor aparte (puerto 8080). Luego:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### c) Exporter Prometheus

```bash
wget https://github.com/nginxinc/nginx-prometheus-exporter/releases/download/v0.11.0/nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
tar -xzf nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
cd nginx-prometheus-exporter_0.11.0_linux_amd64
./nginx-prometheus-exporter -nginx.scrape-uri http://127.0.0.1:8080/nginx_status
```

Probar:

```bash
curl http://localhost:9113/metrics
```

### d) Instalar Prometheus

```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.52.0/prometheus-2.52.0.linux-amd64.tar.gz
tar -xzf prometheus-2.52.0.linux-amd64.tar.gz
cd prometheus-2.52.0.linux-amd64
nano prometheus.yml
```

Agregar exporter:

```yaml
scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

Ejecutar Prometheus:

```bash
./prometheus --config.file=prometheus.yml
```

Ver en navegador: `http://localhost:9090`

---

## 🔹 Incluir Grafana

### 1. Repositorio oficial

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt update
```

### 2. Instalamos Grafana

```bash
sudo apt install grafana -y
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

Acceso: `http://localhost:3000`  
Usuario: `admin`  
Contraseña: `admin06`

### 3. Agregamos Prometheus como fuente de datos

URL: `http://localhost:9090`

### 4. Dashboard para NGINX

Importar ID: **2949**  
Prometheus Exporter dashboard completo

---

##  Conclusión

### Infraestructura base:

- Ubuntu Server instalado
- NGINX y SSH funcionando
- App Servers simulados con `ncat`
- Balanceador de carga con NGINX
- Navegador verifica funcionamiento

### Monitoreo:

- Prometheus configurado y funcionando
- Exporter expone métricas de NGINX
- Grafana instalado y configurado
- Dashboard profesional con métricas en tiempo real
