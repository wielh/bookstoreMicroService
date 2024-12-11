import { ActivityDocument, activitySchema } from "../model/activity.js"
import { Types, model, Model } from 'mongoose';

export interface ActivityRepo {
    findActivities(timeStamp:number): Promise<ActivityDocument[]>
    findActivityType1ById(Id: string, timeStamp:number):Promise<ActivityDocument>
    findActivityType2ById(Id: string, timeStamp:number):Promise<ActivityDocument>
    findActivityType3ById(Id: string, timeStamp:number):Promise<ActivityDocument>
    findActivityById(id:string, activityType:number):Promise<ActivityDocument>
}

export function newActivityRepo():ActivityRepo {
    return new ActivityRepoImpl()
}

class ActivityRepoImpl implements ActivityRepo {

    activityModel : Model<ActivityDocument>
    constructor() {
        this.activityModel = model<ActivityDocument>('activity', activitySchema, 'activity')
    }

    async findActivities(timeStamp:number):Promise<ActivityDocument[]> {
        const result = await this.activityModel.find(
            {
                startDate:{$lt:timeStamp}, 
                endDate:{$gt:timeStamp}
            }
        ).limit(1000)
        return result
    }
    
    async findActivityType1ById(Id: string, timeStamp:number):Promise<ActivityDocument>{
        const result = await this.activityModel.findOne({ _id: new Types.ObjectId(Id), type:1, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
        return result
    }
    
    async findActivityType2ById(Id: string, timeStamp:number):Promise<ActivityDocument>{
        return await this.activityModel.findOne({ _id: new Types.ObjectId(Id), type:2, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
    }
    
    async findActivityType3ById(Id: string, timeStamp:number):Promise<ActivityDocument>{
        return await this.activityModel.findOne({ _id: new Types.ObjectId(Id), type:3, startDate:{$lt: timeStamp}, endDate:{$gt: timeStamp}})
    }
    
    async findActivityById(id:string, activityType:number):Promise<ActivityDocument> {
        return await this.activityModel.findOne({ _id: new Types.ObjectId(id), type:activityType})
    }
}