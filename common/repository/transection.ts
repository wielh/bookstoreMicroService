import { ClientSession } from 'mongoose';
import { getCurrentMonthFirstDayTimestamp, pageX} from '../utils.js'
import { transectionLogDocument, transectionLogModel, IncomeMonthlyModel } from '../model/transection.js'

export interface transectionLogRepo {
    countLog(userId:string): Promise<number> 
    getLogData(userId:string, p:pageX, page:number): Promise<transectionLogDocument[]>
    insertLog(userId: string, activityID: string, activityType:number , time: number, totalPrice:number, 
        bookInfo:{bookId:string ,bookNumber: number, price:number}[], session: ClientSession): Promise<void>
}

export function newTransectionLogRepo(): transectionLogRepo {
    return new transectionLogRepoImpl()
}

class transectionLogRepoImpl implements transectionLogRepo {
    
    constructor() {}

    async insertLog(userId: string, activityID: string, activityType:number , time: number, totalPrice:number, 
        bookInfo:{bookId:string ,bookNumber: number, price:number}[], session: ClientSession): Promise<void> {

        await transectionLogModel.create(
            [{
                userId:userId, 
                activityID:activityID, 
                activityType:activityType, 
                time:time, 
                totalPrice:totalPrice, 
                bookInfo: bookInfo
            }], {
                session:session
            }
        )
    }
    
    async countLog(userId:string): Promise<number> {
        return await transectionLogModel.countDocuments({userId: userId})
    }
    
    async getLogData(userId:string, p:pageX, page:number): Promise<transectionLogDocument[]> {
        let skipNumber = p.getSkip(page)
        return await transectionLogModel.find({userId:userId}).skip(skipNumber).limit(p.pageSize).exec()
    }
}

export interface balanceRepo {
    updateBalance(timeStamp: number, gold:number, session:ClientSession): Promise<boolean>
} 

export function newBalanceRepo(): balanceRepo {
    return new balanceRepoImpl()
}

class balanceRepoImpl implements balanceRepo {

    constructor() {}

    async updateBalance(timeStamp: number, gold: number, session: ClientSession): Promise<boolean> {
        let monthlyTimeStamp = getCurrentMonthFirstDayTimestamp(timeStamp) 
        let r = await IncomeMonthlyModel.updateOne(
            { timeStamp: monthlyTimeStamp},{ $inc:{ balance: gold }}, {session:session , upsert:true})
        return (r.modifiedCount > 0 || r.upsertedCount > 0)
    }
}

 