import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SittersComponent } from './pages/sitters/sitters.component';
import { DogMatchComponent } from './pages/dog-match/dog-match.component';
import { AiChatComponent } from './pages/ai-chat/ai-chat.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'sitters', component: SittersComponent },
  { path: 'dog-match', component: DogMatchComponent},
  { path: 'ask-us', component: AiChatComponent},
];


