
import {ServerUnaryCall, sendUnaryData} from "@grpc/grpc-js";
import mongoose from 'mongoose'

import {TransectionRequest, TransectionResponse, TransectionRecordRequest, TransectionRecordResponse, TransectionRecord, ActivityReponseData, BookInfo} from '../proto/transection.js'
import { errMongo, errSuccess, errUserNotExist, errGoldNotEnought, errUpdateIncomeFailed, errBookNotEnought} from '../common/errCode.js'
import { pageX, errorLogger, warnLogger, infoLogger} from '../common/utils.js'
import { calculatePrice, TransectionResult} from './priceCalculate.js'
import * as bookDB from '../common/model/book.js'
import * as userDB from '../common/model/user.js'
import * as transectionDB from '../common/model/transection.js'
import * as activityDB from '../common/model/activity.js'

export async function transection(call: ServerUnaryCall<TransectionRequest,TransectionResponse>, callback: sendUnaryData<TransectionResponse>) {
    let res:TransectionResponse = new TransectionResponse()
    let req = call.request
    let data: any[] = [req.userId, req.activityID, req.activityType, req.bookInfo]

    infoLogger(req.userId, "A new transection request started", data)
    let existed = false
    try {
        existed = await userDB.userExistByID(req.userId)
        if (!existed) {
            res.errCode = errUserNotExist
            callback(null,res)
            return
        }
    } catch (error) {
        errorLogger(req.userId, "A mongoErr happens while searching user", data, error)
        res.errCode = errMongo
        callback(error,res)
        return
    }
    
    // 1. 算錢
    let answer: TransectionResult
    try {
        answer = await calculatePrice(req)
        if (answer == null) {
            warnLogger(req.userId, "Format of request is incorrect", data, null)
            callback(null,res)
            return
        } else if (answer.errCode != errSuccess) {
            callback(null,res)
            return
        }
        answer.toTransectionResponse(res)
    } catch (error) {
        errorLogger(req.userId, "A mongoErr happens while calculating price", data, error)
        res.errCode = errMongo
        callback(error,res)
        return
    }

    // 2. writeDB
    const session = await mongoose.startSession();
    let success = false
    try { 
        session.startTransaction();
        success = await userDB.transection(req.userId, answer.totalPrice, session)
        if (!success) {
            res.errCode = errGoldNotEnought
            warnLogger(req.userId, "Gold not enought", data, null)
            await session.abortTransaction()
            callback(null,res)
            return
        }
        for (let book of req.bookInfo) {
            success = await bookDB.takeBooks(book.bookId, book.bookNumber, session)
            if (!success) {
                res.errCode = errBookNotEnought
                warnLogger(req.userId, "Book not enought", data, null)
                await session.abortTransaction()
                callback(null,res)
                return
            }
        }
        
        await transectionDB.insertLog(req.userId, req.activityID, req.activityType, answer.transectionTime, answer.totalPrice, answer.booksInfo, session) 
        success = await transectionDB.updateBalance(answer.transectionTime, answer.totalPrice, session)
        if (!success) {
            res.errCode = errUpdateIncomeFailed
            errorLogger(req.userId, "Update balance failed", data, null)
            await session.abortTransaction()
            callback(null,res)
            return
        }
        await session.commitTransaction()
    } catch (error) {
        errorLogger(req.userId, "A mongoErr happens while writeing DB", data, error)
        await session.abortTransaction()
        res.errCode = errMongo
        callback(error,res)
        return
    } finally {
        await session.endSession()
    }

    res.errCode = errSuccess
    infoLogger(req.userId, "A new transection request end", data)
    callback(null,res)
}

export async function transectionRecord(call: ServerUnaryCall<TransectionRecordRequest, TransectionRecordResponse>, callback: sendUnaryData<TransectionRecordResponse>) {
    let req = call.request
    let res = new TransectionRecordResponse()
    let data = [req.userId, req.page, req.pageSize]
    let count = 0 
    try {
        count = await transectionDB.countLog(req.userId)
    } catch (error) {
        errorLogger(req.userId, "mongoErr happens while counting transection log", data, error)
        res.errCode = errMongo
        callback(error,res)
    }

    let records: TransectionRecord[] = []
    let record: TransectionRecord
    let p = new pageX(req.pageSize, count)
    try {
        let logs = await transectionDB.getLogData(req.userId, p, req.page)
        for (let log of logs) {
            record = new TransectionRecord()
            record.transectionTime = log.time
            record.appliedActivityData = new ActivityReponseData()      
            try {
                let a = await activityDB.findActivityById(log.activityID, log.activityType)
                switch(a.type) {
                    case 1:
                        record.appliedActivityData.activityInfo = JSON.stringify(a.levelType1) 
                        record.appliedActivityData.activityType = a.type
                        break;
                    case 2:
                        record.appliedActivityData.activityInfo = JSON.stringify(a.levelType2) 
                        record.appliedActivityData.activityType = a.type
                        break;
                    case 3:
                        record.appliedActivityData.activityInfo = JSON.stringify(a.levelType3) 
                        record.appliedActivityData.activityType = a.type
                        break;
                    default :
                        record.appliedActivityData.activityInfo = ""
                }
            } catch(err) {
                record.appliedActivityData.activityInfo = ""
            }
            
            record.bookInfo = [] 
            for (let logBook of log.bookInfo) {
                let book = new BookInfo()
                book.bookId = logBook.bookId
                book.bookNumber = logBook.bookNumber
                book.price = logBook.price
                record.bookInfo.push(book)
            }
            record.totalPrice = log.totalPrice
            records.push(record)
        }
    } catch (error) {
        errorLogger(req.userId, "mongoErr happens while searching transection log", data, error)
        res.errCode = errMongo
        callback(error,res)
    }

    res.errCode = errSuccess
    res.userId = req.userId
    res.recordNumber = count
    res.page = p.getPageNumber(req.page)
    res.pageSize = p.pageSize
    res.transectionRecords = records
    callback(null,res)
}