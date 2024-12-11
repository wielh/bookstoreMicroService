import { Schema, Document } from 'mongoose';

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
   // time: {type:Long, required:true}
},{
    versionKey: false, 
    strict: false
});

export class IncomeMonthlyDocument extends Document {
    timeStamp: number
    balance: number
}

export const IncomeMonthlySchema = new Schema({
    // timeStamp: Long,
    balance: Number
},{
    versionKey: false, 
    strict: false
});



