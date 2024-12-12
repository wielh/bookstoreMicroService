import { Schema, Document, model} from 'mongoose';

export class BookDocument extends Document {
    bookName: string
    price: number
    remainNumber: number
    tags: string[]
}

export const bookSchema = new Schema({
    bookId: {type:String, require: true},
    bookName: {type:String},
},{
    versionKey: false, 
    strict: false
});

export const bookModel = model<BookDocument>('book', bookSchema, 'book')

export function newBookDocument(name:string, price:number, tags:string[]): BookDocument {
    return new bookModel({bookName:name, price: price, tags: tags})
}



