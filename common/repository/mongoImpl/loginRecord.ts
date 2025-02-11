import { GlobalConfig } from "../../init.js"

import { loginRecord } from "../../entity/loginRecord"
import { loginRecordModel } from "../../mongoModel/loginRecord.js"
import { UserRepo } from "../interface/user.js"
import { LoginRecordRepo } from "../interface/loginRecord.js"

export function newLoginRecordRepo(userRepo: UserRepo): LoginRecordRepo {
    return new LoginRecordRepoMongoImpl(userRepo)
}

class LoginRecordRepoMongoImpl implements LoginRecordRepo {

    userRepo: UserRepo
    constructor(userRepo: UserRepo) {
        this.userRepo = userRepo
    }

    async Insert(userID:string, loginTime:number, status:boolean): Promise<loginRecord> {
        let doc = await loginRecordModel.create({userID:userID, loginTime:loginTime, status:status})
        if(status) {
            return {...doc, id: doc._id.toString()}
        }

        let failed = await this.CheckSucciveFailed(userID, loginTime)
        if (failed) {
            await this.userRepo.userSuspense(userID, "Login failed too many times", loginTime + GlobalConfig.API.loginFailed.untilsMS)
        }
        return  {...doc, id: doc._id.toString()}
    }

    async CheckSucciveFailed(userID:string, loginTime:number): Promise<boolean> {
        let aMonthAgo = loginTime - GlobalConfig.API.loginFailed.pastMS
        let results = await loginRecordModel.find({userID:userID, loginTime:{$gte: aMonthAgo, $lte: loginTime}}).sort({loginTime:-1}).limit(3)
        if(results.length < GlobalConfig.API.loginFailed.attemptTimes){
            return false
        }
        return !(results[0].status || results[1].status || results[2].status)
    }
}