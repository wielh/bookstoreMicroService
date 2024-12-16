FROM ubuntu:20.04

# step1 複製檔案
COPY common /home/app/common
COPY proto /home/app/proto
COPY package.json /home/app/package.json

# step2: 設定 ubuntu 環境
SHELL ["/bin/bash", "-c"]
ENV BOOKSTORE_TOKEN_KEY=${BOOKSTORE_TOKEN_KEY}
ENV BOOKSTORE_API_GOOGLEOAUTH2_PASSWORD=${BOOKSTORE_API_GOOGLEOAUTH2_PASSWORD}
ENV BOOKSTORE_RABBITMQ_PASSWORD=${BOOKSTORE_RABBITMQ_PASSWORD}
ENV BOOKSTORE_MONGO_PASSWORD=${BOOKSTORE_MONGO_PASSWORD}
ENV BOOKSTORE_SENDMAIL_PASSWORD=${BOOKSTORE_SENDMAIL_PASSWORD}

RUN apt update
RUN apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install  build-essential nodejs protobuf-compiler -y
WORKDIR /home/app
RUN npm install typescript -g
RUN npm install protoc-gen-ts -g
RUN npm install
RUN protoc -I="." --ts_out="."  proto/*.proto
