import { ActivityRepo } from "./activity.js"
import { BookRepo } from "./book.js"
import { LoginRecordRepo } from  "./loginRecord.js"
import { TransectionLogRepo, BalanceRepo } from  "./transection.js"
import { NormalUserRepo, UserRepo, GoogleUserRepo} from  "./user.js"

export interface Repository {
    activityRepo: ActivityRepo
    bookRepo: BookRepo
    transectionLogRepo: TransectionLogRepo
    balanceRepo: BalanceRepo
    userRepo: UserRepo
    normalUserRepo: NormalUserRepo
    googleUserRepo: GoogleUserRepo
    loginRecordRepo: LoginRecordRepo
}

