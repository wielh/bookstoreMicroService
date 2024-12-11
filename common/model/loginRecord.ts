import { Schema, Document, model} from 'mongoose';

import { userSuspense } from "./user.js"
import { GlobalConfig } from "../init.js"

class loginRecordDocument extends Document {
    userID: string
    loginTime: number
    status: boolean
}

const loginRecordSchema = new Schema({
    userID: {type:String, require: true},
},{
    versionKey: false, 
    strict: false
});

export var loginRecordModel = model<loginRecordDocument>('loginRecord', loginRecordSchema,'loginRecord')

export async function Insert(userID:string, loginTime:number, status:boolean) {
    let result = await loginRecordModel.create({userID:userID, loginTime:loginTime, status:status})
    if(status) {
        return result
    }

    let failed = await CheckSucciveFailed(userID, loginTime)
    if (failed) {
        await userSuspense(userID, "Login failed too many times", loginTime + GlobalConfig.API.loginFailed.untilsMS)
    }
    return result
}

export async function CheckSucciveFailed(userID:string, loginTime:number): Promise<boolean> {
    let aMonthAgo = loginTime - GlobalConfig.API.loginFailed.pastMS
    let results = await loginRecordModel.find({userID:userID, loginTime:{$gte: aMonthAgo, $lte: loginTime}}).sort({loginTime:-1}).limit(3)
    if(results.length < GlobalConfig.API.loginFailed.attemptTimes){
        return false
    }
    return !(results[0].status || results[1].status || results[2].status)
}