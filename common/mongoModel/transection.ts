import { Schema, Document, model } from 'mongoose';

export class transectionLogDocument extends Document {
    userId : string
    activityID : string
    activityType : number
    time: number
    price : number
    totalPrice: number
    bookInfo : {
        bookId : string
        bookNumber : number
        price : number
    }[]
}

export const transectionLogSchema = new Schema({
    userId: {type:String, required:true} ,
    activityID: {type:String, default:""},
},{
    versionKey: false, 
    strict: false
});

export class IncomeMonthlyDocument extends Document {
    timeStamp: number
    balance: number
}

export const IncomeMonthlySchema = new Schema({
    balance: Number
},{
    versionKey: false, 
    strict: false
});

export const transectionLogModel = model<transectionLogDocument>('transection_log', transectionLogSchema,'transection_log')
export const IncomeMonthlyModel = model<IncomeMonthlyDocument>('income_monthly', IncomeMonthlySchema,'income_monthly')

