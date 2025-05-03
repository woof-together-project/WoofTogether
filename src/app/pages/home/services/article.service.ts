import { Injectable } from '@angular/core';
import { Article } from './article.model';

import { DogHappyArticle } from './articles/dog-happy.article';
import { AboutUsArticle } from './articles/about-us.article';
import { DogsAndChildrenArticle } from './articles/dogs-and-children-growing-up-together.article';
import { TrainDogArticle } from './articles/how-to-train-a-dog.article';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private articles: Article[] = [
    DogHappyArticle,
    AboutUsArticle,
    TrainDogArticle,
    DogsAndChildrenArticle,
  ];

  getArticles(): Article[] {
    return this.articles;
  }

  getArticleById(id: string): Article | undefined {
    return this.articles.find(a => a.id === id);
  }
}
