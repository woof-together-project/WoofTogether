// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { Amplify } from 'aws-amplify';
import { amplifyCognitoConfig } from './app/amplify.config';

Amplify.configure(amplifyCognitoConfig);
console.log('✅ Amplify configured!');

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes)],
});
