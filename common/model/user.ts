

import { Schema, Document, model} from 'mongoose';
import { accountType } from '../init.js'

export class Suspensed {
    reason: string
    unlockTime: number
}

export class UserDocument extends Document {
    name: string
    email: string
    balance: number
    suspensed: Suspensed[]
}

export class NormalUserDocument extends UserDocument {
    accountType: Number
    username: String
    password : String
    emailVerified : Number
}

export class GoogleUserDocument extends UserDocument {
    accountType: number
    googleID: string
}

export const userSchema = new Schema({},{
    versionKey: false, 
    strict: false
});

export const normalUserSchema = new Schema({
    accountType: {type:Number, default:accountType.normal},
    username: {type:String, require: true},
    password : {type:String, require: true},
    emailVerified : {type:Number, default:0}
},{
    versionKey: false, 
    strict: false
});

export const googleUserSchema = new Schema({
    accountType: {type:Number, default: accountType.google},
    googleID: {type:String, require: true},
},{
    versionKey: false, 
    strict: false
});




