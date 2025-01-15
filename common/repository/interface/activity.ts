import { Activity } from "../../entity/activity.js"

export interface ActivityRepo {
    findActivities(timeStamp:number): Promise<Activity[]>
    findActivityType1ById(Id: string, timeStamp:number):Promise<Activity|null>
    findActivityType2ById(Id: string, timeStamp:number):Promise<Activity|null>
    findActivityType3ById(Id: string, timeStamp:number):Promise<Activity|null>
    findActivityById(id:string, timeStamp:number):Promise<Activity|null>
}


