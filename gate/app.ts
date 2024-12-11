import {GlobalConfig} from '../common/init.js';
import express from 'express';
import {registerRouter} from './router/router.js'
import {infoLogger, setElasticIndex} from '../common/utils.js'
import * as cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit';

setElasticIndex("gate")
var app = express();
app.use(cookieParser.default());

const repeatedLimiter = rateLimit({
  windowMs: 1000,
  max: 1,
  message: 'Send repeated requests, please try again later.',
  keyGenerator : req => {
    return `${req.ip}::${req.method}::${req.url}`
  }
});

const ipLimiter = rateLimit({
  windowMs: GlobalConfig.API.rateLimit.intervalMS,
  max: GlobalConfig.API.rateLimit.limitSingalIP,
  message: 'Too many requests, please try again later.',
  keyGenerator : req => req.ip
});

const Limiter = rateLimit({
  windowMs: GlobalConfig.API.rateLimit.intervalMS,
  max: GlobalConfig.API.rateLimit.limitAll,
  message: 'Service too busy, please try again later.',
});

app.use(repeatedLimiter);
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
 

 