import { ClientSession } from 'mongoose';
import { getCurrentMonthFirstDayTimestamp, pageX } from '../../utils.js'
import { transectionLogModel, IncomeMonthlyModel } from '../../mongoModel/transection.js'
import { transectionLog } from '../../entity/transection.js'
import { TransectionLogRepo } from "../interface/transection.js"
import { BalanceRepo } from "../interface/transection.js"

export function newTransectionLogRepo(): TransectionLogRepo {
    return new transectionLogRepoMongoImpl()
}

class transectionLogRepoMongoImpl implements TransectionLogRepo {
    
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
    
    async getLogData(userId:string, p:pageX, page:number): Promise<transectionLog[]> {
        let skipNumber = p.getSkip(page)
        const docs = await transectionLogModel.find({userId:userId}).skip(skipNumber).limit(p.pageSize)
        return docs.map((user) => ({...user,id: user._id.toString()}))
    }
}

export function newBalanceRepo(): BalanceRepo {
    return new balanceRepoMongoImpl()
}

class balanceRepoMongoImpl implements BalanceRepo {
    constructor() {}
    async updateBalance(timeStamp: number, gold: number, session: ClientSession): Promise<boolean> {
        let monthlyTimeStamp = getCurrentMonthFirstDayTimestamp(timeStamp) 
        let r = await IncomeMonthlyModel.updateOne({ timeStamp: monthlyTimeStamp},{ $inc:{ balance: gold }}, {session:session , upsert:true})
        return (r.modifiedCount > 0 || r.upsertedCount > 0)
    }
}

 