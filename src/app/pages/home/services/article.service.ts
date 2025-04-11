import { Injectable } from '@angular/core';
import { Article } from './article.model';

import { DogHappyArticle } from './articles/dog-happy.article';
import { AboutUsArticle } from './articles/about-us.article';
//import { HowItWorksArticle } from './articles/how-it-works.article';
//import { JoinUsArticle } from './articles/join-us.article';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private articles: Article[] = [
    DogHappyArticle,
    //JoinUsArticle,
   // HowItWorksArticle,
    AboutUsArticle
  ];

  getArticles(): Article[] {
    return this.articles;
  }

  getArticleById(id: string): Article | undefined {
    return this.articles.find(a => a.id === id);
  }
}
