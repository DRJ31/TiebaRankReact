#!/bin/sh

tar xvf build.tar.xz
rm -rf /data/nginx/www/rank
mv build /data/nginx/www/rank
rm -f build.tar.xz
