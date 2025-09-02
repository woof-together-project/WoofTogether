export const environment = {
    //Final user details!! no DELETE !!!
    production: true,
    cognitoDomain: 'https://us-east-1bbl3ifrq6.auth.us-east-1.amazoncognito.com',
    clientId: '71ple1gfg2tc7ehq5bea9gf83n',
    clientSecret:'l87jkrbu0dq0egqkhui1ssi5bjt6quibf5dotthst27pdc5cn37',
    redirectUri:'http://localhost:4200/',
    grantType: 'authorization_code',
    userPoolId:'us-east-1_BbL3iFRQ6',
    region:'us-east-1',
    signOutRedirectUri: 'http://localhost:4200/',
    apiUrl: 'https://nt8exuq2h9.execute-api.us-east-1.amazonaws.com/dev', //same
    loginUrl: 'https://us-east-1bbl3ifrq6.auth.us-east-1.amazoncognito.com/login?client_id=71ple1gfg2tc7ehq5bea9gf83n&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:4200/'


      // production: true,
      // cognitoDomain: 'https://us-east-1gutoejjkc.auth.us-east-1.amazoncognito.com',
      // clientId: '7jm889fqkrfpdu3kkb9e7o79cj',
      // clientSecret:'a8pomfakjrr0c2cghas7pe9ea9r9g9tj9tc9d1u7fj8i74akq7o',
      // // redirectUri:'https://ui.dhz62hiqax4cs.amplifyapp.com/',
      // redirectUri:'http://localhost:4200/',
      // grantType: 'authorization_code',
      // region:'us-east-1',
      // signOutRedirectUri: 'http://localhost:4200/',
      // userPoolId:'us-east-1_GutoEJjkc',
      // loginUrl: 'https://us-east-1gutoejjkc.auth.us-east-1.amazoncognito.com/login?client_id=7jm889fqkrfpdu3kkb9e7o79cj&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:4200/'
    };
