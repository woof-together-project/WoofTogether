export interface Sitter {
  user_id: number;
  sitterId: number;
  name: string;
  email: string;
  profilePictureUrl: string;
  imageUrl: string;
  experienceYears: number;
  availability: string;
  rate: number | string;
  aboutMe: string;
  moreDetails: string;
  city: string;
  street: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  reviews: string[];
  reviewCount: number;
  averageRating: number;
  serviceOptions: string[];
  experienceDetails: string[];
}
