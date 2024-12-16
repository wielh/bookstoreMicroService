import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml'
import { fileURLToPath } from 'url';
import {createLogger, Logger, transports, format} from 'winston'
import mongoose from 'mongoose'
import {google}  from "googleapis";
import {OAuth2Client} from 'google-auth-library';
import {Client} from '@elastic/elasticsearch';

interface URL {
  localIP: string,
  dockerIP: string,
  dockerComposeIP : string
  port: number
}

interface Config {
  API: {
    tokenKey: string
    tokenExpireSecond: number
    emailExpireSecond: number
    env: string
    rateLimit:{
      intervalMS: number
      limitSingalIP: number
      limitAll: number
    }
    loginFailed:{
      attemptTimes : number
      pastMS: number
      untilsMS: number
    }
  }
  googleOauth2: {
    googleVerifyID: string
    googlePassword: string
  }
  elastic: URL,
  rabbitMQ: {
    username:string
    password:string
    url: URL
    channelName: {
      email:string
    }
  }
  mongo: {
    username:string
    password:string
    url: URL
    dbName: string
    directConnection: boolean
    serverSelectionTimeoutMS: number
    authSource: string
    replicaSet: string
  }
  gate: {
    localIP:string,
    port: number
  }
  microAccount: URL
  microBook: URL
  microTransection: URL
  microMail: {
    url: URL,
    sendMailport: number
    websiteEmail: string
    sendMailPassword: string
  }
}

export enum accountType {
  normal = 0,
  google = 1
}

var mode: number
export var GlobalConfig : Config

export var gateURL: string
export var googleCallbackUrl: string
export var oauth2Client:OAuth2Client
export var googleVerificationUrl: string
export var elasticClient: Client
export var log: Logger

export var rabbitMQConenctionStr: string
export var accountServiceURL: string
export var transectionServiceURL: string
export var bookServiceURL:string

function loadConfig() {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const fullPath = path.join(currentDir, "config.yaml")
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    GlobalConfig = parse(
      fileContent, 
      {
        customTags:[
          {
            tag:"!env",
            resolve:(doc:string, _tagName:any, _context:any) => {
              const pattern = /\${(.*?)}/g;
              return doc.replace(pattern, (d, envKey) => {
                const envValue = process.env[envKey.trim()];
                if (envValue === undefined) {
                  return '';
                }
                return envValue;
              });
            }
          }
        ]
      }
    ) as Config;
  } catch (error) {
    throw new Error(`Failed to load YAML file: ${error.message}`);
  }
}

function getIPMode() {
  const args: string[] = process.argv;
  try {
    let type = parseInt(args[2])
    switch(type) {
      case 1:
        mode = 1
        break
      case 2:
        mode = 2
        break
      default:
        mode = 0 
        break
    }
  } catch (error) {
    mode = 0 
    return
  }
}

function getUrl(url:URL):string {
  switch(mode){
    case 1:
      return `${url.dockerIP}:${url.port}`
    case 2:
      return `${url.dockerComposeIP}:${url.port}`
    default:
      return `${url.localIP}:${url.port}`
  }
}

async function urlInit() {
  const gc = GlobalConfig
  gateURL = `${gc.gate.localIP}:${gc.gate.port}`
  googleCallbackUrl =  `http://${gateURL}/account/google_callback`
  oauth2Client = new google.auth.OAuth2( gc.googleOauth2.googleVerifyID, gc.googleOauth2.googlePassword, googleCallbackUrl)
  googleVerificationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ["email","profile"],
    include_granted_scopes: true
  });

  let mongoStr = `mongodb://${gc.mongo.username}:${gc.mongo.password}@${getUrl(gc.mongo.url)}/${gc.mongo.dbName}?replicaSet=${gc.mongo.replicaSet}&directConnection=${gc.mongo.directConnection}&serverSelectionTimeoutMS=${gc.mongo.serverSelectionTimeoutMS}&authSource=${gc.mongo.authSource}`

  if(GlobalConfig.API.env !== "unitTest") {
    await mongoose.connect(mongoStr);
  }

  if(GlobalConfig.API.env !== "unitTest") {
    elasticClient = new Client({node: `http://${getUrl(gc.elastic)}`, maxRetries:3});
  }

  let level = "debug"
  if (GlobalConfig.API.env === "production") {
    level = "info"
  }
  log = createLogger({
    level: level,
    format: format.json(),
    transports: [new transports.Console()],
  });

  rabbitMQConenctionStr = `amqp://${gc.rabbitMQ.username}:${gc.rabbitMQ.password}@${getUrl(gc.rabbitMQ.url)}/`;
  accountServiceURL = getUrl(GlobalConfig.microAccount)
  transectionServiceURL = getUrl(GlobalConfig.microTransection)
  bookServiceURL = getUrl(GlobalConfig.microBook)
}

async function start() {
  const start = Date.now();
  loadConfig()
  getIPMode()
  await urlInit()
  // console.log("googleVerificationUrl:", googleVerificationUrl)
  const end = Date.now();
  console.log("API初始化共耗費:", end - start, "ms")
}

await start()

