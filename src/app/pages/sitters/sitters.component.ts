import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sitter } from './sitter.model';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapComponent } from '../../shared/map/map.component';

@Component({
  selector: 'app-sitters',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapComponent],
  templateUrl: './sitters.component.html',
  styleUrls: ['./sitters.component.css']
})

export class SittersComponent implements OnInit {
  constructor(private http: HttpClient) {}

  selectedTab: 'map' | 'criteria' | null = 'map';
  sitters: Sitter[] = [];
  loading = false;
  location = {
    latitude: 0,    
    longitude: 0,
    radius: 15           
  };

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

  filters = {
    servicesSelected: [] as string[],
    gender: 'Any',
    rateMax: 150,
    experiencedWith: [] as string[]
  };


  async ngOnInit(): Promise<void> {
  try {
    const coords = await this.getCurrentLocation();
    this.location.latitude = coords.latitude;
    this.location.longitude = coords.longitude;
    console.log('Location resolved:', coords);
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
      {
        timeout: 10000,
        enableHighAccuracy: true
      }
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

  clearFilters(): void {
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

    this.loadSittersByLocation();
  }

  applyFilters(): void {
    const url = 'https://axqbyybq2e7zxh6t56uvfn2qcu0ynmmp.lambda-url.us-east-1.on.aws/';
    const payload = this.buildFilterPayload(); 
    
    this.http.post<Sitter[]>(url, payload).subscribe({
      next: (data) => {
        this.sitters = data;          
        this.updateMarkers();        
      },
      error: (err) => console.error('Filter request failed', err)
    });
  }

  currentUserEmail = 'daniella@gmail.com';

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
    const url = 'https://axqbyybq2e7zxh6t56uvfn2qcu0ynmmp.lambda-url.us-east-1.on.aws/';
    const payload = this.buildFilterPayload();

    this.http.post<Sitter[]>(url, payload).subscribe({
      next: (data) => {
        this.sitters = data;
        console.log("✅ Sitters loaded:", this.sitters);
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
    this.selectedSitter = this.sitters.find(s => s.sitterId === sitterId) || null;
    this.selectedSitterId = sitterId;
  }

  buildFilterPayload() {
    return {
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
}