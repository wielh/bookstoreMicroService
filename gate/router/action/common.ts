import { Request, Response, NextFunction} from 'express';
import { decodeToken } from '../../../common/utils.js'
import { errToken } from '../../../common/errCode.js'

export async function verifyToken(req: Request, res: Response, next:NextFunction) {
    const cookie = req.cookies.token
    if (!cookie || !(typeof cookie === 'string')) {
        res.status(400).json({errCode: errToken});
        return
    }

    const tokenJson = decodeToken(cookie as string);
    req.username = tokenJson.username
    req.accountType = tokenJson.accountType
    next()
}

