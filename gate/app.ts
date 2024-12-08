import {GlobalConfig} from '../common/init.js';
import express from 'express';
import {registerRouter} from './router/router.js'
import {infoLogger, setElasticIndex} from '../common/utils.js'
import * as cookieParser from 'cookie-parser'

var app = express();
app.use(cookieParser.default());
registerRouter(app)
setElasticIndex("gate")

declare module 'express-serve-static-core' {
    interface Request {
      username?: string;
      accountType?: number
    }
}

app.listen(GlobalConfig.gate.port, function () {
    infoLogger("gate-service", `Example app listening on port ${GlobalConfig.gate.port} !`, "")
});
 

 