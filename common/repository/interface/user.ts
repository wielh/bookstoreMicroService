

export interface UserRepo {
    userExistByID(Id:string): Promise<boolean>
    transection(userId:string, gold:number, session:any): Promise<boolean>
    userSuspense(userId: string, reason: string, unlockTime: number): Promise<boolean>
    userIsSuspensed(userId: string): Promise<number>
}

export interface NormalUserRepo {
    normalUserExist(username:string): Promise<string>
    normalUserExistWithPWD(username:string, password:string): Promise<string>
    insertNormalUser(username:string, password:string, email:string, name:string): Promise<string>
    resetPassword(username:string, password:string, newPassword:string): Promise<boolean>
    normalEmailCheckAndChange(username:string, email:string): Promise<boolean> 
    normalEmailVerify(userId: string): Promise<boolean>
}

export interface GoogleUserRepo {
    googleUserExist(googleID:string): Promise<string>
    insertGoogleUser(googleID:string, googleName:string, email:string): Promise<string>
}
