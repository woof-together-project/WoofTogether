export const environment = {
    production: true,
    cognitoDomain: 'https://us-east-19tpnuqjde.auth.us-east-1.amazoncognito.com',
    // cognitoDomain: 'https://us-east-1gutoejjkc.auth.us-east-1.amazoncognito.com',
    clientId: '4kg1ackgcuha9i3oem4crqt1s6',
    // clientId: '7jm889fqkrfpdu3kkb9e7o79cj',
    clientSecret:'og0v1n7916l6hsu5lt5s29377ua75ebmcjonsihnblqs0vqprdh',
    // clientSecret:'a8pomfakjrr0c2cghas7pe9ea9r9g9tj9tc9d1u7fj8i74akq7o',
    // redirectUri:'https://ui.dhz62hiqax4cs.amplifyapp.com/',
    redirectUri:'http://localhost:4200/',
    grantType: 'authorization_code',
    userPoolId:'us-east-1_9tpNUqjdE',
    // userPoolId:'us-east-1_GutoEJjkc',
    region:'us-east-1',
    signOutRedirectUri: 'http://localhost:4200/',
    apiUrl: 'https://nt8exuq2h9.execute-api.us-east-1.amazonaws.com/dev', //same
      loginUrl: 'https://us-east-19tpnuqjde.auth.us-east-1.amazoncognito.com/login?client_id=4kg1ackgcuha9i3oem4crqt1s6&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:4200/'
        // loginUrl: 'https://us-east-1gutoejjkc.auth.us-east-1.amazoncognito.com/login?client_id=7jm889fqkrfpdu3kkb9e7o79cj&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:4200/'

    };
