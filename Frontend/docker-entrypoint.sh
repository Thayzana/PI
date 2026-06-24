#!/bin/sh
set -eu

API_UPSTREAM="${API_UPSTREAM:-http://gestify-backend:3000}"
export API_UPSTREAM

envsubst '${API_UPSTREAM}' < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
