

import { Schema, Document, model, ClientSession, Types} from 'mongoose';
import { accountType } from '../init.js'
import { comparePassword, passwordHash} from '../utils.js'

class UserDocument extends Document {
    name : string
    email : string
    balance : number
}

class NormalUserDocument extends UserDocument {
    accountType: Number
    username: String
    password : String
    emailVerified : Number
}

class GoogleUserDocument extends UserDocument {
    accountType: number
    googleID: string
}

const UserSchema = new Schema({},{
    versionKey: false, 
    strict: false
});

const NormalUserSchema = new Schema({
    accountType: {type:Number, default:accountType.normal},
    username: {type:String, require: true},
    password : {type:String, require: true},
    emailVerified : {type:Number, default:0}
},{
    versionKey: false, 
    strict: false
});


const GoogleUserSchema = new Schema({
    accountType: {type:Number, default: accountType.google},
    googleID: {type:String, require: true},
},{
    versionKey: false, 
    strict: false
});

const UserModel = model<UserDocument>('User', UserSchema, "user")

const NormalUserModel = model<NormalUserDocument>('NormalUser', NormalUserSchema, "user")

const GoolgeUserModel = model<GoogleUserDocument>('GoolgeUser', GoogleUserSchema, "user")

export async function normalUserExist(username:string): Promise<string> {
    let doc = await NormalUserModel.findOne({username:username, accountType:accountType.normal})
    if (!doc || !doc._id) {
        return ""
    }
    return doc._id.toString()
}

export async function normalUserExistWithPWD(username:string, password:string): Promise<string> {
    let doc = await NormalUserModel.findOne({username:username, accountType:accountType.normal})
    if( !doc ) {
        return ""
    }

    const exist = await comparePassword(password, doc.password.toString())
    if (!exist) {
        return ""
    }
    return doc._id.toString()
}

export async function insertNormalUser(username:string, password:string, email:string, name:string): Promise<string> {
    return await NormalUserModel.create({
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

export async function resetPassword(username:string, password:string, newPassword:string): Promise<boolean> {
    let exist = await normalUserExistWithPWD(username, password)
    if (!exist) {
        return false
    }

    const newHashedPassword = await passwordHash(newPassword)
    const r = await NormalUserModel.updateOne({username:username}, {$set:{password: newHashedPassword}})
    return r.modifiedCount>0
}

export async function normalEmailCheckAndChange(username:string, email:string): Promise<boolean> {
    let doc = await NormalUserModel.findOneAndUpdate({username:username, accountType:accountType.normal, emailVerified: 0},{$set:{email:email}})
    return !(doc==null)
}

export async function normalEmailVerify(userId: string): Promise<boolean> {
    let doc = await NormalUserModel.findOneAndUpdate({id: new Types.ObjectId(userId), emailVerified: 0},{$set:{emailVerified:1}})
    return !(doc==null)
}

export async function googleUserExist(googleID:string): Promise<string> {
    let doc = await GoolgeUserModel.findOne({googleID:googleID, accountType:accountType.google})
    if (!doc) {
        return ""
    }
    return doc._id.toString()
}

export async function insertGoogleUser(googleID:string, googleName:string, email:string): Promise<string> {
    return await GoolgeUserModel.create({
        googleID: googleID, name:googleName , email:email,  accountType:accountType.google, balance:0, emailVerified:1}).then(
            (doc) => doc._id.toString()
        )
}

export async function userExistByID(Id:string): Promise<boolean> {
    let doc = await UserModel.findById(Id)
    return !(doc==null)
}

export async function transection(userId:string, gold:number, session: ClientSession): Promise<boolean> {
    let r = await UserModel.updateOne({_id: new Types.ObjectId(userId), balance:{$gte:gold}}, {$inc: { balance: -1*gold }}, {session:session})
    return r.modifiedCount > 0
}