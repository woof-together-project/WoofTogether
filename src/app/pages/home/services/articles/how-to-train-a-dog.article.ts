import { Article } from '../article.model';

export const TrainDogArticle: Article = {
  id: 'how-to-train-a-dog',
  title: { text: 'How to Train a Dog?' },
  imageUrl: '/assets/images/trainADog.png', 
  content: {
    textList: [
        '🎓 Training your dog is all about building trust and using positive reinforcement.',
        '🎯 Focus on what motivates your dog—treats, praise, or toys—to shape behavior.',
        '💬 Use clear cues and consistent commands to help your dog learn quickly.',
        '🐶 Clicker training or saying “Yes” at the right moment marks good behavior.',
        '⏳ Be patient—especially with potty and crate training. Consistency is key!',
        '🚫 Avoid punishment; it can create fear and confusion rather than learning.',
        '🏠 Make sure everyone in your home uses the same rules and signals.',
        '🤝 Reward good behavior immediately so your dog connects actions to praise.',
        '🧠 Keep sessions short, fun, and regular to reinforce learning.',
        '🐕‍🦺 A well-trained dog is a happy, confident, and well-behaved companion.'
    ]
  }
};
