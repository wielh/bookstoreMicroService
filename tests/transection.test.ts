import { expect } from 'chai';
import { describe, it } from 'mocha'

import { TransectionRequest, BookInfo } from '../proto/transection.js'
import { ActivityRepo } from "../common/repository/activity.js"
import { ActivityDocument, newActivityDocument } from '../common/model/activity.js';
import { BookRepo } from "../common/repository/book.js"
import { BookDocument, newBookDocument } from '../common/model/book.js';
import { ClientSession } from 'mongoose';
import { newPriceCalculator } from '../micro-transection/priceCalculate.js'

class ActivityRepoMock implements ActivityRepo {

    activityMap = new Map<string,ActivityDocument>()
    constructor () {
        let now = new Date().getTime()
    
        let activity1 = newActivityDocument(1, now - 60*60*1000, now + 60*60*1000)
        activity1.levelType1 = [{price:100, discount:0.9}, {price:500, discount:0.8}, {price:1000, discount:0.6}]
        this.activityMap.set("a1", activity1)

        let activity2 = newActivityDocument(2, now - 60*60*1000, now + 60*60*1000)
        activity2.levelType2 = [{price:100, discount:10}, {price:500, discount:100}, {price:1000, discount:400}]
        this.activityMap.set("a2", activity2)

        let activity3 = newActivityDocument(3, now - 60*60*1000, now + 60*60*1000)
        activity3.levelType3 = [{by:5, give:2, bookIds:["1", "2"]}]
        this.activityMap.set("a3", activity3)
    }

    findActivities(timeStamp: number): Promise<ActivityDocument[]> {
        let answer:ActivityDocument[] = []
        for(let v of this.activityMap) {
            if (v[1].startDate <= timeStamp && v[1].endDate >= timeStamp) {
                answer.push(v[1])
            }
        }
        return Promise.resolve(answer);
    }
    
    findActivityType1ById(Id: string, timeStamp: number): Promise<ActivityDocument|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.type === 1 && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }

    findActivityType2ById(Id: string, timeStamp: number): Promise<ActivityDocument|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.type === 2 && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }

    findActivityType3ById(Id: string, timeStamp: number): Promise<ActivityDocument|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.type === 3 && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }

    findActivityById(Id: string, timeStamp: number): Promise<ActivityDocument|null> {
        let doc = this.activityMap.get(Id)
        if (doc && doc.startDate <= timeStamp && doc.endDate >= timeStamp) {
            return Promise.resolve(doc)
        }
        return Promise.resolve(null)
    }
}

class bookRepoMock implements BookRepo {
    bookMap = new Map<string,BookDocument>()
    constructor () {
        this.bookMap.set("1", newBookDocument("java", 100, ["program"]))
        this.bookMap.set("2", newBookDocument("python", 123, ["program"]))
        this.bookMap.set("3", newBookDocument("calculus", 200, ["math"]))
        this.bookMap.set("4", newBookDocument("harry potter", 320, ["english"]))
    }
    count(_bookName: string, _tags: string[], _priceLowerbound: number, _priceUpperbound: number): Promise<number> {
        throw new Error('Method not implemented.');
    }
    getbookData(_bookName: string, _tags: string[], _priceLowerbound: number, _priceUpperbound: number, _pageSize: number, _page: number, _bookCount: number): Promise<BookDocument[]> {
        throw new Error('Method not implemented.');
    }
    getBookById(bookId: string): Promise<BookDocument|null> {
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