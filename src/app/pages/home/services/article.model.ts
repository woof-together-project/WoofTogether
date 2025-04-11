// article.model.ts
export interface Article {
    id: string;
    title: { text: string };
    content: { paragraphs: string[] };
  }
