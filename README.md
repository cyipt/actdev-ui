# ACTDEV 

Active travel provision and potential in planned and proposed development sites.

To make changes amend /js/actdev.js.


# Installation

This assumes you're running this on Apache.

{{{
# Enter your webserver's files area
cd /var/www/

# Clone the repo
sudo git clone https://github.com/cyipt/actdev-ui
cd actdev-ui

# Clone the library within the repo
cd js/lib/
sudo git clone https://github.com/cyclestreets/Mapboxgljs.LayerViewer
cd -

# Add an Apache configuration
sudo cp -pr .apache-vhost.conf.template /etc/apache/sites-available/actdev.conf
sudo a2ensite actdev
sudo service apache2 restart

# Add local host
sudo sh -c "echo '127.0.0.1 actdev' >> /etc/hosts"

# Open your web browser at http://actdev/
}}}


## License

GPL3.
