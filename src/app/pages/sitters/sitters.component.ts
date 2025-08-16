import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sitter } from './sitter.model';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapComponent } from '../../shared/map/map.component';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';

@Component({
  selector: 'app-sitters',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapComponent],
  templateUrl: './sitters.component.html',
  styleUrls: ['./sitters.component.css']
})

export class SittersComponent implements OnInit {
  static readonly getSittersUrl = 'https://5zhpsv4mgumqdxkzbwqfisqnba0xkzkm.lambda-url.us-east-1.on.aws/'; //get sitters lambda function URL
  // static readonly getSittersUrl = 'https://vj7lapeqfmnbf4fn75tc5m6zn40fpqyl.lambda-url.us-east-1.on.aws/'; //get sitters lambda function URL in final user

  constructor(private http: HttpClient, private userContext: UserContextService) {}

  selectedTab: 'map' | 'criteria' | null = 'map';
  sitters: Sitter[] = [];
  loading = false;
  location = {
    latitude: 0,    
    longitude: 0,
    radius: 15           
  };

   //cognito data
  useremail: string = '';
  nickname: string = '';
  username: string = '';
  sub: string = '';

  searchCity: string = '';
  allCities: string[] = [];
  filteredCities: string[] = [];
  showSuggestions: boolean = false;
  disableRadius = true;
  selectedServiceOptions: string[] = [];
  selectedDogTypes: string[] = [];
  selectedGender: string = "any";
  minRate: number = 0;
  maxRate: number = 150;
  selectedSitter: Sitter | null = null;
  selectedSitterId: number | null = null;
  experienceWithOptions: string[] = [];
  serviceOptions: string[] = [];
  genderOptions: string[] = ['Any', 'Female', 'Male'];
  markers: { id: number; lat: number; lng: number; label?: string }[] = [];
  cityError: string | null = null;

  // ===== Reviews Part =====
showReviewModal = false;           // For reviews list modal
showAddReviewModal = false;        // For add review modal
reviewsLoading = false;
reviewSubmitting = false;
modalSitter: any | null = null;

reviews: Array<{
  id: number;
  sitterId: number;
  userId: number;
  rating: number;
  comment: string;
  reviewDate: string;
}> = [];

reviewsAverage = 0;
reviewsCount = 0;
newReview = { rating: 5, comment: '' };
@ViewChild('addReviewForm') addReviewForm!: ElementRef;
@ViewChild('reviewModalBody') reviewModalBody!: ElementRef;


  filters = {
    servicesSelected: [] as string[],
    gender: 'Any',
    rateMax: 150,
    experiencedWith: [] as string[]
  };

  currentUserEmail: string = '';
  defaultZoom = 13;
  zoom = this.defaultZoom;
  center = { lat: this.location.latitude, lng: this.location.longitude };

  async ngOnInit(): Promise<void> {
  try {
    const coords = await this.getCurrentLocation();
    this.location.latitude = coords.latitude;
    this.location.longitude = coords.longitude;
    console.log('Location resolved:', coords);
    this.center = { lat: this.location.latitude, lng: this.location.longitude };
    this.zoom = this.defaultZoom;

    this.loadSittersByLocation();

  } catch (err) {
    console.error('Could not get user location, falling back to default');
    this.loadSittersByLocation();
  }

  this.experienceWithOptions = [
    'Elder Dogs', 'Young Dogs', 'Cubs',
    'Reactive Dogs', 'Aggressive to Other Animals',
    'Aggressive to People', 'Anxious Dogs',
    'Big Dogs', 'Small Dogs'
  ];

  this.serviceOptions = ['Dog-Sitting', 'Dog-Walking', 'Dog-Boarding'];

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

  onSelectSitter(sitter: Sitter) {
    if (this.selectedSitter?.sitterId === sitter.sitterId) {
      this.selectedSitter = null;
    } else {
      this.selectedSitter = sitter;
    }
  }

  toggleSitterDetails(sitterId: number) {
    this.selectedSitterId = this.selectedSitterId === sitterId ? null : sitterId;
  }

  closeSitterDetails() {
    this.selectedSitter = null;
  }

  selectTab(tab: 'map' | 'criteria') {
    this.selectedTab = tab;
  }

  onServiceOptionChange(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      this.selectedServiceOptions.push(value);
    } else {
      this.selectedServiceOptions = this.selectedServiceOptions.filter(v => v !== value);
    }
  }

  onExperienceChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const value = checkbox.value;

    if (checkbox.checked) {
      if (!this.filters.experiencedWith.includes(value)) {
        this.filters.experiencedWith.push(value);
      }
    } else {
      this.filters.experiencedWith = this.filters.experiencedWith.filter(
        (v) => v !== value
      );
    }
  }

  clearFilters(shouldReload: boolean = true): void {
  this.filters = {
    servicesSelected: [],
    gender: 'Any',
    rateMax: 150,
    experiencedWith: []
  };
  this.selectedServiceOptions = [];
  this.selectedDogTypes = [];
  this.selectedGender = 'any';
  this.disableRadius = true;
  this.minRate = 0;
  this.maxRate = 150;

  if (shouldReload) {
    this.loadSittersByLocation();
  }
}

  applyFilters(): void {
    const url = SittersComponent.getSittersUrl; 
    const payload = this.buildFilterPayload(); 
    console.log("✅ Filter payload:", payload);
    
    this.http.post<Sitter[]>(url, payload).subscribe({
      next: (data) => {
        //this.sitters = data;     
       this.sitters = data.map(sitter => ({
        ...sitter,
        imageUrl: sitter.profilePictureUrl ? encodeURI(sitter.profilePictureUrl) : 'assets/images/default-profile.png'
      }));
   
        this.updateMarkers();
        this.selectedTab = 'map';        
      },
      error: (err) => console.error('Filter request failed', err)
    });
  }
  
  getSmartEmailLink(userEmail: string, sitterEmail: string, sitterName: string): string {
    const subject = encodeURIComponent('Looking for a dog sitter');
    const body = encodeURIComponent(`Hi ${sitterName}, I saw your profile and would love to connect!`);

    const domain = userEmail.split('@')[1].toLowerCase();

    if (domain.includes('gmail.com')) {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${sitterEmail}&su=${subject}&body=${body}`;
    }

    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      return `https://outlook.live.com/mail/deeplink/compose?to=${sitterEmail}&subject=${subject}&body=${body}`;
    }

    if (domain.includes('yahoo.com')) {
      return `https://compose.mail.yahoo.com/?to=${sitterEmail}&subject=${subject}&body=${body}`;
    }

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${sitterEmail}&su=${subject}&body=${body}`;
  }

  loadSittersByLocation(): void {
  const url = SittersComponent.getSittersUrl;
  const payload = this.buildFilterPayload();
  console.log("✅ Loading sitters with payload:", payload);

  this.http.post<Sitter[]>(url, payload).subscribe({
    next: (data) => {
      this.sitters = data
  .filter(sitter => sitter.email !== this.useremail)
  .map(sitter => {
      const imageUrl = sitter.profilePictureUrl &&
                      sitter.profilePictureUrl.trim() !== '' &&
                      sitter.profilePictureUrl.startsWith('http')
        ? encodeURI(sitter.profilePictureUrl)
        : 'assets/images/default-profile.png';

      return {
        ...sitter,
        imageUrl: imageUrl,
        reviewCount: sitter.reviewCount ?? 0,        
        averageRating: sitter.averageRating ?? 0
      };
    });
      console.log("Sitters loaded:", this.sitters);
      this.updateMarkers();
    },
    error: (err) => console.error('Failed to fetch sitters:', err)
  });
}


  updateMarkers() {
    this.markers = this.sitters
      .filter(s => s.latitude !== 0 && s.longitude !== 0) 
      .map(s => ({
        id: s.sitterId, 
        lat: s.latitude!,
        lng: s.longitude!,
        label: s.name
      }));
    
    this.markers.push({
      id: -1, // Unique ID
      lat: this.location.latitude,
      lng: this.location.longitude,
      label: 'You' 
  });

    console.log("✅ Markers created:", this.markers); 
  }

  withinRadius(s: Sitter): boolean {
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

  onMarkerSelected(sitterId: number) {
  const m = this.markers.find(x => x.id === sitterId);
  if (!m) return;

  this.setMapView(m.lat, m.lng, 16);

  // open the sitter card
  const s = this.sitters.find(si => si.sitterId === sitterId);
  if (s) this.selectedSitterId = s.sitterId;

  this.selectedSitter = s || null;   // if you have selectedSitter property
}

private setMapView(lat: number, lng: number, zoom: number) {
  this.center = { lat, lng };  // new object triggers change detection
  this.zoom = zoom;
}


  buildFilterPayload() {
    return {
      action: 'filterByCriteria',
      latitude: this.location.latitude,
      longitude: this.location.longitude,
      radius: this.location.radius,
      noRadiusFilter: this.disableRadius,
      maxRate: this.filters.rateMax,
      sitterGender: this.selectedGender,
      experienceTypes: this.filters.experiencedWith,
      serviceOptions: this.selectedServiceOptions
    };
  }

  loadCities() {
  if (this.allCities.length === 0) {
    this.http.post<string[]>(SittersComponent.getSittersUrl, {
      action: 'searchAvailableCitiesInDB'
    }).subscribe({
      next: (cities) => {
        this.allCities = cities;
        this.filteredCities = [...cities];
        this.showSuggestions = true;
      },
      error: (err) => console.error('Failed to load cities', err)
    });
  } else {
    this.filteredCities = [...this.allCities];
    this.showSuggestions = true;
  }
}

filterCities(): void {
  const query = this.searchCity.toLowerCase();
  this.filteredCities = this.allCities.filter(city =>
    city.toLowerCase().includes(query)
  );
  this.showSuggestions = true;
}


// onCitySearch() {
//   const city = this.searchCity.trim();
//   if (!city) return;

//   this.http.post<any[]>(SittersComponent.getSittersUrl , {
//     action: 'searchByCity',
//     city: city,
//     latitude: this.location.latitude,
//     longitude: this.location.longitude
//   }).subscribe({
//     next: (sittersRes) => {
//       if (sittersRes.length === 0) {
//         alert(`No sitters found in "${city}"`);
//       }
//       this.clearFilters(false); // Clear filters but don't reload sitters
//       this.sitters = sittersRes;
//       this.updateMarkers();
//       this.selectedTab = 'map';
//     },
//     error: (err) => console.error('Failed to search sitters by city', err)
//   });
// }

onCitySearch(): void {
  const city = (this.searchCity || '').trim();
  if (!city) return;

  this.http.post<any[]>(SittersComponent.getSittersUrl, {
    action: 'searchByCity',
    city,
    latitude: this.location.latitude,
    longitude: this.location.longitude
  }).subscribe({
    next: (sittersRes) => {
      if (!sittersRes || sittersRes.length === 0) {
        // show error banner
        this.cityError = `No sitters found in "${city}". Showing all nearby sitters.`;
        console.log('[CitySearch] no results -> show error');

        // let Angular render it before clearing
        setTimeout(() => {
          this.searchCity = '';
          this.filteredCities = [...this.allCities];
          this.showSuggestions = false;
          this.loadSittersByLocation(); // reload full list
          this.cityError = null;
        }, 2000);
        return;
      }

      // success case
      this.cityError = null;
      this.clearFilters(false); // keep filters cleared, don't reload sitters
      this.sitters = sittersRes.map(sitter => ({
        ...sitter,
        imageUrl: sitter.profilePictureUrl
          ? encodeURI(sitter.profilePictureUrl)
          : 'assets/images/default-profile.png'
      }));
      this.updateMarkers();
      this.selectedTab = 'map';
      this.showSuggestions = false;
    },
    error: (err) => {
      console.error('Failed to search sitters by city', err);
      this.cityError = 'Something went wrong searching that city. Showing all nearby sitters.';
      setTimeout(() => {
        this.searchCity = '';
        this.filteredCities = [...this.allCities];
        this.showSuggestions = false;
        this.loadSittersByLocation();
        this.cityError = null;
      }, 2000);
    }
  });
}
selectCity(city: string): void {
  this.searchCity = city;
  this.showSuggestions = false;
}

hideSuggestionsWithDelay(): void {
  setTimeout(() => {
    this.showSuggestions = false;
  }, 150); // short delay to allow click to register
}

clearCitySearch(): void {
  this.searchCity = '';
  this.filteredCities = [...this.allCities];
  this.showSuggestions = false;
  this.clearFilters(true); 
}


// --- Functions ---
openReviews(sitter: any) {
  this.modalSitter = sitter;
  this.showReviewModal = true;
  this.loadReviews(sitter.sitterId);
}

closeReviews() {
  this.showReviewModal = false;
}

openAddReview() {
  this.showAddReviewModal = true;
}

closeAddReview() {
  this.showAddReviewModal = false;
}

loadReviews(sitterId: number) {
  this.reviewsLoading = true;

  this.http.post<any>(SittersComponent.getSittersUrl, {
    action: 'getReviews',
    sitterId: sitterId
  }).subscribe({
    next: (data) => {
      this.reviews = data.reviews;
      this.reviewsAverage = data.average;
      this.reviewsCount = data.count;

      if (this.modalSitter) {
        this.modalSitter.reviewCount = data.count;
      }

      this.reviewsLoading = false;
    },
    error: (err) => {
      console.error('Failed to load reviews:', err);
      this.reviewsLoading = false;
    }
  });
}

submitReview() {
  if (!this.modalSitter) return;

  this.reviewSubmitting = true;

  this.http.post<any>(SittersComponent.getSittersUrl, {
    action: 'addReview',
    sitterId: this.modalSitter.sitterId,
    userEmail: this.currentUserEmail,
    rating: this.newReview.rating,
    comment: this.newReview.comment
  }).subscribe({
    next: (data) => {
      this.reviews = data.reviews;
      this.reviewsAverage = data.average;
      this.reviewsCount = data.count;

      this.modalSitter.reviewCount = data.count;
      this.modalSitter.averageRating = data.average;

      this.newReview = { rating: 5, comment: '' };
      this.reviewSubmitting = false;
      this.showAddReviewModal = false;

      console.log("✅ Review added successfully");
    },
    error: (err) => {
      console.error('Failed to submit review:', err);
      this.reviewSubmitting = false;
    }
  });
}

 resetMapView(): void {
    this.center = { lat: this.location.latitude, lng: this.location.longitude };
    this.zoom = this.defaultZoom;
  }

  focusOnSitter(sitter: Sitter): void {
  // try coordinates on the sitter first
  let lat = sitter.latitude ?? sitter.latitude ?? null;
  let lng = sitter.longitude ?? sitter.longitude ?? null;

  // fallback: find the sitter's marker (you said marker.id === sitterId)
  if (lat == null || lng == null) {
    const m = this.markers.find(mm => mm.id === sitter.sitterId);
    if (m) { lat = m.lat; lng = m.lng; }
  }

  if (lat == null || lng == null) return;

  this.location = {
    ...this.location,
    latitude: lat,
    longitude: lng
  };

  this.selectedTab = 'map';
  this.zoom = 16;

  setTimeout(() => {
    document.getElementById('mapElement')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 0);
}

}