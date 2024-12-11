import { model, FilterQuery, Types, ClientSession, Model } from 'mongoose';
import { pageX } from '../utils.js'

import { BookDocument, bookSchema } from "../model/book.js"

export interface bookRepo {
    count(bookName:string, tags:string[], priceLowerbound:number, priceUpperbound:number):Promise<number>
    getbookData(bookName:string, tags:string[], 
        priceLowerbound:number, priceUpperbound:number, pageSize:number, page:number, bookCount:number): Promise<BookDocument[]>
    getBookById(bookId:string): Promise<BookDocument>
    takeBooks(bookId:string, bookNumber:number, session:ClientSession):Promise<boolean>
}

export function newBookRepo(): bookRepo {
    return new bookRepoImpl()
}

class bookRepoImpl implements bookRepo {
    
    bookModel: Model<BookDocument>
    constructor() {
        this.bookModel = model<BookDocument>('book', bookSchema, 'book')
    }

    static generateFilters(bookName:string, tags:string[], priceLowerbound:number, priceUpperbound:number): FilterQuery<BookDocument> {
        let filter: FilterQuery<BookDocument> = {};
        if (bookName != "") {
            filter.bookName = { $regex: `/^${bookName}/` }
        } 
    
        if (tags.length > 0) {
            filter.tags = { $in: tags }
        }
    
        if (priceLowerbound > 0) {
            filter.price = { $gt: priceLowerbound}
        }
    
        if (priceUpperbound > 0) {
            filter.price = { $lt: priceUpperbound}
        }
        return filter
    }
    
    async count(bookName:string, tags:string[], priceLowerbound:number, priceUpperbound:number): Promise<number>{
        let filter:FilterQuery<BookDocument> = bookRepoImpl.generateFilters(bookName, tags, priceLowerbound, priceUpperbound) 
        let bookCount = await this.bookModel.countDocuments(filter)
        return bookCount
    }
    
    async getbookData(bookName:string, tags:string[], 
        priceLowerbound:number, priceUpperbound:number, pageSize:number, page:number, bookCount:number): Promise<BookDocument[]>{
        let pageConfig = new pageX(pageSize, bookCount)
        let skipNumber = pageConfig.getSkip(page)
        let filter = bookRepoImpl.generateFilters(bookName, tags, priceLowerbound, priceUpperbound) 
        let result = await this.bookModel.find(filter).skip(skipNumber).limit(pageSize)
        return result
    }
    
    async getBookById(bookId:string): Promise<BookDocument> {
        try {
            return await this.bookModel.findOne({_id:new Types.ObjectId(bookId)})
        } catch {
            return null
        }
    }
    
    async takeBooks(bookId:string, bookNumber:number, session:ClientSession):Promise<boolean> {
        let r = await this.bookModel.findOneAndUpdate(
            {_id:new Types.ObjectId(bookId) , remainNumber:{$gte:bookNumber}}, 
            { $inc:{remainNumber:-1*bookNumber} }, 
            { new:true, session: session}
        )
        return !(r == null)
    }
    
}