FROM bookstore-base-image:v1

COPY micro-book /home/app/micro-book

SHELL ["/bin/bash", "-c"]
WORKDIR /home/app/micro-book
RUN tsc
CMD node main.js 1