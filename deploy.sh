#!/bin/sh

tar xvf dist.tar.xz
rm -rf /data/nginx/www/rank
mv dist /data/nginx/www/rank
rm -f dist.tar.xz
