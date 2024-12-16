FROM bookstore-base-image:v1

COPY micro-transection /home/app/micro-transection

SHELL ["/bin/bash", "-c"]
WORKDIR /home/app/micro-transection
RUN tsc
CMD node main.js 1