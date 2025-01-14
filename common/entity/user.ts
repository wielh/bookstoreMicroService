export interface Suspensed {
    reason: string
    unlockTime: number
}

export interface User {
    name: string
    email: string
    balance: number
    suspensed: Suspensed[]
}

export interface NormalUser extends User {
    accountType: Number
    username: String
    password : String
    emailVerified : Number
}

export interface GoogleUser extends User {
    accountType: number
    googleID: string
}






