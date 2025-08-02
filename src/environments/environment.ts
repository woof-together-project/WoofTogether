export const environment = {
    production: true,
    cognitoDomain: 'https://us-east-1v1s8kqzxk.auth.us-east-1.amazoncognito.com',
    clientId: '5r2o2aopa92hgot078tfhvkf41',
    clientSecret:'37qqnss0umi5sq1s02ldf74spkjje2k9t8k3u1siagerjr9cn19',
    // redirectUri:'https://ui.dhz62hiqax4cs.amplifyapp.com/',
    redirectUri:'http://localhost:4200/',
    grantType: 'authorization_code',
    userPoolId:'us-east-1_V1S8KqZxK',
    region:'us-east-1',
    apiUrl: 'https://nt8exuq2h9.execute-api.us-east-1.amazonaws.com/dev',
      loginUrl: 'https://us-east-1v1s8kqzxk.auth.us-east-1.amazoncognito.com/login?client_id=5r2o2aopa92hgot078tfhvkf41&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:4200/'
  };
