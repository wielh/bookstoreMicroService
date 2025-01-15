
import { loginRecord } from "../../entity/loginRecord"

export interface LoginRecordRepo {
    Insert(userID:string, loginTime:number, status:boolean): Promise<loginRecord>
    CheckSucciveFailed(userID:string, loginTime:number): Promise<boolean>
}
