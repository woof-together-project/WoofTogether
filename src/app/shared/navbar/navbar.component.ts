import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { NavigationService } from '../../shared/navigation/navigation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private router: Router, private userContext: UserContextService,   private navigationService: NavigationService) {}
  username: string | null = null;
  searchText: string = '';
  loading: boolean = true;
  isComplete: boolean = false;

  async ngOnInit() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      this.navigationService.homeRedirect$.subscribe(() => {
      this.router.navigate(['/']);
        });


      if (code) {
        try {
            const tokens = await this.exchangeCodeForTokens(code);
            if (tokens && tokens.id_token) 
              {
              const userDetails = this.parseJwt(tokens.id_token);
              this.username = userDetails.nickname;
              
            console.log('User Details:', userDetails);

            if (userDetails.email && userDetails.nickname && userDetails.name && userDetails.sub) 
                {
                  this.userContext.setUser(userDetails.email, userDetails.nickname, userDetails.name, userDetails.sub);
                  await this.sendDataToBackend();
                } 
          else {
                 console.error("Missing user details from token");
               }
            }
          }
            catch (error) {
              console.error('Error exchanging code for tokens:', error);
            }
        }
    }
  
    async exchangeCodeForTokens(code: string) {
      const tokenUrl = `${environment.cognitoDomain}/oauth2/token`;
      const body = new URLSearchParams({
          grant_type: environment.grantType,
          client_id: environment.clientId,
          redirect_uri: environment.redirectUri,
          code: code
      });
      try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${environment.clientId}:${environment.clientSecret}`)
            },
            body
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error(`Failed to exchange code for tokens. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error exchanging code:', error);
        throw error;
    }
    }
  
  
    redirectToLogin(): void {
     window.location.href = environment.loginUrl;
    }
  
    login() : void {
      this.redirectToLogin();
    }
  
     parseJwt(token: string): any {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }

    
			  
 async sendDataToBackend()  
 {
    const currentUser = this.userContext.getCurrentUserValue();
    const lambdaUrl = 'https://76lrewksipqyhundciqqozf42q0keslz.lambda-url.us-east-1.on.aws/';
     
    if (!currentUser) 
      {
      console.error('CRITICAL: User context is null or missing properties. Current User (from service):', currentUser);
      return;
    }

     const payload = {
      user: {
        name: currentUser.username,
        email: currentUser.email,
        nickname: currentUser.nickname,
        provider: 'COGNITO',
        providerId: currentUser.sub,
      }
    };

    console.log('Payload to send:', payload);

   try {
     console.log('Sending request to Lambda with payload:', payload);
     const response = await fetch(lambdaUrl, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(payload)
     });
   
     const result = await response.json();
     console.log('Lambda response:', result);

     if (response.ok) {
       if (result.userExists === true ) {
         this.userContext.setUserCompleteStatus(true);
         console.log('User already exists in the database.');

       } else {
         console.log('User created successfully.');
       }
     } else {
       console.error('Lambda responded with error:', result);
     }
   } catch (err) {
     console.error('Error sending request to Lambda:', err);
   }
 }
	
 handleProtectedRoute(event: Event, targetRoute: string): void {
  event.preventDefault();
  const currentUser = this.userContext.getCurrentUserValue();
  if (!(currentUser?.isComplete)) {
    alert("Please complete your sign up information to access this page.");
    this.router.navigate(['/signup']);
  } else 
  {
    this.router.navigate([targetRoute]);
    }
  }


   redirectToHome() {
    this.router.navigate(['/']);
  }

}
