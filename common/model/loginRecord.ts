import { Schema, Document, ObjectId } from 'mongoose';
import mongooseLong from 'mongoose-long';
import * as mongoose from 'mongoose';

mongooseLong(mongoose)
class LoginRecordDocument extends Document {
    userID: ObjectId
    username: string
    googleID: string
    accountType: number
    loginTime: mongoose.Types.Long
    status: boolean
}

const LoginRecordSchema = new Schema({
    bookId: {type:String, require: true},
    bookName: {type:String},
},{
    versionKey: false, 
    strict: false
});