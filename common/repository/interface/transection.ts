import { pageX } from '../../utils.js'
import { transectionLog } from '../../entity/transection.js'

export interface TransectionLogRepo {
    countLog(userId:string): Promise<number> 
    getLogData(userId:string, p:pageX, page:number): Promise<transectionLog[]>
    insertLog(userId: string, 
        activityID: string, 
        activityType:number , 
        time: number,
        totalPrice:number, 
        bookInfo:{bookId:string ,bookNumber: number, price:number}[],
        session:any): Promise<void>
}

export interface BalanceRepo {
    updateBalance(timeStamp: number, gold:number, session:any): Promise<boolean>
} 


 