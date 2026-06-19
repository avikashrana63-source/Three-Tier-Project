FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html reservation.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY fonts /usr/share/nginx/html/fonts
COPY js /usr/share/nginx/html/js
COPY images /usr/share/nginx/html/images
COPY videos /usr/share/nginx/html/videos

EXPOSE 80
