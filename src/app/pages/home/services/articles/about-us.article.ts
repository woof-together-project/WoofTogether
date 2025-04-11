import { Article } from '../article.model';

export const AboutUsArticle: Article = {
  id: 'about-us',
  title: { text: 'About Us' },
  imageUrl: '/assets/images/chilyAndSammy.jpg', 
  content: {
    textList: [
         'At WoofTogether, we’re not just a pet care service - we’re a community of dog lovers on a mission to make pet care simple, safe, and stress-free.',
         'Born from our passion for pups, we connect caring dog owners with trustworthy sitters and walking buddies who treat every dog like family.',
         'Our easy-to-use platform takes the worry out of finding reliable care, so you can have peace of mind knowing your furry friend is getting the love and attention they deserve.',
         'Whether you need a weekend sitter or a daily dog walker, WoofTogether makes it joyful and convenient to keep tails wagging and hearts happy.'
    ]
  }
};
