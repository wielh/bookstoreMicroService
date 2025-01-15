import { ClientSession, Types } from 'mongoose';
import { accountType } from '../../init.js'
import { comparePassword, passwordHash} from '../../utils.js'
import { userModel, normalUserModel, GoolgeUserModel, Suspensed } from '../../mongoModel/user.js'
import { UserRepo, NormalUserRepo, GoogleUserRepo} from '../interface/user.js'

export function newUserRepo(): UserRepo {
    return new UserRepoMongoImpl()
}

class UserRepoMongoImpl implements UserRepo {
    
    constructor() {
    }

    async userExistByID(Id:string): Promise<boolean> {
        let doc = await userModel.findById(Id)
        return !(doc === null)
    }
    
    async transection(userId:string, gold:number, session: ClientSession): Promise<boolean> {
        if(!Types.ObjectId.isValid(userId)) {
            return false
        }
        let r = await userModel.updateOne({_id: new Types.ObjectId(userId), balance:{$gte:gold}}, {$inc: { balance: -1*gold }}, {session:session})
        return r.modifiedCount > 0
    }
    
    async userSuspense(userId: string, reason: string, unlockTime: number): Promise<boolean> {
        let doc = await userModel.findById(userId)
        if (!doc) {
            return false
        }
    
        let suspensedArray: Suspensed[] = (doc.suspensed && Array.isArray(doc.suspensed)) ? doc.suspensed:[]
        for(let a of suspensedArray) {
            if(a.reason && a.reason === reason) {
                return false
            }
        }
        suspensedArray.push({reason:reason, unlockTime:unlockTime})
        doc = await userModel.findByIdAndUpdate(userId, {$set:{suspensed: suspensedArray}})
        return true
    }
    
    async userIsSuspensed(userId: string): Promise<number> {
        let doc = await userModel.findById(userId)
        if (!doc) {
            return -1
        }
    
        if (!(doc.suspensed) || !Array.isArray(doc.suspensed)) {
            return -1
        }
    
        let suspensedTime = -1
        for(let a of doc.suspensed) {
            if(a.unlockTime > suspensedTime) { 
                suspensedTime = a.unlockTime   
            }
        }
        return suspensedTime
    }
    
}

export function newNormalUserRepo(): NormalUserRepo {
    return new normalUserRepoMongoImpl()
}

class normalUserRepoMongoImpl implements NormalUserRepo {

    constructor() {
    }

    async normalUserExist(username:string): Promise<string> {
        let doc = await normalUserModel.findOne({username:username, accountType:accountType.normal})
        if (!doc || !doc._id) {
            return ""
        }
        return doc._id.toString()
    }
    
    async normalUserExistWithPWD(username:string, password:string): Promise<string> {
        let doc = await normalUserModel.findOne({username:username, accountType:accountType.normal})
        if( !doc ) {
            return ""
        }
    
        const exist = await comparePassword(password, doc.password.toString())
        if (!exist) {
            return ""
        }
    
        return doc._id.toString()
    }
    
    async insertNormalUser(username:string, password:string, email:string, name:string): Promise<string> {
        return await normalUserModel.create({
            username:username, password: 
            await passwordHash(password), 
            email: email, name:name, 
            accountType:accountType.normal, 
            balance:0, 
            emailVerified: 0 
        }).then(
            (doc) => doc._id.toString()
        )
    }
    
    async resetPassword(username:string, password:string, newPassword:string): Promise<boolean> {
        let exist = await this.normalUserExistWithPWD(username, password)
        if (!exist) {
            return false
        }
    
        const newHashedPassword = await passwordHash(newPassword)
        const r = await normalUserModel.updateOne({username:username}, {$set:{password: newHashedPassword}})
        return r.modifiedCount>0
    }
    
    async normalEmailCheckAndChange(username:string, email:string): Promise<boolean> {
        let doc = await normalUserModel.findOneAndUpdate({username:username, accountType:accountType.normal, emailVerified: 0},{$set:{email:email}})
        return !(doc==null)
    }
    
    async normalEmailVerify(userId: string): Promise<boolean> {
        let doc = await normalUserModel.findOneAndUpdate({id: new Types.ObjectId(userId), emailVerified: 0},{$set:{emailVerified:1}})
        return !(doc==null)
    }
    
}

export function newGoogleUserRepo(): GoogleUserRepo {
    return new googleUserRepoMongoImpl()
}

class googleUserRepoMongoImpl implements GoogleUserRepo {

    constructor() {}

    async googleUserExist(googleID:string): Promise<string> {
        let doc = await GoolgeUserModel.findOne({googleID:googleID, accountType:accountType.google})
        if (!doc) {
            return ""
        }
        return doc._id.toString()
    }
    
    async insertGoogleUser(googleID:string, googleName:string, email:string): Promise<string> {
        return await GoolgeUserModel.create({
            googleID: googleID, name:googleName , email:email,  accountType:accountType.google, balance:0, emailVerified:1}).
                then((doc) => doc._id.toString())
    }
}