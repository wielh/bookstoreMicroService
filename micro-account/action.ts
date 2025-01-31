import * as grpc from "@grpc/grpc-js";
import { GooogleLoginRequest, GooogleLoginResponse, LoginRequest, LoginResponse, 
    RegisterRequest, RegisterResponse, ResetPasswordRequest, ResetPasswordResponse, ResendRegisterVerifyEmailRequest,
    ResendRegisterVerifyEmailResponse,RegisterVerifyRequest,RegisterVerifyResponse} from "../proto/account.js";
import {errSuccess, errMongo, errUserExist, errUserNotExist, errSendRegisterEmailFailed, errEmailVerifited, errUserIsSuspended} from '../common/errCode.js'
import {createToken, sendMailProducer, errorLogger, getRabbitMQConnection} from '../common/utils.js'
import {GlobalConfig} from '../common/init.js'
import {normalUserRepo, googleUserRepo, userRepo, LoginRecordRepo} from '../common/repository/init.js'

async function resendRegiterVerifyEmailImplementation(username:string, userId:string, email:string): Promise<number> {
    let verificationCode = createToken({userId: userId , email:email}, GlobalConfig.API.emailExpireSecond)
    const emailInfo =
        ` Hello, user ${username}, this is QueenStore bookstore.` +
        ` Please enter the website: ${GlobalConfig.gate.localIP}:${GlobalConfig.gate.port}/account/register_verify?token=${verificationCode} `+
        ` to complete email varification.`+
        ` If you are not a member. Please ignore this.`;

    let sendEmailSuccess = await sendMailProducer(getRabbitMQConnection(), email, "register email verificaition", emailInfo)
    return sendEmailSuccess?  errSuccess: errSendRegisterEmailFailed
} 

export async function register(call: grpc.ServerUnaryCall<RegisterRequest, RegisterResponse>, callback: grpc.sendUnaryData<RegisterResponse>){
    let req = call.request
    let res = new RegisterResponse()

    let userId = ""
    try {
        userId = await normalUserRepo.normalUserExist(req.base.username)
        if (userId) {
            res.errcode = errUserExist
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(req.base.username,"mongoErr happens while searching user", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    try {
        userId = await normalUserRepo.insertNormalUser(req.base.username, req.base.password, req.email , req.name)
    } catch (error) {
        errorLogger(req .base.username, "mongoErr happens while insert new data to collection user", req, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    res.errcode = await resendRegiterVerifyEmailImplementation(req.base.username, userId, req.email)
    callback(null,res)
}

export async function resendRegisterVerifyEmail(call: grpc.ServerUnaryCall<ResendRegisterVerifyEmailRequest,ResendRegisterVerifyEmailResponse>, callback: grpc.sendUnaryData<ResendRegisterVerifyEmailResponse>) {
    let req = call.request
    let res = new ResendRegisterVerifyEmailResponse()
    let userId = ""
    try {
        userId = await normalUserRepo.normalUserExistWithPWD(req.base.username, req.base.password)
        if (!userId) {
            res.errcode = errUserNotExist
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(req.base.username, "mongoErr happens while searching user", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    try {
        let exist = await normalUserRepo.normalEmailCheckAndChange(req.base.username, req.email)
        if (!exist) {
            res.errcode = errUserNotExist
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(req.base.username, "mongoErr happens while searching user", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    res.errcode = await resendRegiterVerifyEmailImplementation(req.base.username, userId, req.email)
    callback(null,res)
} 

export async function registerVerify(call: grpc.ServerUnaryCall<RegisterVerifyRequest,RegisterVerifyResponse>, callback: grpc.sendUnaryData<RegisterVerifyResponse>) {
    let req = call.request
    let res = new RegisterVerifyResponse()
    try {
        let notVerified = normalUserRepo.normalEmailVerify(req.userId)
        if (!notVerified) {
            res.errcode = errEmailVerifited
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(req.userId,  "mongoErr happens while searching user", call.request,error)
        res.errcode = errMongo
        callback(error,res)
        return
    }
    callback(null,res)
}

export async function googleLogin(call: grpc.ServerUnaryCall<GooogleLoginRequest, GooogleLoginResponse>, callback: grpc.sendUnaryData<GooogleLoginResponse>):Promise<void> {
    let req = call.request
    let res = new GooogleLoginResponse()
    let userId = ""
    try {
        userId = await googleUserRepo.googleUserExist(req.googleID)
    } catch (error) {
        errorLogger(req.googleID.toString(), "mongoErr happens while searching user", call.request,error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    if (!userId) {
        try {  
            userId = await googleUserRepo.insertGoogleUser(req.googleID, req.googleName, req.googleEmail)
        } catch (error) {
            errorLogger(req.googleID.toString(), "mongoErr happens while insert new user", req, error)
            res.errcode = errMongo
            callback(error,res)
            return
        }
    }
    res.token = createToken({userId: userId}, GlobalConfig.API.tokenExpireSecond)
    res.errcode = errSuccess
    callback(null,res)
}

export async function login(call: grpc.ServerUnaryCall<LoginRequest, LoginResponse>, callback: grpc.sendUnaryData<LoginResponse>): Promise<void> {
    let res = new LoginResponse()
    let userId = ""
    try {
        userId = await normalUserRepo.normalUserExist(call.request.base.username)
        if (!userId) {
            res.errcode = errUserNotExist
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(call.request.base.username, "mongoErr happens while searching user", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    try {
        if (!(await normalUserRepo.normalUserExistWithPWD(call.request.base.username, call.request.base.password))) {
            res.errcode = errUserNotExist
            await LoginRecordRepo.Insert(userId, new Date().getTime(), false)
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(call.request.base.username, "mongoErr happens while searching user", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    try {
        let until = await userRepo.userIsSuspensed(userId)
        if (until > 0) {
            res.errcode = errUserIsSuspended
            callback(null, res)
            return
        }
        LoginRecordRepo.Insert(userId, new Date().getTime(), true)
    } catch(error) {
        errorLogger(call.request.base.username, "mongoErr happens when we check user is suspended", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }
   
    res.token = createToken({userId:userId}, GlobalConfig.API.tokenExpireSecond)
    res.errcode = errSuccess
    callback(null, res)
}
 
export async function resetPassword(call: grpc.ServerUnaryCall<ResetPasswordRequest, ResetPasswordResponse>, callback: grpc.sendUnaryData<ResetPasswordResponse>): Promise<void> {
    let req = call.request
    let res:ResetPasswordResponse = new ResetPasswordResponse()
    try {
       let exist = normalUserRepo.resetPassword(req.base.username, req.base.password, req.newPassword)
       if (!exist) {
            res.errcode = errUserNotExist
            callback(null, res)
            return
        }
    } catch (error) {
        errorLogger(req.base.username, "mongoErr happens while searching user", call.request, error)
        res.errcode = errMongo
        callback(error,res)
        return
    }

    res.errcode = errSuccess
    callback(null,res)
}


