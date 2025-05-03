import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private router: Router) {}
  username: string | null = null;
  searchText: string = '';
  loading: boolean = true;

  redirectToLogin(): void {
   window.location.href = environment.loginUrl;
  }

   login() : void {
    this.redirectToLogin();
  }
}
