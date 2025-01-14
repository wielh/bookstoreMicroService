
export interface Activity {
    id: string
    type: number
    startDate: number
    endDate: number
    levelType1: LevelType1[]
    levelType2: LevelType2[]
    levelType3: LevelType3[]
}

interface LevelType1 {
    price:number
    discount:number
}

interface LevelType2 {
    price:number
    discount:number
}

interface LevelType3 {
    by: number
    give: number
    bookIds: string[]
}

