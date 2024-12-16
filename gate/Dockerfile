FROM bookstore-base-image:v1

COPY gate /home/app/gate

SHELL ["/bin/bash", "-c"]
WORKDIR /home/app/gate
RUN tsc
CMD node app.js 1