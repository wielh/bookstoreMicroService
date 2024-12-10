import {GlobalConfig} from '../common/init.js';
import express from 'express';
import {registerRouter} from './router/router.js'
import {infoLogger, setElasticIndex} from '../common/utils.js'
import * as cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit';

setElasticIndex("gate")
var app = express();
app.use(cookieParser.default());

const ipLimiter = rateLimit({
  windowMs: GlobalConfig.API.intervalms,
  max: GlobalConfig.API.limitSingalIP,
  message: 'Too many requests, please try again later.',
  keyGenerator : req => req.ip
});

const Limiter = rateLimit({
  windowMs: GlobalConfig.API.intervalms,
  max: GlobalConfig.API.limitAll,
  message: 'Too many requests, please try again later.',
});

app.use(ipLimiter);
app.use(Limiter);
registerRouter(app)

declare module 'express-serve-static-core' {
    interface Request {
      userId?: string;
    }
}

app.listen(GlobalConfig.gate.port, function () {
    infoLogger("gate-service", `Example app listening on port ${GlobalConfig.gate.port} !`, "")
});
 

 