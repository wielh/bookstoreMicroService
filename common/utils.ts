
import jwt from 'jsonwebtoken';

import { GlobalConfig, elasticClient, log as logger, rabbitMQConenctionStr} from '../common/init.js'
import { connect, Connection } from 'amqplib'
import { hash, genSalt, compare } from "bcrypt"

export async function passwordHash(password:string):Promise<string> {
    const salt = await genSalt(10);
    return await hash(password, salt);
};

export async function comparePassword(plainTextPassword:string, hashedPassword:string): Promise<boolean> {
    try {
       return await compare(plainTextPassword, hashedPassword);
    } catch (error) {
       return false;
    }
}

export function getCurrentDatetime():string{
    var m = new Date();
    var dateString =
        m.getUTCFullYear() + "/" +
        ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
        ("0" + m.getUTCDate()).slice(-2) + " " +
        ("0" + m.getUTCHours()).slice(-2) + ":" +
        ("0" + m.getUTCMinutes()).slice(-2) + ":" +
        ("0" + m.getUTCSeconds()).slice(-2);
    return dateString;
}

export function castToString(value: any): string {
    if (typeof value === 'string') {
        return value
    }
    return ""
}

export function castToStringArray(values: any): string[] {
    if (!values || !Array.isArray(values)) {
        return []
    }

    const valueArray = values as any[]
    for(let element of valueArray) {
        if(!(typeof element === 'string')){
            return []
        }
    }
    return valueArray
}

class UserTokenVal {
    username: string;
    accountType: number;
    email?: string;

    constructor(j: jwt.JwtPayload){
        this.username = j.username;
        this.accountType = parseInt(j.accountType,10);
        this.email = (j.email || "" )
    }
}

export function decodeToken(token:string):UserTokenVal {
    try {
        const val = jwt.verify(token, GlobalConfig.API.tokenKey) as jwt.JwtPayload; 
        if (val && typeof val.username === 'string' && typeof val.accountType === 'number') {
            return new UserTokenVal(val);
        } else {
        return null
        }
    } catch(e){
        return null;
    }
}

export function createToken(user: UserTokenVal, second:number):string{
    return jwt.sign(user, GlobalConfig.API.tokenKey, { expiresIn: second});
}

export class pageX {
    pageSize: number
    count: number
    totalPageNumber: number

    public constructor(pageSize:number, count:number){
        this.pageSize =  pageSize>2 ? pageSize:10
        this.count = count>0? count:0
        this.totalPageNumber = Math.floor(this.count/this.pageSize) + ((this.count%this.pageSize>0)?1:0)
    }

    public getPageSize():number {
        return this.pageSize
    }

    public getCount():number {
        return this.count
    }

    public getTotalPageNumber():number {
        return this.totalPageNumber
    }

    public getPageNumber(pageNumber:number):number {
        if(pageNumber < 0){
            return 0
        } else if (pageNumber >= this.totalPageNumber) {
            return this.totalPageNumber-1
        } 
        return Math.floor(pageNumber)
    }

    public getSkip(currentPage:number):number{
        if (currentPage <= 0 || this.totalPageNumber<=0 ) {
            return 0
        } else if ( currentPage >= this.totalPageNumber) {
            return (this.totalPageNumber -1 )* this.pageSize
        }

        return currentPage * this.pageSize
    }
}

export function getCurrentMonthFirstDayTimestamp(currentDateTime:number): number {
    const currentDate = new Date(currentDateTime);
    const MonthlyFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0);
    return MonthlyFirstDay.getTime();
}

//============================================================================================================

var rabbitMQConnection: Connection 

export function getRabbitMQConnection() {
    return rabbitMQConnection
}

export async function rabbitMQconnect() {
    try {
        rabbitMQConnection = await connect(rabbitMQConenctionStr);
    } catch(err) {
        console.error('Error connecting to rabbitMQ with host:', err);
    }
}

export async function sendMailProducer(rabbitMQConnection:Connection, emailAddress:string, subject:string , message:string): Promise<boolean>{
    try {
        const channel = await rabbitMQConnection.createChannel();
        await channel.assertQueue(GlobalConfig.rabbitMQ.channelName.email, { durable: true });
        const rabbitMQMessage = JSON.stringify({emailAddress:emailAddress, subject:subject ,message:message})
        channel.sendToQueue(GlobalConfig.rabbitMQ.channelName.email, Buffer.from(rabbitMQMessage))
        await channel.close();
    } catch (error) {
        errorLogger("", "sendmail to rabbitMQ failed", [emailAddress, subject, message], error)
        return false;
    }
    return true
}

//============================================================================================================

function toString(data:any): string {
    try {
        return JSON.stringify(data);
    } catch (e) {
        return "(cannot convert to string)";
    }
}

function generateMessage(username:string, location: string, message:string, data:any):string {
    if (!Array.isArray(data)) {
        return `[${username}][${location}][${getCurrentDatetime()}]:${message},data=<<<<< ${toString(data)} >>>>>`
    } else {
        let strArray: string[] = []
        for(let a of data) {
            let str = toString(a)
            if (!(str === "")) {
                strArray.push(str)
            } else {
                strArray.push("(cannot convert to string)")
            }
        }
        return `[${username}][${location}][${getCurrentDatetime()}]:${message},data=<<<<< ${strArray.join("::")} >>>>>`
    }
    
}

function getFuncName(): string {
    const stack = new Error().stack;
    if (stack) {
        const errMsgs = stack.split("\n")
        if(errMsgs && errMsgs[3]) {
            return errMsgs[3]
        }
    }
    return ""
}

let elasticIndex = ""

export function setElasticIndex(serviceName:string) {
    elasticIndex = serviceName
}

export function errorLogger(username:string, message:string, data:any, error:Error):void {
    const funcName = getFuncName()
    logger.error(generateMessage(username, funcName , message, data), error)
    elasticClient.index({index:elasticIndex,body: {
        functionName: funcName, 
        message: message,
        level : "error", 
        error: (!error)?"": error.stack,
        datetime: new Date()
    }});
}

export function warnLogger(username:string, message:string, data:any, error:Error):void {
    const funcName = getFuncName()
    logger.warn(generateMessage(username, funcName , message, data), error)
    elasticClient.index({index:elasticIndex,body: {
        functionName: funcName, 
        message: message,
        level : "warn", 
        error: (!error)?"": error.stack,
        datetime: new Date()
    }});
}

export function infoLogger(username:string, message:string, data:any):void {
    const funcName = getFuncName()
    logger.info(generateMessage(username, funcName, message, data))
    elasticClient.index({index:elasticIndex,body: {
        functionName: funcName, 
        message: message,
        level : "Info", 
        error : "",
        datetime: new Date()
    }});
}

export function debugLogger(username:string, message:string, data:any):void {
    const funcName = getFuncName()
    logger.info(generateMessage(username, funcName ,  message, data))
    elasticClient.index({index:elasticIndex,body: {
        functionName: funcName, 
        message: message,
        level : 'debug', 
        error : "",
        datetime: new Date()
    }});
}

// ===================================================================
