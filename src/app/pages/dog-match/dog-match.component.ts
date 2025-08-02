// dog-matcher.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapComponent } from '../../shared/map/map.component';

interface Dog {
  id: number;
  name: string;
  breed: string;
  description: string;
  imageUrl: string;
  distanceKm: number;
  temperament: string;
  vaccinationStatus: string;
  age: number;
}

@Component({
  selector: 'app-dog-match',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapComponent],
  templateUrl:'./dog-match.component.html',
  styleUrls: ['./dog-match.component.css']
})
export class DogMatchComponent {
  dogs: Dog[] = [
    {
      id: 1,
      name: 'Buddy',
      breed: 'Golden Retriever',
      description: 'Friendly and energetic, loves to play fetch.',
      imageUrl: 'assets/images/dog1.jpg',
      distanceKm: 5,
      temperament: 'Friendly',
      vaccinationStatus: 'Up-to-date',
      age: 3
    },
    {
      id: 2,
      name: 'Max',
      breed: 'Beagle',
      description: 'Curious and playful, enjoys long walks.',
      imageUrl: 'assets/images/dog2.jpg',
      distanceKm: 10,
      temperament: 'Playful',
      vaccinationStatus: 'Up-to-date',
      age: 2
    }
  ]; 
   filters = {
    rateMax: 150,
    experiencedWith: [] as string[]
  };

  searchCity = '';
  showSuggestions = false;
  filteredCities: string[] = [];
  selectedDogId: number | null = null;
  location = { latitude: 32.0853, longitude: 34.7818, radius: 10 };
  disableRadius = false;
  selectedTab = 'map';
  currentUserEmail = 'user@example.com';
  cities: string[] = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat'];
  markers: { id: number; lat: number; lng: number; label?: string }[] = [];
  selectedGender: string = 'any';
  serviceOptions: string[] = ['Walking', 'Feeding', 'Playtime', 'Training'];
  selectedServiceOptions: string[] = [];
  toggleDogDetails(dogId: number) {
    this.selectedDogId = this.selectedDogId === dogId ? null : dogId;
  }

onServiceOptionChange(event: Event): void {
  const checkbox = event.target as HTMLInputElement;
  const value = checkbox.value;

  if (checkbox.checked) {
    if (!this.selectedServiceOptions.includes(value)) {
      this.selectedServiceOptions.push(value);
    }
  } else {
    this.selectedServiceOptions = this.selectedServiceOptions.filter(option => option !== value);
  }
}


  loadCities() {
    this.filteredCities = [...this.cities];
    this.showSuggestions = true;
  }


  filterCities() {
    const term = this.searchCity.toLowerCase();
    this.filteredCities = this.cities.filter(city =>
      city.toLowerCase().includes(term)
    );
  }

  hideSuggestionsWithDelay() {
    setTimeout(() => this.showSuggestions = false, 150);
  }

  selectCity(city: string) {
    this.searchCity = city;
    this.showSuggestions = false;
    // simulate filtering dogs by city
  }

  onCitySearch() {
    console.log('Search triggered for:', this.searchCity);
  }

  clearCitySearch() {
    this.searchCity = '';
    this.filteredCities = [];
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

   clearFilters(): void {
    this.filters = {
      rateMax: 150,
      experiencedWith: []
    };
    console.log('Filters cleared');
  }
  getSmartEmailLink(senderEmail: string, recipientEmail: string, recipientName: string): string {
    const subject = encodeURIComponent(`Hi ${recipientName}, I'm interested in adopting!`);
    const body = encodeURIComponent(`Hi ${recipientName},\n\nI saw your profile and would love to get in touch.`);
    return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  }

  onMarkerSelected(marker: any) {
    console.log('Map marker clicked:', marker);
  }

  applyFilters(): void {
  console.log('Filters applied:', {
    rateMax: this.filters.rateMax,
    selectedGender: this.selectedGender,
    selectedServiceOptions: this.selectedServiceOptions,
    radius: this.location.radius,
    city: this.searchCity
  });

}

}
