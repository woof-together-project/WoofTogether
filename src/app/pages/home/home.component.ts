import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Article } from './services/article.model'; 
import { ArticleService } from './services/article.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  nickname: string = '';

  constructor(private router: Router, private articleService: ArticleService, private http: HttpClient) 
  {
    this.articles = this.articleService.getArticles();
  }


  ngOnInit(): void {
    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
      //Exchange code for tokens
      this.http
        .post('http://localhost:8080/api/auth/callback', { code }, { withCredentials: true })
        .subscribe({
          next: () => {
            //Clean the URL (remove ?code=...)
            window.history.replaceState({}, document.title, window.location.pathname);

            //Wait a moment and check session
            setTimeout(() => this.checkSession(), 150);
          },
          error: (err) => {
            console.error('Token exchange failed:', err);
          },
        });
    } else {
      this.checkSession(); // try session directly
    }
  }

  checkSession(): void {
    this.http
      .get<{ nickname: string }>('http://localhost:8080/api/auth/session', {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          console.log('✅ nickname is', res.nickname);
          this.nickname = res.nickname;
        },
        error: (err) => {
          console.warn('⚠️ No session found', err);
          this.nickname = '';
        },
      });
  }
  
  

  removeQueryParams(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

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

  login(): void {
    this.http.get('http://localhost:8080/api/auth/session', { withCredentials: true }).subscribe({
      next: (res: any) => {
        // Session exists — update UI to show nickname
        this.nickname = res.nickname;
      },
      error: (err) => {
        // If no session or user doesn't exist, go to Cognito login
        const loginUrl = `https://us-east-1u3zil1hlz.auth.us-east-1.amazoncognito.com/login` +
          `?client_id=5s339emasb5u0mf4jej6dvic06` +
          `&response_type=code&scope=email+openid+profile` +
          `&redirect_uri=http://localhost:4200/`;
  
        if (err.status === 401 || err.status === 404) {
          window.location.href = loginUrl;
        } else {
          console.error('Unexpected error:', err);
        }
      }
    });
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
