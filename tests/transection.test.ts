import { expect } from 'chai';
import { describe, it } from 'mocha'

import { TransectionRequest, BookInfo } from '../proto/transection.js'
import { ActivityRepo } from "../common/repository/activity.js"
import { Activity } from '../common/entity/activity.js';
import { BookRepo } from "../common/repository/book.js"
import { Book } from '../common/entity/book.js';
import { ClientSession } from 'mongoose';
import { newPriceCalculator } from '../micro-transection/priceCalculate.js'

class ActivityRepoMock implements ActivityRepo {

    activityMap = new Map<string,Activity>()
    constructor () {
        let now = new Date().getTime()
    
        let activity1 = {
            id:"a1", type:1, startDate:now - 60*60*1000, endDate:now + 60*60*1000, 
            levelType1: [{price:100, discount:0.9}, {price:500, discount:0.8}, {price:1000, discount:0.6}],
            levelType2: null,
            levelType3: null,
        }
        this.activityMap.set("a1", activity1)

        let activity2 = {
            id:"a2", type:2, startDate:now - 60*60*1000, endDate:now + 60*60*1000, 
            levelType1: null,
            levelType2: [{price:100, discount:10}, {price:500, discount:100}, {price:1000, discount:400}],
            levelType3: null,
        }
        this.activityMap.set("a2", activity2)

        let activity3 = {
            id:"a3", type:3, startDate:now - 60*60*1000, endDate:now + 60*60*1000, 
            levelType1: null,
            levelType2: null,
            levelType3: [{by:5, give:2, bookIds:["1", "2"]}],
        }
        this.activityMap.set("a3", activity3)
    }

    findActivities(timeStamp: number): Promise<Activity[]> {
        let answer:Activity[] = []
        for(let v of this.activityMap) {
            if (v[1].startDate <= timeStamp && v[1].endDate >= timeStamp) {
                answer.push(v[1])
            }
        }
        return Promise.resolve(answer);
    }
    
    findActivityType1ById(Id: string, timeStamp: number): Promise<Activity|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.type === 1 && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }

    findActivityType2ById(Id: string, timeStamp: number): Promise<Activity|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.type === 2 && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }

    findActivityType3ById(Id: string, timeStamp: number): Promise<Activity|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.type === 3 && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }

    findActivityById(Id: string, timeStamp: number): Promise<Activity|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }
}

class bookRepoMock implements BookRepo {
    bookMap = new Map<string,Book>()
    constructor () {
        this.bookMap.set("1", {id:"1", bookName:"java", price:100, remainNumber:10000, tags:["program"]})
        this.bookMap.set("2", {id:"2", bookName:"python", price:123, remainNumber:10000, tags:["program"]})
        this.bookMap.set("3", {id:"3", bookName:"calculus", price:200, remainNumber:10000, tags:["math"]})
        this.bookMap.set("4", {id:"4", bookName:"harry potter", price:320, remainNumber:10000, tags:["english"]})
    }
    count(_bookName: string, _tags: string[], _priceLowerbound: number, _priceUpperbound: number): Promise<number> {
        throw new Error('Method not implemented.');
    }
    getbookData(_bookName: string, _tags: string[], _priceLowerbound: number, _priceUpperbound: number, _pageSize: number, _page: number, _bookCount: number): Promise<Book[]> {
        throw new Error('Method not implemented.');
    }
    getBookById(bookId: string): Promise<Book|null> {
        let book = this.bookMap.get(bookId)??null
        return Promise.resolve(book)
    }
    takeBooks(_bookId: string, _bookNumber: number, _session: ClientSession): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}

class Data {
    input: {
        activityID: string,
        activityType: number
        bookInfo:{
            bookId: string,
            number: number
        }[]
    }
    expectedOutput: {
        isNull: boolean
        totalPrice: number
    }

    constructor ( 
        activityID: string, 
        activityType: number, 
        bookInfo: { bookId: string; number: number }[], 
        isNull: boolean = false, 
        totalPrice: number = 0) { 
        this.input = { activityID, activityType, bookInfo, }; 
        this.expectedOutput = { isNull, totalPrice }; 
    }

    toTransectionRequest(): TransectionRequest {
        let answer: TransectionRequest = new TransectionRequest();
        answer.userId = ""
        answer.activityID = this.input.activityID
        answer.activityType = this.input.activityType
        answer.bookInfo = []
        for (let a of this.input.bookInfo) {
            let b = new BookInfo()
            b.bookId = a.bookId
            b.bookNumber = a.number
            answer.bookInfo.push(b)
        }
        return answer
    }
}

const priceCalculator = newPriceCalculator(new ActivityRepoMock(), new bookRepoMock())
const dataMap: Map<string, Data> = new Map()

function dataInit() { 
   dataMap.set("no activity and no books", new Data("", 0, [], false, 0))
   dataMap.set("no activity", new Data("", 0, [{bookId:"1", number:10}, {bookId:"2", number:10}], false, 2230))
   dataMap.set("repeat book id", new Data("", 0, [{bookId:"1", number:10}, {bookId:"1", number:10}], true, 0))
   dataMap.set("some nonexist book id", new Data("", 0, [{bookId:"3", number:20}, {bookId:"2", number:10}, {bookId:"-1", number:10} ], false, 5230))

   dataMap.set("invaild activity1", new Data("a0", 1, [{bookId:"3", number:20}, {bookId:"2", number:10}], true, 0))
   dataMap.set("activity1", new Data("a1", 1, [{bookId:"3", number:20}, {bookId:"2", number:10}], false, 3138))
   dataMap.set("activity2", new Data("a2", 2, [{bookId:"4", number:5}, {bookId:"1", number:10}], false, 2200))
   dataMap.set("activity3", new Data("a3", 3, [ {bookId:"1", number:10}, {bookId:"2", number:8},], false, 1338))
}

dataInit()
describe('priceCalculate', function() {
    for(let data of dataMap) {
        it(`case: ${data[0]}`, async function() { 
            let answer = await priceCalculator.calculatePrice(data[1].toTransectionRequest())
            let answerNullCheck = ((answer === null) == data[1].expectedOutput.isNull)
            expect(answerNullCheck).equals(true)
            if (!answer) {
                return
            }

            expect(answer.errCode).to.not.be.null     
            expect(answer.totalPrice).to.not.be.null       
            expect(answer.totalPrice).equal(data[1].expectedOutput.totalPrice)   
        });
    }
});