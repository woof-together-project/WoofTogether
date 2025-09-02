export interface Article {
    id: string;
    title: { text: string };
    content: {
      textList: string[];
    };
    imageUrl?: string;
  }
