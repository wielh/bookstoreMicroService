import { Schema, Document, model} from 'mongoose';

export class loginRecordDocument extends Document {
    userID: string
    loginTime: number
    status: boolean
}

export const loginRecordSchema = new Schema({
    userID: {type:String, require: true},
},{
    versionKey: false, 
    strict: false
});

export const loginRecordModel = model<loginRecordDocument>('loginRecord', loginRecordSchema,'loginRecord')
