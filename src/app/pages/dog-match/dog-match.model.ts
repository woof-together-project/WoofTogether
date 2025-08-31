export interface DogDto {
  latitude: number;
  longitude: number;
  id: number;                         // Id
  userId: number;                     // UserId  (FK owner)
  name: string;                       // Name
  breed?: string | null;              // Breed
  size: string;                       // Size
  weight: number;                     // Weight (kg)
  age: number;                        // Age (years)
  moreDetails?: string | null;        // MoreDetails
  healthConditions?: string | null;   // HealthConditions
  fixed: boolean;                     // Fixed (neutered)
  favoriteActivities?: string[] | string | null; 
  behavioralTraits?: string[] | string | null;
  rabiesVaccinated: boolean;          // RabiesVaccinated
  createdAt: string;                  // CreatedAt
  gender?: string | null;             // Gender
  

  userName?: string | null;
  userEmail?: string | null;
  imageUrl?: string | null;
  distanceKm?: number | null;
}

export interface Dog {
  id: number;
  ownerId: number;
  name: string;
  breed: string | null;
  size: string;
  weight: number;
  age: number;
  moreDetails: string | null;
  healthConditions: string | null;
  isNeutered: boolean;               // from Fixed
  favoriteActivities?: string[]; 
  behavioralTraits?: string[];     
  vaccinationStatus: boolean;        // from RabiesVaccinated
  createdAt: string;
  gender: string | null;
  latitude: number;    
  longitude: number;

  
  userName: string | null;
  userEmail: string | null;
  imageUrl: string;                  // always safe for <img>
  distanceKm: number;                // safe number
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

export function mapDogDtoToDog(d: DogDto): Dog {
  // --- alias resolution (covers old/new backend shapes) ---
  const name =
    (d as any).name ??
    (d as any).dogName ??
    '';

  const userName =
    (d as any).userName ??
    (d as any).ownerName ??
    null;

  const userEmail =
    (d as any).userEmail ??
    (d as any).ownerEmail ??
    (d as any).email ??
    null;

  const imgRaw =
    (d as any).imageUrl ??
    (d as any).profilePictureUrl ??
    (d as any).profilePicUrl ??
    '';

  const imageUrl =
    typeof imgRaw === 'string' && imgRaw.trim().startsWith('http')
      ? encodeURI(imgRaw)
      : 'assets/images/default-dog.png';

  const favoriteActivities = toStringArray(
    (d as any).favoriteActivities ?? (d as any).FavoriteActivities
  );

  const behavioralTraits = toStringArray(
    (d as any).behavioralTraits ?? (d as any).BehavioralTraits
  );

  const lat =
    (d as any).latitude ?? (d as any).lat ?? 0;

  const lon =
    (d as any).longitude ?? (d as any).lng ?? (d as any).lon ?? 0;

  const distanceKm =
    (d as any).distanceKm ?? (d as any).distance ?? 0;

  return {
    id: (d as any).id ?? (d as any).dogId,
    ownerId: (d as any).userId ?? (d as any).ownerId,
    name,
    breed: (d as any).breed ?? null,
    size: (d as any).size,
    weight: Number.isFinite((d as any).weight) ? (d as any).weight : 0,
    age: Number.isFinite((d as any).age) ? (d as any).age : 0,
    moreDetails: (d as any).moreDetails?.trim?.() ? (d as any).moreDetails : null,
    healthConditions: (d as any).healthConditions?.trim?.() ? (d as any).healthConditions : null,
    isNeutered: !!(d as any).fixed,
    favoriteActivities,
    behavioralTraits,
    vaccinationStatus: !!(d as any).rabiesVaccinated,
    createdAt: (d as any).createdAt ?? '',
    gender: (d as any).gender ?? null,

    latitude: Number(lat) || 0,
    longitude: Number(lon) || 0,

    // card extras
    userName,
    userEmail,
    imageUrl,
    distanceKm
  };
}

export function mapDogs(dtos: DogDto[] = []): Dog[] {
  return dtos.map(mapDogDtoToDog);
}