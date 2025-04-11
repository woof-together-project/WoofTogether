import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Article } from './services/article.model'; 
import { ArticleService } from './services/article.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  articles: Article[] = [];
  cards = [
    {
      title: 'How Do I Know If My Dog Is Happy?',
      description: 'Want to know if your dog is happy? Exhibiting these behaviors on a regular basis is a good thing!',
      image: 'assets/images/dogHappy.jpg',
      button: 'Read More',
    },
    {
      title: 'Join Us',
      description: 'Join our community to become a trusted dogsitter and connect with loving dog owners in your area. Start making tails wag today!',
      image: 'assets/images/people.jpg',
      button: 'Read More',
    },
    {
      title: 'How It Works',
      description: 'Woof Together connects dog owners with trusted sitters and partners, matching them by location, preferences, and their dog’s needs for stress-free care.',
      image: 'assets/images/dogDeveloper.jpg',
      button: 'Let’s Get Started',
    },
    {
      title: 'About Us',
      description: 'It began with a passion for helping dog owners connect and build a community, and it has grown significantly since then.',
      image: 'assets/images/toys.jpg',
      button: 'Read More',
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
  ];
  
  toggleFAQ(index: number) {
    this.faqList[index].isOpen = !this.faqList[index].isOpen;
  }

  constructor(private router: Router, private articleService: ArticleService) 
  {
    this.articles = this.articleService.getArticles();
  }
  prevCard() {
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  nextCard() {
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
  }
  goToLogin() {
    this.router.navigate(['/login']);
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

  
  // getArticleId(title: string): string {
  //   switch (title) {
  //     case 'How Do I Know If My Dog Is Happy?':
  //       return 'dog-happy';
  //     case 'Join Us':
  //       return 'join-us';
  //     case 'How It Works':
  //       return 'how-it-works';
  //     case 'About Us':
  //       return 'about-us';
  //     default:
  //       return '';
  //   }
  // }  
  getArticleId(title: string): string {
    const article = this.articles.find(a => a.title.text === title);
    return article ? article.id : '';
  }
  
}
