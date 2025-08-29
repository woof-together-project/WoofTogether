import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapComponent } from '../../shared/map/map.component';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { Dog, DogDto, mapDogs } from './dog-match.model';

@Component({
  selector: 'app-sitters',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapComponent],
  templateUrl: './dog-match.component.html',
  styleUrls: ['./dog-match.component.css']
})
export class DogMatchComponent implements OnInit {
  // static readonly getDogURL =
  //   'https://zdvfdowds6ocbzwuilwrx57due0kxoyl.lambda-url.us-east-1.on.aws/';
   static readonly getDogURL = 'https://nid3kplozsnfhfslq4sq4upqxy0oihwp.lambda-url.us-east-1.on.aws/'; // final user env

  constructor(private http: HttpClient, private userContext: UserContextService) {}

  selectedTab: 'map' | 'criteria' | null = 'map';
  defaultZoom = 13;
  center: google.maps.LatLngLiteral = { lat: 32.0853, lng: 34.7818 }; // default to Tel Aviv for example
  zoomLevel = this.defaultZoom;
  dogs: Dog[] = [];
  loading = false;
  uiMessage: { text: string; type: 'info' | 'warning' | 'error' } | null = null;

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
  selectedBreed: string = 'Any';
  minAge: number = 0;
  maxAge: number = 20;
  minWeight: number = 0;
  maxWeight: number = 100;

  selectedDog: Dog | null = null;
  selectedDogId: number | null = null;

  // Options
  sizeOptions: string[] = ['Any', 'Small', 'Medium', 'Large', 'Giant'];
  breedOptions: string[] = []; // if you populate from backend later

  // City search
  searchCity: string = '';
  allCities: string[] = [];
  filteredCities: string[] = [];
  showSuggestions: boolean = false;
  cityError: string | null = null;

  // Map markers
  markers: { id: number; lat: number; lng: number; label?: string }[] = [];

  // Filters for dog search
  filters = {
    size: 'Any',
    breed: 'Any',
    ageMin: 0,
    ageMax: 20,
    weightMin: 0,
    weightMax: 100,
    vaccinated: null as boolean | null, 
    neutered: null as boolean | null,
    behavioralTraits: [] as string[],
    favoriteActivities: [] as string[]    
  };

  behavioralTraitsOptions: string[] = [
  'Reactive',
  'Aggressive to Other Animals',
  'Aggressive to People',
  'Anxious',
  'Afraid of Men',
  'Afraid of Women',
  'Gets Along with Everyone',
  'Gets Along with People',
  'Gets Along with Other Dogs',
  'Gets Along with Other Animals',
  'Hyper',
  'Chill',
  'Protective',
  'Territorial',
  'Playful',
  'Friendly'
];

favoriteActivitiesOptions: string[] = [
  'Fetching Balls', 'Playing with Toys', 'Running', 'Sleeping', 'Lying in the Sun',
  'Eating', 'Cuddling', 'Traveling', 'Sniffing Everything', 'Swimming',
  'Agility Courses', 'Chasing Squirrels', 'Going to the Park'
];


  async ngOnInit(): Promise<void> {
    try {
      this.location.latitude = 32.0853;
      this.location.longitude = 34.7818;
      this.center = { lat: this.location.latitude, lng: this.location.longitude };
    
      const coords = await this.getCurrentLocation();
      this.location.latitude = coords.latitude;
      this.location.longitude = coords.longitude;
      this.loadDogsByLocation();
    } catch {
      console.error('Could not get user location, falling back to default');
      this.loadDogsByLocation();
    }

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
    const email = this.userContext.getUserEmail(); 

    if (!email) {
      reject(new Error('No email found for current user'));
      return;
    }

    const url = DogMatchComponent.getDogURL;
    this.http.post<{ lat: number; lng: number }>(
      url,   
      {
        action: 'getMyLocation',
        email: email
      }
    ).subscribe({
      next: (res) => {
        resolve({
          latitude: res.lat,
          longitude: res.lng
        });
      },
      error: (err) => {
        console.error('Error loading location from Lambda:', err);
        reject(err);
      }
    });
  });
}


 loadDogsByLocation(): void {
  const url = DogMatchComponent.getDogURL;
  const payload = this.buildFilterPayload();

  this.http.post<DogDto[]>(url, payload).subscribe({
    next: (data) => {
      this.dogs = mapDogs(data).filter(d => (d.userEmail ?? '') !== this.useremail);
      this.updateMarkers();

      this.center = { lat: this.location.latitude, lng: this.location.longitude };
      this.zoomLevel = this.defaultZoom;
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
      Size:
        this.filters.size && this.filters.size !== 'Any'
          ? [String(this.filters.size).toLowerCase()]
          : [],
      Breed:
        this.filters.breed && this.filters.breed !== 'Any'
          ? String(this.filters.breed).toLowerCase()
          : '',

      AgeMin: this.filters.ageMin ?? null,
      AgeMax: this.filters.ageMax ?? null,
      WeightMin: this.filters.weightMin ?? null,
      WeightMax: this.filters.weightMax ?? null,
      RabiesVaccinated: this.filters.vaccinated ?? null,
      Fixed: this.filters.neutered ?? null,
      City: (this.searchCity || '').trim(),
      excludeEmail: this.useremail  || '',
      BehavioralTraits: this.filters.behavioralTraits ?? [],
      FavoriteActivities: this.filters.favoriteActivities ?? [] 
    };
  }

  // updateMarkers() {
  //   this.markers = this.dogs
  //     .filter(d => !!d.latitude && !!d.longitude)
  //     .map(d => ({
  //       id: d.id,
  //       lat: d.latitude!,
  //       lng: d.longitude!,
  //       label: d.name
  //     }));
    
  //   // current user location marker
  //   this.markers.push({
  //     id: -1,
  //     lat: this.location.latitude,
  //     lng: this.location.longitude,
  //     label: 'You'
  //   });
  // }

  updateMarkers(): void {
  const baseMarkers = this.dogs
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({
      id: d.id,
      lat: d.latitude as number,
      lng: d.longitude as number,
      label: d.name
    }));

  const spread = this.distributeOverlappingMarkers(baseMarkers, 20);

  this.markers = [
    ...spread,
    { id: -1, lat: this.location.latitude, lng: this.location.longitude, label: 'You' }
  ];
}


  clearFilters(): void {
    this.filters = {
      size: 'Any',
      breed: 'Any',
      ageMin: 0,
      ageMax: 20,
      weightMin: 0,
      weightMax: 100,
      vaccinated: null,
      neutered: null,
      behavioralTraits: [],
      favoriteActivities: []
    };
    this.loadDogsByLocation();
  }

  applyFilters(): void {
  const url = DogMatchComponent.getDogURL;
  const payload = this.buildFilterPayload();

  this.http.post<DogDto[]>(url, payload).subscribe({
    next: (data) => {
      this.dogs = mapDogs(data).filter(d => (d.userEmail ?? '') !== this.useremail);
      this.updateMarkers();
      this.center = { lat: this.location.latitude, lng: this.location.longitude };
      this.zoomLevel = this.defaultZoom;
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
    this.selectedDog = (this.selectedDog?.id === dog.id) ? null : dog;
  }

  // toggleDogDetails(dogId: number) {
  //   this.selectedDogId = this.selectedDogId === dogId ? null : dogId;
  // }

  toggleDogDetails(dogId: number) {
  if (this.selectedDogId === dogId) {
    // Close card
    this.selectedDogId = null;
  } else {
    // Open card
    this.selectedDogId = dogId;
    const dog = this.dogs.find(d => d.id === dogId);
    if (dog?.latitude && dog?.longitude) {
      this.center = { lat: dog.latitude, lng: dog.longitude };
      this.zoomLevel = 16; // zoom in when card clicked
    }
  }
}


  closeDogDetails() {
    this.selectedDog = null;
  }

  selectTab(tab: 'map' | 'criteria') {
    this.selectedTab = tab;
  }

  // ===== Smart email link =====
  getSmartEmailLink(userEmail: string, ownerEmail: string, ownerName: string): string {
    const subject = encodeURIComponent('Looking for a partner to play with my dog');
    const body = encodeURIComponent(`Hi ${ownerName}, I saw your profile and would love to connect!`);
    const domain = (userEmail || '').split('@')[1]?.toLowerCase() || '';

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

  // ===== geo helpers =====
  withinRadius(s: Dog): boolean {
    const R = 6371;
    const dLat = this.deg2rad((s.latitude ?? 0) - this.location.latitude);
    const dLon = this.deg2rad((s.longitude ?? 0) - this.location.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(this.location.latitude)) *
      Math.cos(this.deg2rad(s.latitude ?? 0)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d <= this.location.radius;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ===== city search =====
  loadCities() {
    if (this.allCities.length === 0) {
      this.http.post<string[]>(DogMatchComponent.getDogURL, {
        action: 'searchAvailableCitiesInDB'
      }).subscribe({
        next: (cities) => {
          this.allCities = cities || [];
          this.filteredCities = [...this.allCities];
          this.showSuggestions = true;
        },
        error: (err) => console.error('Failed to load cities for dogs', err)
      });
    } else {
      this.filteredCities = [...this.allCities];
      this.showSuggestions = true;
    }
  }

  filterCities(): void {
    const q = (this.searchCity || '').toLowerCase();
    this.filteredCities = this.allCities.filter(c => c.toLowerCase().includes(q));
    this.showSuggestions = true;
  }

  onCitySearch(): void {
  const city = (this.searchCity ?? '').trim();

  if (!city) {
    this.uiMessage = null;
    this.selectedTab = 'map';
    this.loadDogsByLocation();
    return;
  }

  this.http.post<DogDto[]>(DogMatchComponent.getDogURL, {
    action: 'searchByCity',
    city,
    latitude: this.location.latitude,
    longitude: this.location.longitude
  }).subscribe({
    next: (dogsRes) => {
      if (!dogsRes || dogsRes.length === 0) {
        this.showUiMessage('warning', `No dogs found in "${city}".`);
        this.selectedTab = 'map';
        this.loadDogsByLocation();
        return;
      }

      this.uiMessage = null;
      this.dogs = mapDogs(dogsRes).filter(d => (d.userEmail ?? '') !== this.useremail);
      this.updateMarkers();
       this.center = { lat: this.location.latitude, lng: this.location.longitude };
      this.zoomLevel = this.defaultZoom;
      this.selectedTab = 'map';
      this.showSuggestions = false;
    },
    error: () => {
      this.showUiMessage('error', `We couldn't search "${city}" right now.`);
      this.selectedTab = 'map';
      this.loadDogsByLocation();
    }
  });
}

private showUiMessage(type: 'info'|'warning'|'error', text: string) {
  this.uiMessage = { type, text };
}

clearMessageOnTyping() {
  if (this.uiMessage) this.uiMessage = null;
}


  selectCity(city: string): void {
    this.searchCity = city;
    this.showSuggestions = false;
  }

  hideSuggestionsWithDelay(): void {
    setTimeout(() => (this.showSuggestions = false), 150);
  }

  clearCitySearch(): void {
    this.searchCity = '';
    this.filteredCities = [...this.allCities];
    this.showSuggestions = false;
    this.uiMessage = null;
    this.selectedTab = 'map';
    this.loadDogsByLocation();
  }

mapOptions: google.maps.MapOptions = {
  gestureHandling: 'greedy',  
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  keyboardShortcuts: false
};

focusOnDog(dog: Dog) {
  if (!dog.latitude || !dog.longitude) return;

  this.location = {
    ...this.location,
    latitude: dog.latitude,
    longitude: dog.longitude
  };

  this.selectedTab = 'map';

  setTimeout(() => {
    document.getElementById('mapElement')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 0);
}


resetMapView() {
  this.center =  { lat: 32.0853, lng: 34.7818 }; // default to Tel Aviv 
  this.zoomLevel = this.defaultZoom;
}

onTraitToggle(trait: string) {
  const list = this.filters.behavioralTraits;
  const i = list.indexOf(trait);
  if (i === -1) list.push(trait);
  else list.splice(i, 1);
}

onActivityToggle(activity: string): void {
  const arr = this.filters.favoriteActivities;
  const i = arr.indexOf(activity);
  if (i > -1) arr.splice(i, 1);
  else arr.push(activity);
}

private metersToDegLat(m: number) { return m / 111_320; }
private metersToDegLng(m: number, atLat: number) {
  return m / (111_320 * Math.cos(atLat * Math.PI / 180));
}

private distributeOverlappingMarkers(
  markers: { id: number; lat: number; lng: number; label?: string }[],
  radiusMeters = 15
) {
  const key = (lat: number, lng: number) => `${lat.toFixed(6)}|${lng.toFixed(6)}`;
  const groups = new Map<string, { id: number; lat: number; lng: number; label?: string }[]>();

  for (const m of markers) {
    const k = key(m.lat, m.lng);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  const spread: typeof markers = [];
  for (const group of groups.values()) {
    if (group.length === 1) { spread.push(group[0]); continue; }

    const centerLat = group[0].lat;
    const centerLng = group[0].lng;
    const dLat = this.metersToDegLat(radiusMeters);
    const dLng = this.metersToDegLng(radiusMeters, centerLat);

    group.forEach((m, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      spread.push({
        ...m,
        lat: centerLat + dLat * Math.sin(angle),
        lng: centerLng + dLng * Math.cos(angle),
      });
    });
  }
  return spread;
}

}
