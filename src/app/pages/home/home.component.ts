import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Article } from './services/article.model';
import { ArticleService } from './services/article.service';
import { FormsModule } from '@angular/forms';

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
      answer: 'Yes! All features on the website are completely free to use — including browsing, connecting with sitters, and more.',
      isOpen: false,
    },
    {
      question: 'How do I become a sitter?',
      answer: 'Sign up, complete your profile, and fill in the sitter details. Another way to join is through the Management page, there’s also an option there to join as a sitter.',
      isOpen: false,
    },
    {
      question: 'How can I find a sitter?',
      answer: 'Go to Sitter page and use our search feature to find sitters in your area. You can filter by availability and services offered.',
      isOpen: false,
    },
  ];

toggleFAQ(index: number): void {
  this.faqList[index].isOpen = !this.faqList[index].isOpen;
}


  prevCard() {
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  nextCard() {
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
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
