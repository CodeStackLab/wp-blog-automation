# WordPress Automation System

AI-powered WordPress article publishing automation system with ChatGPT integration.

## Features

- 🤖 **AI Article Generation** - Generate high-quality articles using ChatGPT
- 📝 **WordPress Integration** - Direct publishing to your WordPress site via REST API
- 🔒 **Password Protected** - Dual-layer security (HTTP Basic Auth + Application Login)
- 🔐 **SSL Enabled** - HTTPS with Let's Encrypt or self-signed certificates
- 🐳 **Docker-based** - Easy deployment with Docker Compose
- ⚙️ **Automation Settings** - Configure automatic publishing schedules
- 📊 **Dashboard** - Monitor published articles and statistics

## Prerequisites

- Docker and Docker Compose installed
- Domain name pointing to your server (wp.vjgp.online)
- WordPress site with REST API enabled
- OpenAI API key

## Quick Start

### 1. Clone or Download

```bash
cd /root/.gemini/antigravity/scratch/wp-automation
```

### 2. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check Docker installation
- Configure password protection
- Set up admin credentials
- Generate/obtain SSL certificates
- Build and start all services

### 3. Access the Application

Visit `https://wp.vjgp.online` in your browser.

**First Layer - HTTP Basic Auth:**
- Username: (set during setup)
- Password: (set during setup)

**Second Layer - Application Login:**
- Username: (set during setup)
- Password: (set during setup)

### 4. Configure Settings

1. Go to **Settings** page
2. Configure **WordPress**:
   - Site URL: Your WordPress site URL
   - Username: WordPress username
   - Application Password: Generate in WordPress (Users → Profile → Application Passwords)
3. Configure **OpenAI**:
   - API Key: Your OpenAI API key from https://platform.openai.com/api-keys
4. Save settings and test connection

### 5. Generate Your First Article

1. Click **Generate Article** on the dashboard
2. Enter topic, keywords, tone, and length
3. Review the generated article
4. Publish to WordPress

## Configuration

### Environment Variables

Edit `app/.env`:

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_random_secret_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
DOMAIN=wp.vjgp.online
```

### WordPress Application Password

To generate an Application Password in WordPress:

1. Login to WordPress admin
2. Go to **Users → Profile**
3. Scroll to **Application Passwords**
4. Enter a name (e.g., "Automation App")
5. Click **Add New Application Password**
6. Copy the generated password (you won't see it again!)

### Nginx Configuration

The system uses Nginx as a reverse proxy with:
- SSL/TLS encryption
- HTTP Basic Authentication
- Security headers
- Gzip compression

Configuration files:
- `nginx/nginx.conf` - Main configuration
- `nginx/conf.d/wp-automation.conf` - Virtual host configuration
- `nginx/.htpasswd` - HTTP Basic Auth credentials

## Docker Services

The system consists of three Docker services:

1. **wp-automation-app** - Node.js application (port 3000)
2. **nginx** - Reverse proxy with SSL (ports 80, 443)
3. **certbot** - SSL certificate management

## Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f wp-automation-app
docker-compose logs -f nginx
```

### Stop Services

```bash
docker-compose down
```

### Start Services

```bash
docker-compose up -d
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild After Changes

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Update SSL Certificate

```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

## Security Features

### 1. HTTP Basic Authentication
- First layer of protection
- Configured via Nginx
- Credentials in `nginx/.htpasswd`

### 2. Application Login
- Second layer of protection
- Session-based authentication
- Credentials in `app/.env`

### 3. SSL/TLS Encryption
- HTTPS only (HTTP redirects to HTTPS)
- Let's Encrypt or self-signed certificates
- Modern TLS protocols (1.2, 1.3)

### 4. Security Headers
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Login submission
- `GET /logout` - Logout

### Dashboard
- `GET /` - Dashboard (requires auth)
- `GET /settings` - Settings page (requires auth)

### API
- `POST /api/settings` - Save settings
- `POST /api/test-wordpress` - Test WordPress connection
- `POST /api/generate-article` - Generate article with AI
- `POST /api/publish-article` - Publish article to WordPress
- `GET /api/articles` - Get published articles
- `POST /api/automation/toggle` - Toggle automation
- `POST /api/automation/settings` - Update automation settings

## Troubleshooting

### Cannot access the site

1. Check if services are running:
   ```bash
   docker-compose ps
   ```

2. Check logs:
   ```bash
   docker-compose logs -f
   ```

3. Verify domain DNS points to your server

### SSL Certificate Issues

1. For Let's Encrypt, ensure port 80 is accessible
2. Check certbot logs:
   ```bash
   docker-compose logs certbot
   ```

3. Manually renew:
   ```bash
   docker-compose run --rm certbot renew --force-renewal
   ```

### WordPress Connection Failed

1. Verify WordPress REST API is enabled
2. Check WordPress credentials
3. Ensure Application Password is correct
4. Test API manually:
   ```bash
   curl -u username:app_password https://yoursite.com/wp-json/wp/v2/users/me
   ```

### OpenAI API Errors

1. Verify API key is correct
2. Check OpenAI account has credits
3. Ensure API key has proper permissions

## File Structure

```
wp-automation/
├── app/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── dashboard.js
│   │       └── settings.js
│   ├── views/
│   │   ├── partials/
│   │   │   └── header.ejs
│   │   ├── dashboard.ejs
│   │   ├── login.ejs
│   │   └── settings.ejs
│   ├── .env
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── nginx/
│   ├── conf.d/
│   │   └── wp-automation.conf
│   ├── .htpasswd
│   └── nginx.conf
├── certbot/
│   ├── conf/
│   └── www/
├── docker-compose.yml
├── setup.sh
└── README.md
```

## Customization

### Change Admin Credentials

Edit `app/.env`:
```env
ADMIN_USERNAME=newusername
ADMIN_PASSWORD=newpassword
```

Restart:
```bash
docker-compose restart wp-automation-app
```

### Change HTTP Basic Auth

```bash
htpasswd -c nginx/.htpasswd newusername
docker-compose restart nginx
```

### Modify Styling

Edit `app/public/css/style.css` and rebuild:
```bash
docker-compose restart wp-automation-app
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify all credentials are correct
3. Ensure all prerequisites are met
4. Check firewall settings (ports 80, 443)

## License

MIT License - Feel free to modify and use as needed.



---

## Support & Hiring

**Hire our team for setup, please message me:**
* [Fiverr](https://www.fiverr.com/s/EgGm8pq)
* [Upwork](https://www.upwork.com/freelancers/~01b7bb1733953e942f)

**Support & Donations:**
* **PayPal:** [https://paypal.me/khan1899?locale.x=en_GB&country.x=IN](https://paypal.me/khan1899?locale.x=en_GB&country.x=IN)
* **Binance ID:** `538454480`
* **Litecoin (LTC) Address:** `LaJGvzQJGmqfCFkP9cY1kjLp6hphECxWS2` (Network: LTC / Litecoin)
* **Name for Verification:** Mohd Akeel
* **Username:** Mohdakeel1899
