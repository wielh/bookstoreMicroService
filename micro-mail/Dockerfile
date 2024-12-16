FROM bookstore-base-image:v1

COPY micro-mail /home/app/micro-mail

SHELL ["/bin/bash", "-c"]
WORKDIR /home/app/micro-mail
RUN tsc
CMD node main.js 1