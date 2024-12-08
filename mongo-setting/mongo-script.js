import { MongoClient } from "mongodb"
const db_name = "bookstore"
const db_user = "bookstore_user"
const role_name = "myrole"
const mongo_db_str =`mongodb://127.0.0.1:27017`   // or other mongodb user with all privileges (root)
const mongo_db_client = new MongoClient(mongo_db_str, { monitorCommands: true ,maxPoolSize:10});

const DB = mongo_db_client.db(db_name)
try {
  await DB.createCollection("user")
  await DB.createCollection("activity")
  await DB.createCollection("book")
  await DB.createCollection("income_monthly")
  await DB.createCollection("transection_log")
} catch(error) {
  console.log(error)
}

try {
  await DB.collection("user").insertMany([
      {
        accountType: 0,
        username: 'user001',
        password: '$2b$10$D2S.DMXtL3r6NHtexO7dAu4O0XOGGrH.OSFRjmneRjuwMIQuHsymi',
        emailVerified: 0,
        email: 'wielh.erlow@gmail.com',
        name: 'user001',
        balance: 0
      }
  ])
  await DB.collection("user").createIndex({username:1},{unique:true,partialFilterExpression :{ username: { $type: "string"  }}})
  await DB.collection("user").createIndex({googleID:1},{unique:true,partialFilterExpression :{ googleID: { $type: "string" }}})
  await DB.collection("book").insertMany([
      {
          "price": 150,
          "remainNumber": 18,
          "tags": ["電腦","科普"],
          "bookName": "設計模式"
      },{
          "price": 100,
          "remainNumber": 60,
          "tags": ["電腦","科普"],
          "bookName": "Java教學"
      },{
          "price": 200,
          "remainNumber": 62,
          "tags": ["電腦","數學","英文版"],
          "bookName": "leetcode"
      },{
          "price": 123,
          "remainNumber": 43,
          "tags": ["數學"],
          "bookName": "微積分"
      }, {
          "price": 80,
          "remainNumber": 70,
          "tags": ["數學","科普"],
          "bookName": "數學好好玩"
      }, {
          "price": 123,
          "remainNumber": 64,
          "tags": [
            "娛樂"
          ],
          "bookName": "圍棋"
      }
  ])
  await DB.collection("book").createIndex({bookName:1},{unique:true})
  await DB.collection("book").createIndex({tags:1})
  await DB.collection("book").createIndex({price:1})

  await DB.collection("activity").createIndex({startDate:1})
  await DB.collection("activity").createIndex({endDate:1})

  await DB.collection("transection_log").createIndex({username:1,time:-1})
  await DB.collection("transection_log").createIndex({time:-1})
} catch(error) {
  console.log(error)
}

try {
  await DB.command({createUser: db_user, pwd: "test", roles: []})
  await DB.command({
    createRole: role_name,
    privileges:[
        {
            resource: { db: db_name, collection: "user" },
            actions: [ "insert", "find", "update"]
        },{
            resource: { db: db_name, collection: "activity" },
            actions: [ "find" ]
        },{
            resource: { db: db_name, collection: "book" },
            actions: [ "find" ]
        },{
            resource: { db: db_name, collection: "income_monthly" },
            actions: [ "insert", "find", "update" ]
        },{
            resource: { db: db_name, collection: "transection_log" },
            actions: [ "insert", "find" ]
        }
    ],
    roles: []
  })

  await DB.command({
    grantRolesToUser:db_user,
    roles:[role_name]
  })
} catch(error) {
  console.log(error)
}

await mongo_db_client.close()


