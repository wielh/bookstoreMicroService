
import { loginRecordDocument, loginRecordSchema } from "../model/loginRecord.js"
import { UserRepo } from "./user.js"
import { GlobalConfig } from "../init.js"
import { model, Model } from 'mongoose';

export interface loginRecordRepo {
    Insert(userID:string, loginTime:number, status:boolean): Promise<loginRecordDocument>
    CheckSucciveFailed(userID:string, loginTime:number): Promise<boolean>
}

export function newLoginRecordRepo(userRepo: UserRepo): loginRecordRepo {
    return new loginRecordRepoImpl(userRepo)
}

class loginRecordRepoImpl implements loginRecordRepo {

    loginRecordModel: Model<loginRecordDocument>
    userRepo: UserRepo

    constructor(userRepo: UserRepo) {
        this.loginRecordModel = model<loginRecordDocument>('loginRecord', loginRecordSchema,'loginRecord')
        this.userRepo = userRepo
    }

    async Insert(userID:string, loginTime:number, status:boolean): Promise<loginRecordDocument> {
        let result = await this.loginRecordModel.create({userID:userID, loginTime:loginTime, status:status})
        if(status) {
            return result
        }

        let failed = await this.CheckSucciveFailed(userID, loginTime)
        if (failed) {
            await this.userRepo.userSuspense(userID, "Login failed too many times", loginTime + GlobalConfig.API.loginFailed.untilsMS)
        }
        return result
    }

    async CheckSucciveFailed(userID:string, loginTime:number): Promise<boolean> {
        let aMonthAgo = loginTime - GlobalConfig.API.loginFailed.pastMS
        let results = await this.loginRecordModel.find({userID:userID, loginTime:{$gte: aMonthAgo, $lte: loginTime}}).sort({loginTime:-1}).limit(3)
        if(results.length < GlobalConfig.API.loginFailed.attemptTimes){
            return false
        }
        return !(results[0].status || results[1].status || results[2].status)
    }
}