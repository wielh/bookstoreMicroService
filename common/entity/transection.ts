export interface transectionLog {
    id: string
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

export interface IncomeMonthly {
    id: string
    timeStamp: number
    balance: number
}

