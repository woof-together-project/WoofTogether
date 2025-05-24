// amplify.config.ts
//import { Amplify } from 'aws-amplify';

export const amplifyCognitoConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: '5s339emasb5u0mf4jej6dvic06',
      userPoolId: 'us-east-1_U3ZIL1hLZ',
      loginWith: {
        oauth: {
          domain: 'us-east-1u3zil1hlz.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['http://localhost:4200/'],
          redirectSignOut: ['http://localhost:4200/'],
          responseType: 'code' as const
        }
      }
    }
  }
};

// Amplify.configure(amplifyCognitoConfig);
