
import { Book } from "../../entity/book.js"

export interface BookRepo {
    count(bookName:string, tags:string[], priceLowerbound:number, priceUpperbound:number):Promise<number>
    getbookData(bookName:string, tags:string[],  priceLowerbound:number, priceUpperbound:number, pageSize:number, page:number, bookCount:number): Promise<Book[]>
    getBookById(bookId:string): Promise<Book|null>
    takeBooks(bookId:string, bookNumber:number, session:any):Promise<boolean>
}
