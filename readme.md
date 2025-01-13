# Bookstore API 介紹

## 這是一個怎麼樣的程式
  使用 typescript 與 node.js 做的範例 API, 有以下的功能 :
 * 支援 google 登入
 * 使用 nodemailer， 寄信給使用者
 * 使用 JWT 保存登入訊息
 * 使用微服務將不同功能分離, 彼此之間用 grpc 通信
 * 使用 elastic 紀錄 90 日以內的 log
 * 使用 express-rate-limit 做流量限制

## 使用到的相關技術
  typescript, node.js, express, grpc, mongodb, mongoose, docker, rabbitMQ, elastic
  
## 如何在本地啟動

+ 安裝 node.js, mongodb, 然後執行 

```
node mongo-setting/mongo-script.js 
```

設定 mongodb

+ 為了啟用 transection，需要設定 mongodb 的 replica-set

+ 安裝 protobuf-compiler, protoc-gen-ts 後編譯 proto 檔案

 ```
  protoc -I="." --ts_out="."  ./proto/*.proto
```

+ 到 gate 以及 micro-XXX 資料夾底下使用指令 tsc 編譯

+ config.yaml 的 env 可以有三種值: unitTest, debug 與 production

+ 編譯完後執行指令 node app.js 啟動該微服務

## 部署注意事項
 * 主要的微服務可以在本地執行，也可以用 docker 執行
 * 如果用 docker-compose.yaml 進行部署的話，記得要去 services => {micro-service} => extra_hosts 將 "host.docker.abc:..." 改成本機電腦的 ip
 * mongodb 是在 windows 上的本地執行, 範例數據可從 mongo-script.js 匯入，而
 mongodb replica set 設定在 primary.cfg, secondary.cfg 與 arbiter.cfg， 詳細設定
方法在 [ReplicaSet 設定](https://aspnetmars.blogspot.com/2019/04/windows-mongodb-replica-set-sharding.html).
 * 要啟用 googleLogin 功能，記得要去更改 googleVerifyID 與 googleVerifyPassword，
 關於申請 googleVerifyID 方法，參見 [GoogleAPI申請](https://blog.hungwin.com.tw/aspnet-google-login/)
 * 要使用 grpc 在微服務之間通信，需要安裝  protobuf-compiler, protoc-gen-ts，安裝完成後使用以下指令編譯 proto 檔案

 ```
  protoc -I="." --ts_out="."  ./proto/*.proto
```

 * elastic 是紀錄與搜尋 log 的引擎程式，而 kibana 是 elastic 的可視化程式。搜尋 log 的功能主要是在左上角 "discover" 欄位。
   詳細請參見[kibana教學](https://medium.com/%E7%A8%8B%E5%BC%8F%E4%B9%BE%E8%B2%A8/elk-%E6%95%99%E5%AD%B8%E8%88%87%E4%BB%8B%E7%B4%B9-c54af6f06e61)

## 使用docker部屬微服務:

+ 首先請確認在本地安裝好 mongodb, elastic與 rabbitmq，並確保他們允許外部(docker network gateway)請求

+ 建造 dockerfile 基底
```
sudo docker build --no-cache -t bookstore-base-image:v1 -f common/Dockerfile --build-arg BOOKSTORE_TOKEN_KEY=${...} --build-arg BOOKSTORE_API_GOOGLEOAUTH2_PASSWORD=${...} --build-arg BOOKSTORE_RABBITMQ_PASSWORD=${...} --build-arg BOOKSTORE_MONGO_PASSWORD=${...} --build-arg BOOKSTORE_SENDMAIL_PASSWORD=${...} .
```

+ 根據基底建造 image
```
sudo docker build --no-cache -t bookstore-gate:v1 -f gate/Dockerfile .
sudo docker build --no-cache -t bookstore-micro-account:v1 -f micro-account/Dockerfile .
sudo docker build --no-cache -t bookstore-micro-book:v1 -f micro-book/Dockerfile .
sudo docker build --no-cache -t bookstore-micro-transection:v1 -f micro-transection/Dockerfile .
sudo docker build --no-cache -t bookstore-micro-mail:v1 -f micro-mail/Dockerfile .
```

+ 建造 network
```
sudo docker network create --driver bridge --subnet 172.22.0.0/16 --gateway 172.22.0.1 bookstore_network 
```

+ 建造 container 
```
sudo docker create -it --name gate-container --network bookstore_network -p 3000:3000 --add-host host.docker.internal:host-gateway bookstore-gate:v1
sudo docker create -it --name micro-account-container --network bookstore_network -p 9501:9501 --add-host host.docker.internal:host-gateway bookstore-micro-account:v1
sudo docker create -it --name micro-book-container --network bookstore_network -p 9502:9502 --add-host host.docker.internal:host-gateway bookstore-micro-book:v1
sudo docker create -it --name micro-transection-container --network bookstore_network -p 9503:9503 --add-host host.docker.internal:host-gateway bookstore-micro-transection:v1
sudo docker create -it --name micro-mail-container --network bookstore_network -p 9504:9504 --add-host host.docker.internal:host-gateway bookstore-micro-mail:v1
```

## TODO

+ 尚未驗證 docker-compose.yaml 是否可執行

+ AOP 改進