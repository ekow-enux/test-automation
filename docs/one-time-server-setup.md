# One-Time Server Setup Commands

This document contains the required one-time setup commands you should run on your EC2 instance to enable the rsync-free deployment solution.

## Prerequisites

- Ubuntu/Debian-based EC2 instance
- SSH access to the instance
- Sudo privileges

## Server Setup Commands

Run these commands **once** on your EC2 instance:

### 1. Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Required System Packages
```bash
# Install Node.js 20 (LTS), npm, and other required tools
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx unzip curl

# Verify installations
node --version
npm --version
nginx -v
unzip -v
curl --version
```

### 3. Create Deployment Directory
```bash
# Create the deployment directory with proper permissions
sudo mkdir -p /var/www/api
sudo chown $USER:$USER /var/www/api
sudo chmod 755 /var/www/api

# Verify directory creation
ls -la /var/www/
```

### 4. Setup PM2 Startup (Optional but Recommended)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on system reboot
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
# Run the outputted command as instructed
```

### 5. Configure Nginx (If Using Reverse Proxy)
```bash
# Create nginx configuration for your API
sudo tee /etc/nginx/sites-available/api <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP
    
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location / {
        return 200 'API Server is running';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. Configure Firewall (If Active)
```bash
# Allow SSH, HTTP, and HTTPS traffic
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

### 7. Setup Log Rotation for PM2
```bash
# Setup log rotation for PM2 logs
pm2 install pm2-logrotate

# Configure log rotation (optional - these are good defaults)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 8. Create Initial Deployment Structure
```bash
# Create subdirectories for deployment
cd /var/www/api
mkdir -p current previous logs

# Set proper permissions
chmod 755 current previous logs
```

### 9. Generate SSH Key for GitHub Actions (If Not Already Done)
```bash
# Generate SSH key pair (if you haven't already)
ssh-keygen -t ed25519 -C "github-actions@your-server"

# Add public key to your GitHub repository's deploy keys
# (You'll need to copy the public key content)
cat ~/.ssh/id_ed25519.pub

# Set proper permissions on SSH keys
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Configure SSH to not prompt for host key verification (for automation)
echo -e "Host github.com\n    StrictHostKeyChecking no\n    UserKnownHostsFile=/dev/null" >> ~/.ssh/config
chmod 600 ~/.ssh/config
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. **`SSH_KEY`**: Your private SSH key (content of `~/.ssh/id_ed25519`)
2. **`SSH_USER`**: Your SSH username on the EC2 instance
3. **`SSH_HOST`**: Your EC2 instance IP address or domain
4. **`SERVER_PATH`**: `/var/www/api` (or your preferred path)
5. **`ENV_NODE_ENV`**: `production`
6. **`ENV_PORT`**: `4000` (or your preferred port)

## Verification Commands

Run these to verify your setup:

```bash
# Check Node.js and npm
node --version  # Should show v20.x.x
npm --version   # Should show 9.x.x or higher

# Check PM2
pm2 --version

# Check nginx
sudo systemctl status nginx

# Check directory structure
ls -la /var/www/api

# Check if deployment directory is writable
touch /var/www/api/test.txt && rm /var/www/api/test.txt
```

## Troubleshooting

### If PM2 startup fails:
```bash
# Manually run the startup command
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Or disable and re-enable
pm2 unstartup
pm2 startup
```

### If nginx fails to start:
```bash
# Check nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### If deployment directory has permission issues:
```bash
# Fix permissions
sudo chown -R $USER:$USER /var/www/api
sudo chmod -R 755 /var/www/api
```

## Next Steps

After completing these setup commands:

1. The deploy.sh script will be automatically deployed with each release
2. GitHub Actions will handle the SCP transfer and script execution
3. PM2 will manage the application lifecycle
4. Nginx will serve as the reverse proxy (if configured)

Your server is now ready for automated, rsync-free deployments!