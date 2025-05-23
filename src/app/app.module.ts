import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { UserContextService } from './shared/sharedUserContext/UserContextService';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { GoogleMapsModule } from '@angular/google-maps';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    AppComponent,       
    NavbarComponent,
    GoogleMapsModule
  ],
  providers: [UserContextService],
})
export class AppModule {}

