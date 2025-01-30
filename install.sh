#!/bin/bash

# Install the ActDev website


# cd /var/www/
# git clone https://github.com/cyipt/actdev-ui

cd /var/www/actdev-ui/

apt-get install -y apache2
cp -pr .apache-vhost.conf.template /etc/apache2/sites-available/actdev.conf
a2ensite actdev
service apache2 restart

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | tee /usr/share/keyrings/yarn.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/yarn.gpg] https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list
apt-get update
apt-get install -y yarn

yarn install

cp -pr .config.js.template .config.js
echo "Please enter your credentials in .config.js"

cp /var/www/actdev-ui/.cron.template /etc/cron.d/actdev
chown root:root /etc/cron.d/actdev
chmod 644 /etc/cron.d/actdev
