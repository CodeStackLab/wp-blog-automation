# Integration with Existing Web Server (Apache/Nginx)

Since ports 80 and 443 are already in use, you have two options:

## Option 1: Use Existing Web Server as Reverse Proxy (Recommended)

Configure your existing web server to proxy requests to the Docker container.

### For Apache:

Create a new virtual host file: `/etc/apache2/sites-available/wp-automation.conf`

```apache
<VirtualHost *:80>
    ServerName wp.vjgp.online
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName wp.vjgp.online
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/wp.vjgp.online/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/wp.vjgp.online/privkey.pem
    
    # Password Protection
    <Location />
        AuthType Basic
        AuthName "Restricted Access"
        AuthUserFile /root/.gemini/antigravity/scratch/wp-automation/nginx/.htpasswd
        Require valid-user
    </Location>
    
    # Proxy to Docker container
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
    
    ErrorLog ${APACHE_LOG_DIR}/wp-automation-error.log
    CustomLog ${APACHE_LOG_DIR}/wp-automation-access.log combined
</VirtualHost>
```

Enable required modules and site:
```bash
sudo a2enmod proxy proxy_http ssl rewrite
sudo a2ensite wp-automation
sudo systemctl reload apache2
```

### For Nginx:

Create a new server block: `/etc/nginx/sites-available/wp-automation`

```nginx
server {
    listen 80;
    server_name wp.vjgp.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wp.vjgp.online;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/wp.vjgp.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wp.vjgp.online/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Password Protection
    auth_basic "Restricted Access";
    auth_basic_user_file /root/.gemini/antigravity/scratch/wp-automation/nginx/.htpasswd;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/wp-automation-access.log;
    error_log /var/log/nginx/wp-automation-error.log;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/wp-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Then use simplified Docker Compose:

```bash
# Use only the app container
docker-compose -f docker-compose-app-only.yml up -d
```

## Option 2: Use Alternative Ports

Use the alternative Docker Compose configuration:

```bash
# Use alternative ports (8080 for HTTP, 8443 for HTTPS)
docker-compose -f docker-compose-alternative.yml up -d
```

Access via: `https://wp.vjgp.online:8443`

Then configure your existing web server to redirect:
```nginx
server {
    listen 80;
    server_name wp.vjgp.online;
    return 301 https://$server_name:8443$request_uri;
}
```

## Recommended Approach

**Use Option 1** - Let your existing web server handle SSL and proxying.

Steps:
1. Generate SSL certificate for wp.vjgp.online using certbot on your existing server
2. Create .htpasswd file for password protection
3. Configure virtual host in your existing web server
4. Run only the Node.js app container: `docker-compose -f docker-compose-app-only.yml up -d`

This approach:
- ✓ Integrates cleanly with existing infrastructure
- ✓ Uses standard ports (80/443)
- ✓ Doesn't conflict with other sites
- ✓ Easier SSL management
- ✓ Better performance

## SSL Certificate for Existing Server

If using your existing web server, get SSL certificate:

```bash
# For Apache/Nginx on the host
sudo certbot --nginx -d wp.vjgp.online
# or
sudo certbot --apache -d wp.vjgp.online
```

## Password Protection Setup

Generate .htpasswd file:

```bash
# Install htpasswd if needed
sudo apt-get install apache2-utils

# Create password file
htpasswd -c /root/.gemini/antigravity/scratch/wp-automation/nginx/.htpasswd wpuser

# Add more users (without -c flag)
htpasswd /root/.gemini/antigravity/scratch/wp-automation/nginx/.htpasswd anotheruser
```
