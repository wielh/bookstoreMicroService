import { newActivityRepo } from "./activity.js"
import { newBookRepo } from "./book.js"
import { newLoginRecordRepo } from  "./loginRecord.js"
import { newTransectionLogRepo, newBalanceRepo } from  "./transection.js"
import { newNormalUserRepo, newUserRepo, newGoogleUserRepo} from  "./user.js"

export const activityRepo = newActivityRepo()
export const bookRepo = newBookRepo()
export const transectionLogRepo = newTransectionLogRepo()
export const balanceRepo = newBalanceRepo()
export const normalUserRepo = newNormalUserRepo()
export const userRepo = newUserRepo()
export const googleUserRepo = newGoogleUserRepo()
export const LoginRecordRepo = newLoginRecordRepo(userRepo)