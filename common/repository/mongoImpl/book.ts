import { FilterQuery, Types, ClientSession } from 'mongoose';
import { pageX } from '../../utils.js'

import { bookModel } from "../../mongoModel/book.js"
import { Book } from "../../entity/book.js"
import { BookRepo } from "../interface/book.js"

export function newBookRepo(): BookRepo {
    return new BookRepoMongoImpl()
}

class BookRepoMongoImpl implements BookRepo {
    
    constructor() {}

    static generateFilters(bookName:string, tags:string[], priceLowerbound:number, priceUpperbound:number): FilterQuery<Book> {
        let filter: FilterQuery<Book> = {};
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
        let filter = BookRepoMongoImpl.generateFilters(bookName, tags, priceLowerbound, priceUpperbound) 
        let bookCount = await bookModel.countDocuments(filter)
        return bookCount
    }
    
    async getbookData(bookName:string, tags:string[], 
        priceLowerbound:number, priceUpperbound:number, pageSize:number, page:number, bookCount:number): Promise<Book[]>{
        let pageConfig = new pageX(pageSize, bookCount)
        let skipNumber = pageConfig.getSkip(page)
        let filter = BookRepoMongoImpl.generateFilters(bookName, tags, priceLowerbound, priceUpperbound) 
        let result = await bookModel.find(filter).skip(skipNumber).limit(pageSize)
        return result.map((user) => ({...user,id: user._id.toString()}))
    }
    
    async getBookById(bookId:string): Promise<Book|null> {
        try {
            return await bookModel.findOne({_id:new Types.ObjectId(bookId)})
        } catch {
            return null
        }
    }
    
    async takeBooks(bookId:string, bookNumber:number, session:ClientSession):Promise<boolean> {
        let r = await bookModel.findOneAndUpdate(
            {_id:new Types.ObjectId(bookId) , remainNumber:{$gte:bookNumber}}, 
            { $inc:{remainNumber:-1*bookNumber} }, 
            { new:true, session: session}
        )
        return !(r == null)
    }
    
}