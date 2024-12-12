import { ActivityDocument, activitySchema, activityModel } from "../model/activity.js"
import { Types, model, Model } from 'mongoose';

export interface ActivityRepo {
    findActivities(timeStamp:number): Promise<ActivityDocument[]>
    findActivityType1ById(Id: string, timeStamp:number):Promise<ActivityDocument|null>
    findActivityType2ById(Id: string, timeStamp:number):Promise<ActivityDocument|null>
    findActivityType3ById(Id: string, timeStamp:number):Promise<ActivityDocument|null>
    findActivityById(id:string, timeStamp:number):Promise<ActivityDocument|null>
}

export function newActivityRepo():ActivityRepo {
    return new ActivityRepoImpl()
}

class ActivityRepoImpl implements ActivityRepo {

    constructor() {}

    async findActivities(timeStamp:number):Promise<ActivityDocument[]> {
        const result = await activityModel.find(
            {
                startDate:{$lt:timeStamp}, 
                endDate:{$gt:timeStamp}
            }
        ).limit(1000)
        return result
    }
    
    async findActivityType1ById(Id: string, timeStamp:number):Promise<ActivityDocument|null>{
        const result = await activityModel.findOne({ _id: new Types.ObjectId(Id), type:1, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
        return result
    }
    
    async findActivityType2ById(Id: string, timeStamp:number):Promise<ActivityDocument|null>{
        return await activityModel.findOne({ _id: new Types.ObjectId(Id), type:2, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
    }
    
    async findActivityType3ById(Id: string, timeStamp:number):Promise<ActivityDocument|null>{
        return await activityModel.findOne({ _id: new Types.ObjectId(Id), type:3, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
    }
    
    async findActivityById(id:string, activityType:number):Promise<ActivityDocument|null> {
        return await activityModel.findOne({ _id: new Types.ObjectId(id), type:activityType})
    }
}