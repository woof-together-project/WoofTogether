export interface Dog {
  id: number;
  userId: number;             // FK to Users table
  userName: string;           // owner's name
  userEmail: string;          // owner's email
  name: string;               // dog's name
  breed?: string | null;
  size: string;
  weight: number;
  age: number;
  profilePictureUrl: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  temperament: string;
  healthConditions?: string | null;
  isNeutered: boolean;
  moreDetails?: string;
  favoriteActivities?: string[];
  vaccinationStatus: boolean;
  createdAt: string;          // ISO date string
}
