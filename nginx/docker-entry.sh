#!/usr/bin/env sh
mkdir -p /usr/share/nginx/html/assets
if [ "$BOX" = "true" ]; then
	sed -i.bak -r "s/base href=\"(.*)\"/base  href=\"\/$PREFIX\1\"/" /usr/share/nginx/html/index.html
	sed -i.bak -r "s/base href=\"(.*)\"/base  href=\"\/$PREFIX\1\"/" /usr/share/nginx/html/en/index.html
	sed -i.bak -r "s/base href=\"(.*)\"/base  href=\"\/$PREFIX\1\"/" /usr/share/nginx/html/es/index.html
	sed -i.bak -r "s/base href=\"(.*)\"/base  href=\"\/$PREFIX\1\"/" /usr/share/nginx/html/ja/index.html
	sed -i.bak -r "s/base href=\"(.*)\"/base  href=\"\/$PREFIX\1\"/" /usr/share/nginx/html/ar/index.html
	sed -i.bak -r "s/base href=\"(.*)\"/base  href=\"\/$PREFIX\1\"/" /usr/share/nginx/html/te/index.html
	envsubst '$PREFIX $NGINX_HOST $NGINX_PORT' <box.conf >/etc/nginx/nginx.conf
	envsubst '$EVENTS $CALIBRATION $LOGINLOGO $MENULOGO $TITLE $EXPERIMENTAL $MENUBACKGROUND $MENUCOLOR' <vars.json.template >/usr/share/nginx/html/assets/vars.json
else
	envsubst '$NGINX_HOST $NGINX_PORT' <default.conf >/etc/nginx/nginx.conf
	envsubst '$EVENTS $CALIBRATION $LOGINLOGO $MENULOGO $TITLE $EXPERIMENTAL $MENUBACKGROUND $MENUCOLOR' <vars.json.template >/usr/share/nginx/html/assets/vars.json
fi

nginx -g "daemon off;"
