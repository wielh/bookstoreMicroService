FROM bookstore-base-image:v1

COPY micro-account /home/app/micro-account

SHELL ["/bin/bash", "-c"]
WORKDIR /home/app/micro-account
RUN tsc
CMD node main.js 1

