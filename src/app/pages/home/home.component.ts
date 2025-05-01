import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Article } from './services/article.model'; 
import { ArticleService } from './services/article.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment'; 
import { fetchUserAttributes } from '@aws-amplify/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent{
  
  username: string | null = null;
  loading: boolean = true;
  searchText: string = '';

  
  constructor(private router: Router, private articleService: ArticleService, private http: HttpClient, private cdr: ChangeDetectorRef) 
  {
    this.articles = this.articleService.getArticles();
    this.loggedIn = false; // Initialize loggedIn to false
  }

  ngOnInit(): void {
   this.checkAuthState();
  }
  
  async checkAuthState() {
    try {
      const user = await fetchUserAttributes(); 
      this.username = user.nickname ?? null; 
      this.loading = false;
    } catch (error) {
      console.log('User not authenticated:', error);
      this.loading = false;
      this.redirectToLogin(); 
    }
  }
 
  // ngOnInit(): void {
  //   const code = new URLSearchParams(window.location.search).get('code');
  
  //   if (code) {
  //     this.http.post<{ id_token: string; nickname: string }>(
  //       `${environment.apiUrl}/api/auth/callback`,
  //       { code }
  //     ).subscribe({
  //       next: (res) => {
  //         localStorage.setItem('id_token', res.id_token);
  //         this.username = res.nickname;
      
  //        // this.router.navigate(['/']);
  //        window.history.replaceState({}, document.title, window.location.pathname);
  //        this.cdr.detectChanges(); // Make sure UI update
  //       },
  //       error: (err) => {
  //         console.error('Token exchange failed:', err);
  //       }
  //     });
  //   } else {
  //     //this.validateSession(); 
  //   }
  // }
  
  redirectToLogin(): void {
    window.location.href = environment.loginUrl;
  }
  
  // validateSession(): void {
  //   const token = localStorage.getItem('id_token');
  
  //   if (!token) {
  //     this.redirectToLogin();
  //     return;
  //   }
  
  //   this.http.get<{ nickname: string }>(`${environment.apiUrl}/api/auth/session`, {
  //     headers: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   }).subscribe({
  //     next: (res) => {
  //       this.username = res.nickname;
  //       this.cdr.detectChanges();
  //     },
  //     error: () => {
  //       this.redirectToLogin();
  //     }
  //   });
  // }
  

  loggedIn: boolean = false;
  articles: Article[] = [];
  cards = [
    {
      title: 'How Do I Know If My Dog Is Happy?',
      description: 'Want to know if your dog is happy? Exhibiting these behaviors on a regular basis is a good thing!',
      image: 'assets/images/dogHappy.png',
      button: 'Read More',
      articleId: 'dog-happy',
    },
    {
      title: 'How to Train a Dog: A Simple Guide to Positive and Effective Methods',
      description: 'A practical guide that teaches dog owners how to train their dogs using positive reinforcement and consistency',
      image: 'assets/images/people.png',
      button: 'Read More',
      articleId: 'how-to-train-a-dog',
    },
    {
      title: 'Why Kids and Dogs Make the Perfect Team',
      description: 'Discover how growing up with a dog can positively influence a children development, from emotional growth to physical health',
      image: 'assets/images/dogDeveloper.png',
      button: 'Read More',
      articleId: 'dogs-and-children-growing-up-together',
    },
    {
      title: 'About Us',
      description: 'It began with a passion for helping dog owners connect and build a community, and it has grown significantly since then.',
      image: 'assets/images/toys.png',
      button: 'Read More',
      articleId: 'about-us',
    }
  ];
  currentIndex = 1;

  faqList = [
    {
      question: 'What services does WoofTogether offer?',
      answer: 'We connect dog owners with trusted sitters and walking partners in their area.',
      isOpen: false,
    },
    {
      question: 'Is WoofTogether free to use?',
      answer: 'Yes! You can browse and connect with sitters at no cost. Premium features are optional.',
      isOpen: false,
    },
    {
      question: 'How do I become a sitter?',
      answer: 'Sign up, complete your profile, and get verified. You’ll be matched with nearby dog owners.',
      isOpen: false,
    },
    {
      question: 'How can I find a sitter?',
      answer: 'Go to Sitter page and use our search feature to find sitters in your area. You can filter by availability and services offered.',
      isOpen: false,
    },
  ];
  
  toggleFAQ(index: number) {
    this.faqList[index].isOpen = !this.faqList[index].isOpen;
  }


  prevCard() {
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  nextCard() {
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
  }
    
      // login(): void {
      //   const token = localStorage.getItem('id_token');
      
      //   if (!token) {
      //     this.redirectToLogin();  // If no token, redirect to login
      //     return;
      //     }

      //     this.http.get('http://localhost:8080/api/auth/session', { withCredentials: true }).subscribe({
      //       next: (res: any) => {
      //         // Session exists — update UI to show nickname
      //         this.username = res.nickname;
      //       },
      //       error: (err) => {
      //         // If no session or user doesn't exist, go to Cognito login
      //         const loginUrl = `https://us-east-1u3zil1hlz.auth.us-east-1.amazoncognito.com/login` +
      //           `?client_id=5s339emasb5u0mf4jej6dvic06` +
      //           `&response_type=code&scope=email+openid+profile` +
      //           `&redirect_uri=http://localhost:4200/`;
        
      //         if (err.status === 401 || err.status === 404) {
      //           window.location.href = loginUrl;
      //         } else {
      //           console.error('Unexpected error:', err);
      //         }
      //       }
      //     });
      //   }
    

    login() : void {
      
    }
  getCardClass(index: number): string {
    const relative = (index - this.currentIndex + this.cards.length) % this.cards.length;

    switch (relative) {
      case 0: return 'card-left';
      case 1: return 'card-center';
      case 2: return 'card-right';
      default: return 'card-hidden';
    }
  }

  goToRoute(path: string) {
    this.router.navigate([`/${path}`]);
  }
  scrollToArticle(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getArticleId(title: string): string {
    const article = this.articles.find(a => a.title.text === title);
    return article ? article.id : '';
  }
}
