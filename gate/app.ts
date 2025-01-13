import {GlobalConfig} from '../common/init.js';
import express from 'express';
import {registerRouter} from './router/router.js'
import {infoLogger, setElasticIndex} from '../common/utils.js'
import * as cookieParser from 'cookie-parser'
import cors from 'cors';
import rateLimit from 'express-rate-limit';

var app = express();

function appInit() {
  setElasticIndex("gate")
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
  
  /*
  const corsOptions = {
    origin: 'http://example.com', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  
    allowedHeaders: ['*'],  
  };
  app.use(cors(corsOptions));*/
  registerRouter(app)
}
 
appInit()
declare module 'express-serve-static-core' {
    interface Request {
      userId?: string;
    }
}

app.listen(GlobalConfig.gate.port, function () {
    infoLogger("gate-service", `Example app listening on port ${GlobalConfig.gate.port} !`, "")
});
 

 