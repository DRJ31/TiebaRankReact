#!/bin/sh

tar xvf build.tar.xz
echo $PASSWORD | sudo -S rm -rf /var/www/rank
sudo mv build /var/www/rank
sudo chown -R www-data:www-data /var/www/rank
