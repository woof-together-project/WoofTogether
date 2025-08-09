import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapComponent } from '../../shared/map/map.component';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { Dog } from './dog-match.model';

@Component({
  selector: 'app-sitters',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapComponent],
  templateUrl: './dog-match.component.html',
  styleUrls: ['./dog-match.component.css']
})

export class DogMatchComponent implements OnInit {
  static readonly getDogURL = 'https://zdvfdowds6ocbzwuilwrx57due0kxoyl.lambda-url.us-east-1.on.aws/'; //get sitters lambda function URL
  // static readonly getDogURL = ''; //get sitters lambda function URL in final user

  constructor(private http: HttpClient, private userContext: UserContextService) {}

  selectedTab: 'map' | 'criteria' | null = 'map';
  dogs: Dog[] = [];
  loading = false;
  location = {
    latitude: 0,    
    longitude: 0,
    radius: 15           
  };

   useremail: string = '';
  nickname: string = '';
  username: string = '';
  sub: string = '';
  currentUserEmail: string = '';
  disableRadius = true;

  searchDogName: string = '';
  allDogNames: string[] = [];
  filteredDogNames: string[] = [];
  showNameSuggestions: boolean = false;

  selectedSize: string = 'Any';
  selectedTemperaments: string[] = [];
  selectedBreed: string = 'Any';
  minAge: number = 0;
  maxAge: number = 20;
  minWeight: number = 0;
  maxWeight: number = 100;

  selectedDog: Dog | null = null;
  selectedDogId: number | null = null;

  sizeOptions: string[] = ['Small', 'Medium', 'Large', 'Giant'];
  temperamentOptions: string[] = []; // e.g., ['Calm', 'Playful', 'Aggressive']
  breedOptions: string[] = [];       // load dynamically if needed

  markers: { id: number; lat: number; lng: number; label?: string }[] = [];

  // Filters for dog search
  filters = {
    size: 'Any',
    temperaments: [] as string[],
    breed: 'Any',
    ageMin: 0,
    ageMax: 20,
    weightMin: 0,
    weightMax: 100,
    vaccinated: null as boolean | null,
    neutered: null as boolean | null
  };

async ngOnInit(): Promise<void> {
  try {
    const coords = await this.getCurrentLocation();
    this.location.latitude = coords.latitude;
    this.location.longitude = coords.longitude;
    console.log('Location resolved:', coords);
    this.loadDogsByLocation();
  } catch (err) {
    console.error('Could not get user location, falling back to default');
    this.loadDogsByLocation();
  }

  // Dog-specific option lists
  this.temperamentOptions = [
    'Calm', 'Playful', 'Energetic', 'Anxious',
    'Reactive', 'Aggressive to Animals', 'Aggressive to People'
  ];

  this.sizeOptions = ['Any', 'Small', 'Medium', 'Large', 'Giant'];
  this.userContext.getUserObservable().subscribe(currentUser => {
    this.useremail = currentUser?.email ?? '';
    this.username = currentUser?.username ?? '';
    this.nickname = currentUser?.nickname ?? '';
    this.sub = currentUser?.sub ?? '';
    this.currentUserEmail = this.useremail || 'daniella@gmail.com';
  });
}

getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        reject(error);
      },
    );
  });
}

loadDogsByLocation(): void {
  const url = DogMatchComponent.getDogURL;
  const payload = this.buildFilterPayload();
  console.log('Loading dogs with payload:', payload);

  this.http.post<Dog[]>(url, payload).subscribe({
    next: (data) => {
      this.dogs = data
        .filter(dog => (dog.userEmail ?? (dog as any).email) !== this.useremail)
        .map(dog => {
          const rawImg =
            (dog as any).profilePictureUrl ??
            (dog as any).imageUrl ??
            '';
          const imageUrl =
            typeof rawImg === 'string' &&
            rawImg.trim() !== '' &&
            rawImg.startsWith('http')
              ? encodeURI(rawImg)
              : 'assets/images/default-dog.png';

           return {
      ...dog,
      id: (dog as any).id ?? (dog as any).dogId,
      name: (dog as any).name ?? (dog as any).dogName,
      userName: (dog as any).userName ?? (dog as any).ownerName,
      userId: (dog as any).userId ?? (dog as any).ownerId,
      userEmail: (dog as any).userEmail ?? (dog as any).ownerEmail ?? (dog as any).email,
      imageUrl
    };
        });

      console.log('Dogs loaded:', this.dogs);
      this.updateMarkers();
    },
    error: (err) => console.error('Failed to fetch dogs:', err)
  });
}

buildFilterPayload() {
  return {
    action: 'filterDogsByCriteria',
    latitude: this.location.latitude,
    longitude: this.location.longitude,
    radius: this.location.radius,
    noRadiusFilter: this.disableRadius,

    size: this.filters.size,                       // e.g. 'Small', 'Medium', 'Large'
    temperaments: this.filters.temperaments,       // array of temperament strings
    breed: this.filters.breed,                     // breed name or 'Any'
    ageMin: this.filters.ageMin,
    ageMax: this.filters.ageMax,
    weightMin: this.filters.weightMin,
    weightMax: this.filters.weightMax,
    vaccinated: this.filters.vaccinated,           // true, false, or null
    neutered: this.filters.neutered                // true, false, or null
  };
}

updateMarkers() { 
  this.markers = this.dogs
    .filter(d => d.latitude !== 0 && d.longitude !== 0) 
    .map(d => ({
      id: d.id, // dog's ID
      lat: d.latitude!,
      lng: d.longitude!,
      label: d.name // dog's name
    }));
  
  // Add current user location marker
  this.markers.push({
    id: -1, // Unique ID for the user marker
    lat: this.location.latitude,
    lng: this.location.longitude,
    label: 'You'
  });

  console.log("Dog markers created:", this.markers); 
}

clearFilters(): void {
  this.filters = {
    size: 'Any',
    temperaments: [],
    breed: 'Any',
    ageMin: 0,
    ageMax: 20,
    weightMin: 0,
    weightMax: 100,
    vaccinated: null,
    neutered: null
  };
  this.loadDogsByLocation();  
  }

  applyFilters(): void {
  const url = DogMatchComponent.getDogURL; 
  const payload = this.buildFilterPayload(); 
  console.log("✅ Dog filter payload:", payload);
  
  this.http.post<Dog[]>(url, payload).subscribe({
    next: (data) => {
      this.dogs = data.map(dog => ({
        ...dog,
        imageUrl: dog.profilePictureUrl
          ? encodeURI(dog.profilePictureUrl)
          : 'assets/images/default-dog.png'
      }));
      
      this.updateMarkers();
      this.selectedTab = 'map';        
    },
    error: (err) => console.error('Dog filter request failed', err)
  });
}

onMarkerSelected(dogId: number) {
  this.selectedDog = this.dogs.find(d => d.id === dogId) || null;
  this.selectedDogId = dogId;
}

onSelectDog(dog: Dog) {
  if (this.selectedDog?.id === dog.id) {
    this.selectedDog = null;
  } else {
    this.selectedDog = dog;
  }
}

toggleDogDetails(dogId: number) {
  this.selectedDogId = this.selectedDogId === dogId ? null : dogId;
}

closeDogDetails() {
  this.selectedDog = null;
}

selectTab(tab: 'map' | 'criteria') {
  this.selectedTab = tab;
}

onTemperamentChange(event: any) {
  const value = event.target.value;
  if (event.target.checked) {
    this.filters.temperaments.push(value);
  } else {
    this.filters.temperaments = this.filters.temperaments.filter(v => v !== value);
  }
}

getSmartEmailLink(userEmail: string, ownerEmail: string, ownerName: string): string {
    const subject = encodeURIComponent('Looking for a parther to play with my dog');
    const body = encodeURIComponent(`Hi ${ownerName}, I saw your profile and would love to connect!`);

    const domain = userEmail.split('@')[1].toLowerCase();

    if (domain.includes('gmail.com')) {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${ownerEmail}&su=${subject}&body=${body}`;
    }

    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      return `https://outlook.live.com/mail/deeplink/compose?to=${ownerEmail}&subject=${subject}&body=${body}`;
    }

    if (domain.includes('yahoo.com')) {
      return `https://compose.mail.yahoo.com/?to=${ownerEmail}&subject=${subject}&body=${body}`;
    }

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${ownerEmail}&su=${subject}&body=${body}`;
  }

withinRadius(s: Dog): boolean {
    const R = 6371;
    const dLat = this.deg2rad(s.latitude! - this.location.latitude);
    const dLon = this.deg2rad(s.longitude! - this.location.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(this.location.latitude)) *
      Math.cos(this.deg2rad(s.latitude!)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d <= this.location.radius;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
}
