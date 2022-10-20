'use strict';
const AWS = require('aws-sdk');
const { getNonce, updateNonce } = require('../utils');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  "Access-Control-Allow-Headers" : "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

module.exports.handler = async (event, context, callback) => {
    const {
        queryStringParameters: { address },
      } = event;
      if(!address){
        return {
            headers,
            statusCode: 400,
            body: JSON.stringify({
                nonce: null
            })
        };
      }
      try {
        const {Items: nonces} = await getNonce(address);
        //user exist return nonce, for sign in by web3
        if(nonces && nonces.length > 0){
          const existNonceResponse = AWS.DynamoDB.Converter.unmarshall(nonces[0]);
          const objResponse = {
            ...existNonceResponse,
            ...{eventName: "ExistNonce"}
          };
            return {
                headers,
                statusCode: 200,
                body: JSON.stringify(objResponse)
            };
        }else{
            //User not exist, signup and generate new nonce
            let newNonceResponse = await updateNonce(address);
            newNonceResponse = newNonceResponse.Attributes;
            const objResponse = {
              ...newNonceResponse,
              ...{eventName: 'Signup.NewNonce'}
              
            };
            return {
                headers,
                statusCode: 200,
                body: JSON.stringify(objResponse)
            };
        }
      } catch (error) {
        return callback(null, error)
      }
}