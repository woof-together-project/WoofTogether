import { PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
            authority: 'https://login.microsoftonline.com/https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_sPoCbE486/v2.0',
            authWellknownEndpointUrl: 'https://login.microsoftonline.com/common/v2.0',
            redirectUrl: window.location.origin,
            clientId: 'please-enter-clientId',
            scope: 'please-enter-scopes', 
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            issValidationOff: false,
            autoUserInfo: false,
            customParamsAuthRequest: {
              prompt: 'select_account',
            },
    }
}
