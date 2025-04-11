import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { LoginService } from './login.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
  providers: [LoginService] 
})
export class LoginComponent {
  loginForm = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

  constructor(private loginService: LoginService) {}

  onSubmit() {
    const { username, password } = this.loginForm.value;
  
    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }
  
    this.loginService.login(username, password).subscribe({
      next: (res: string) => {
        console.log('✅ Server responded with:', res);
        if (res.trim() === 'OK') {
          alert('✅ Login successful!');
        } else {
          alert('❌ Invalid credentials');
        }
      },
      error: (err) => {
        console.error('❌ Request failed with error:', err);
        alert('❌ Login failed: Server error or wrong input.');
      }
    });
  }  
  
}
