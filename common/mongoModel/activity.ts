import { Schema, Document, model } from 'mongoose';

export const activitySchema = new Schema({
    type: {type:Number, default:0},
},{
    versionKey: false, 
    strict: false
});

export class ActivityDocument extends Document {
    type: number
    startDate: number
    endDate: number
    levelType1: LevelType1[]
    levelType2: LevelType2[]
    levelType3: LevelType3[]
}

class LevelType1 {
    price:number
    discount:number
}

class LevelType2 {
    price:number
    discount:number
}

class LevelType3 {
    by: number
    give: number
    bookIds: string[]
}

export const activityModel = model<ActivityDocument>('activity', activitySchema, 'activity')

