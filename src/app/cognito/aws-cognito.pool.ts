import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_U3ZIL1hLZ', 
  ClientId: '5s339emasb5u0mf4jej6dvic06', 
};

export const userPool = new CognitoUserPool(poolData);
