import {ActivityRequest,ActivityReponse, ActivityReponseData} from '../proto/transection.js'
import * as grpc from "@grpc/grpc-js";
import { errorLogger} from '../common/utils.js'
import { errMongo, errSuccess} from '../common/errCode.js'
import { activityRepo } from '../common/repository/init.js'

// 1. 打折
// 2. 買5送1
// 3. 滿2000送200

export async function activityList(call: grpc.ServerUnaryCall<ActivityRequest,ActivityReponse>, callback: grpc.sendUnaryData<ActivityReponse>) {
    let req = call.request
    let res = new ActivityReponse()
    let now = new Date().getTime()

    try {
        let activitys = await activityRepo.findActivities(now)
        for (let activity of activitys) {

            let activityRes = new ActivityReponseData()
            activityRes.activityID = activity.id
            activityRes.activityType = activity.type
            activityRes.startDate = Number(activity.startDate.toString())
            activityRes.endDate = Number(activity.endDate.toString())
            switch(activity.type){
                case 1:
                    activityRes.activityInfo = JSON.stringify(activity.levelType1)
                    break;
                case 2:
                    activityRes.activityInfo = JSON.stringify(activity.levelType2)
                    break;
                case 3:
                    activityRes.activityInfo = JSON.stringify(activity.levelType3)
                    break;
                default:
                    activityRes.activityInfo = ""
            }
            res.data.push(activityRes)
        }
    } catch (error) {
        errorLogger("", "mongoErr happens while searching activity", req,error)
        res.errCode = errMongo
        callback(error,res)
    }

    res.errCode = errSuccess
    callback(null,res)
}
