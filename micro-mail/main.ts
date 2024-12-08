

import {debugLogger, infoLogger, errorLogger, setElasticIndex, rabbitMQconnect,getRabbitMQConnection} from "../common/utils.js"
import {createTransport} from 'nodemailer'
import {GlobalConfig} from '../common/init.js'

export async function sendMailImplementation(emailAddress:string, subject:string, message:string): Promise<boolean>{
    try {
        await transporter.sendMail(
            {
                from: GlobalConfig.microMail.websiteEmail,
                to: emailAddress,
                subject: subject,
                html: message,
            }
        )
    } catch (error) {
        errorLogger("micro-mail-service", "send mail failed" , [emailAddress, subject] , error);
        return false;
    }
    debugLogger("micro-mail-service", "send mail successfully" , [emailAddress, subject]);
    return true
}

const options = { noAck: true };
function sendEmail(channelName:string) {
    let message:any
    try {
        channel.consume(channelName,
            async (msg) => {
                debugLogger("micro-mail-service", "recevice sendmail request" , `${msg}\n`);
                if (msg !== null) {
                    const emailMessage = JSON.parse(msg.content.toString())
                    const {emailAddress, subject, message} = emailMessage
                    await sendMailImplementation(emailAddress, subject, message)
                }
            }, options
        );
    } catch (error) {
       errorLogger("micro-mail-service", "An error happens while consuming message from rabbitMQ" , `${message}` , error);
    }
}

function sendVerificationMail() {
    sendEmail(GlobalConfig.rabbitMQ.channelName.email)
}

var transporter = createTransport(
    {  
        host: "smtp.gmail.com",
        service: 'gmail',
        port: GlobalConfig.microMail.sendMailport,
        secure: true,
        auth: {
            user: GlobalConfig.microMail.websiteEmail,
            pass: GlobalConfig.microMail.sendMailPassword
        },
        tls: {
            rejectUnauthorized: false
        }
    }
);

setElasticIndex("micro-mail")
//debugLogger("micro-mail-service", `show config:`, GlobalConfig.microMail)
infoLogger("micro-mail-service", `Server run on port: ${GlobalConfig.microMail.url.port}`, "")
await rabbitMQconnect()
const channel = await getRabbitMQConnection().createChannel()
await channel.assertQueue(GlobalConfig.rabbitMQ.channelName.email, { durable: true});
sendVerificationMail()