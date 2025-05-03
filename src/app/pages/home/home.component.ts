import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Article } from './services/article.model';
import { ArticleService } from './services/article.service';
import { FormsModule } from '@angular/forms';
import { environment } from './../../../environments/environment';

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

  constructor(private router: Router, private articleService: ArticleService)
  {
    this.articles = this.articleService.getArticles();
  }

  async ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      try {
          const tokens = await this.exchangeCodeForTokens(code);
          if (tokens && tokens.id_token) {
            const userDetails = this.parseJwt(tokens.id_token);
            this.username = userDetails.nickname;
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
