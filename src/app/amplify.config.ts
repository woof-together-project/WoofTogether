// amplify.config.ts
//import { Amplify } from 'aws-amplify';

//not in use!
export const amplifyCognitoConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: '5r2o2aopa92hgot078tfhvkf41',
      userPoolId: 'us-east-1_V1S8KqZxK',
      loginWith: {
        oauth: {
          domain: 'https://us-east-1v1s8kqzxk.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['http://localhost:4200/'],
          redirectSignOut: ['http://localhost:4200/'],
          // redirectSignIn: ['https://ui.dhz62hiqax4cs.amplifyapp.com/'],
          // redirectSignOut: ['https://ui.dhz62hiqax4cs.amplifyapp.com/'],
          responseType: 'code' as const
        }
      }
    }
  }
};

// Amplify.configure(amplifyCognitoConfig);
