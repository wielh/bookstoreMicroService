import { expect } from 'chai';
import { describe, it } from 'mocha'
import { decodeToken, createToken } from '../common/utils.js';

function generateRandomString(): string {
    const randomLength = Math.floor(Math.random() * 20) + 1; 
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let result = "";
    for (let i = 0; i < randomLength; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters[randomIndex];
    }
    return result;
}

describe('calculate', function() {
    for(let i=0;i<10;i++) {
        let userId = generateRandomString()
        it(`token:${userId}`, function() {
            let token = createToken({userId: userId, email:""}, 60*60)
            let result = decodeToken(token)
            expect(result).to.not.be.null
            expect(result!.userId).to.not.be.null
            expect(result!.userId!).equal(userId)       
        });
    }
});