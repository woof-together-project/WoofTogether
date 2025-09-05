
export const amplifyCognitoConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: '5r2o2aopa92hgot078tfhvkf41',
      userPoolId: 'us-east-1_V1S8KqZxK',
      loginWith: {
        oauth: {
          domain: 'https://us-east-1v1s8kqzxk.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['https://main.d3v64w044qjoc9.amplifyapp.com/'],
          redirectSignOut: ['https://main.d3v64w044qjoc9.amplifyapp.com/'],
          responseType: 'code' as const
        }
      }
    }
  }
};
