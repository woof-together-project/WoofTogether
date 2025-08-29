// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SittersComponent } from './pages/sitters/sitters.component';
import { DogMatchComponent } from './pages/dog-match/dog-match.component';
import { AiChatComponent } from './pages/ai-chat/ai-chat.component';
import { SignupComponent } from './pages/signup/signup.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AuthGuard } from './shared/auth/guard/guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'sitters',         component: SittersComponent,        canActivate: [AuthGuard] },
  { path: 'dog-match',       component: DogMatchComponent,       canActivate: [AuthGuard] },
  { path: 'ask-us',          component: AiChatComponent,         canActivate: [AuthGuard] },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AuthGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [AuthGuard] },
];
