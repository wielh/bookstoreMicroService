import { activityModel } from "../mongoModel/activity.js"
import { Activity } from "../entity/activity.js"
import { Types } from 'mongoose';

export interface ActivityRepo {
    findActivities(timeStamp:number): Promise<Activity[]>
    findActivityType1ById(Id: string, timeStamp:number):Promise<Activity|null>
    findActivityType2ById(Id: string, timeStamp:number):Promise<Activity|null>
    findActivityType3ById(Id: string, timeStamp:number):Promise<Activity|null>
    findActivityById(id:string, timeStamp:number):Promise<Activity|null>
}

export function newActivityRepo():ActivityRepo {
    return new ActivityRepoMongoImpl()
}

class ActivityRepoMongoImpl implements ActivityRepo {

    constructor() {}

    async findActivities(timeStamp:number):Promise<Activity[]> {
        const docs = await activityModel.find(
            {startDate:{$lt:timeStamp}, endDate:{$gt:timeStamp}}
        ).limit(1000)
        return docs.map((user) => ({...user,id: user._id.toString()}))
    }
    
    async findActivityType1ById(Id: string, timeStamp:number):Promise<Activity|null>{
        const doc = await activityModel.findOne({ _id: new Types.ObjectId(Id), type:1, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
        if (doc == null) {
            return null
        }
        return {...doc, id: doc._id.toString()}
    }
    
    async findActivityType2ById(Id: string, timeStamp:number):Promise<Activity|null>{
        const doc = await activityModel.findOne({ _id: new Types.ObjectId(Id), type:2, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
        if (doc == null) {
            return null
        }
        return {...doc, id: doc._id.toString()}
    }
    
    async findActivityType3ById(Id: string, timeStamp:number):Promise<Activity|null>{
        const doc = await activityModel.findOne({ _id: new Types.ObjectId(Id), type:3, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
        if (doc == null) {
            return null
        }
        return {...doc, id: doc._id.toString()}
    }
    
    async findActivityById(id:string, activityType:number):Promise<Activity|null> {
        const doc = await activityModel.findOne({ _id: new Types.ObjectId(id), type:activityType})
        if (doc == null) {
            return null
        }
        return {...doc, id: doc._id.toString()}
    }
}

