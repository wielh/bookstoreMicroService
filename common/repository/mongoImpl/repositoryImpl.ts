import { newActivityRepo } from "./activity.js"
import { newBookRepo } from "./book.js"
import { newLoginRecordRepo } from  "./loginRecord.js"
import { newTransectionLogRepo, newBalanceRepo } from  "./transection.js"
import { newNormalUserRepo, newUserRepo, newGoogleUserRepo} from  "./user.js"

import { Repository } from "../interface/repository.js"
import { ActivityRepo } from "../interface/activity.js"
import { BookRepo } from "../interface/book.js"
import { LoginRecordRepo } from "../interface/loginRecord.js"
import { TransectionLogRepo, BalanceRepo } from "../interface/transection.js"
import { UserRepo, NormalUserRepo, GoogleUserRepo } from "../interface/user.js"

class RepositoryMongoImpl implements Repository {
    activityRepo: ActivityRepo
    bookRepo: BookRepo
    transectionLogRepo: TransectionLogRepo
    balanceRepo: BalanceRepo
    userRepo: UserRepo
    normalUserRepo: NormalUserRepo
    googleUserRepo: GoogleUserRepo
    loginRecordRepo: LoginRecordRepo
    
    constructor(){
        this.activityRepo = newActivityRepo()
        this.bookRepo = newBookRepo()
        this.transectionLogRepo = newTransectionLogRepo()
        this.balanceRepo = newBalanceRepo()
        this.userRepo = newUserRepo()
        this.normalUserRepo = newNormalUserRepo()
        this.googleUserRepo = newGoogleUserRepo()
        this.loginRecordRepo = newLoginRecordRepo(this.userRepo)
    }
}