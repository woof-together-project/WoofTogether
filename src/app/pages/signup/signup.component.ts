import { Component, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { PlacesService } from '../../shared/map/places/PlacesService';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

  type AddressComponent = { long_name: string; short_name: string; types: string[] };
  type ViewportA = { south: number; west: number; north: number; east: number };
  type ViewportB = { southwest: { lat: number; lng: number }, northeast: { lat: number; lng: number } };

  export interface PlaceDetails {
  lat: number;
  lng: number;
  formatted_address: string;
  name: string;
  place_id: string;
  address_components?: AddressComponent[];             
  geometry?: { viewport?: ViewportA | ViewportB };      
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})

export class SignupComponent {
 // static readonly signupURL =  'https://eu2okj2maowkb7rrlnqmtnmfru0nvaif.lambda-url.us-east-1.on.aws/'; //signup lambda function URL
  //static readonly uploadProfilePicURL = 'https://gmnmxjlmg5nwmqhs6nz7riribu0sukcb.lambda-url.us-east-1.on.aws/'; //s3 upload lambda function URL
   static readonly signupURL =  'https://2p6gr6ezoopfvhdhklwmiipxca0yvhpn.lambda-url.us-east-1.on.aws/'; //signup lambda function URL in final user
   static readonly uploadProfilePicURL = 'https://mec7bs3xaigxfcycy4h3alpfmy0tagat.lambda-url.us-east-1.on.aws/'; //s3 upload lambda function URL
  constructor(private http: HttpClient, private userContext: UserContextService,
        private snackBar: MatSnackBar,  private navigationService: NavigationService, private places: PlacesService
) {}

  //cognito data
  email: string = '';
  nickname: string = '';
  username: string = '';
  sub: string = '';

  // genetal data
  phone: string = '';
  city: string = '';
  street: string = '';
  profilePic: string = ''; // Note: for real upload you'll need FileReader or FormData
  profilePicFile: File | null = null; // Store the file object for upload

  // sitter data
  rate: number | null = null;
  availability: string = '';
  sitterBio: string = '';
  experience: string = '';
  gender: string = '';
  selectedSitterExperience: string[] = [];
  selectedSitterServices: string[] = [];
  
  // dog data
  dogs: any[] = [
  { name: '', breed: '', gender: '', imageUrl: '' , fixed: '', size: '', weight: null, age: null, rabiesVaccinated: '', behavioralTraits: [], favoriteActivities: [], health: '', moreDetails: '' }
  ];

  showGeneralInfo: boolean = true;
  showSitterSection: boolean = false;
  showDogSections: boolean[] = [true];
  showDogCard: boolean[] = [true]; // One boolean per dog
  sitterCardOpen = true;
  isSitter: boolean = false;
  addDog: boolean = false;

  currentSitterPage: number = 0; // 0 = About Me, 1 = Experience, etc.
  currentDogPage: number[] = [0]; // One page index per dog
  sitterImageUrl: string = '';
  sitterImageFile: File | null = null;
  experienceWithOptions = [
  'Elder Dogs', 'Young Dogs', 'Cubs', 'Reactive Dogs',
  'Aggressive to Other Animals', 'Aggressive to People',
  'Anxious Dogs', 'Big Dogs', 'Small Dogs'
  ];

  serviceOptions = ['Dog-Sitting', 'Dog-Walking', 'Dog-Boarding'];

  behavioralTraitsList: string[] = [
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
    'Friendly',
  ];

  favoriteActivitiesList: string[] = [
    'Fetching Balls',
    'Playing with Toys',
    'Running',
    'Sleeping',
    'Lying in the Sun',
    'Eating',
    'Cuddling',
    'Traveling',
    'Sniffing Everything',
    'Swimming',
    'Agility Courses',
    'Chasing Squirrels',
    'Going to the Park'
  ];

  private placesToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  cityQuery$ = new Subject<string>();
  addressQuery$ = new Subject<string>();
  citySuggestions: { description: string; place_id: string }[] = [];
  addressSuggestions: { description: string; place_id: string }[] = [];

  cityCenter: { lat: number; lng: number } | null = null;
  cityName: string | null = null;
  cityRect: { sw: { lat: number; lng: number }, ne: { lat: number; lng: number } } | null = null;
  cityActiveIndex = 0;
  addressActiveIndex = 0;


  toggleSitterCard() {
    this.sitterCardOpen = !this.sitterCardOpen;
  }

  addAnotherDog() {
    this.dogs.push({
      name: '',
      breed: '',
      gender: '',
      fixed: '',
      size: '',
      weight: null,
      rabiesVaccinated: '',
      behavioralTraits: [],
      favoriteActivities: [],
      health: '',
      moreDetails: '',
      imageUrl: '' 
    });
    this.currentDogPage.push(0);
    this.showDogSections.push(true);
    this.showDogCard.push(true);
  }

  ngOnInit() {
    this.userContext.getUserObservable().subscribe(currentUser => {
    this.email = currentUser?.email ?? '';
    this.username = currentUser?.username ?? '';
    this.nickname = currentUser?.nickname ?? '';
    this.sub = currentUser?.sub ?? '';
  });

   this.cityQuery$
    .pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(q => this.places.autocomplete(q, this.placesToken, 'city'))
    )
    .subscribe({
      next: res => { this.citySuggestions = res.predictions; },
      error: err => { console.error('[CITY AUTOCOMPLETE] HTTP error', err); }
    });

  this.addressQuery$
  .pipe(
    debounceTime(200),
    distinctUntilChanged(),
    switchMap(q => this.places.autocomplete(
      q,
      this.placesToken,
      'address',
      {
        cityCenter: this.cityCenter ?? undefined,
        cityRect: this.cityRect ?? undefined,   
        cityName: this.cityName ?? undefined    
      }
    ))
  )
  .subscribe(res => this.addressSuggestions = res.predictions);

}

  removeDog(index: number) {
    this.dogs.splice(index, 1);
  }

  onSitterExperienceChange(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      this.selectedSitterExperience.push(value);
    } else {
      this.selectedSitterExperience = this.selectedSitterExperience.filter(v => v !== value);
    }
  }

  onSitterServiceChange(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      this.selectedSitterServices.push(value);
    } else {
      this.selectedSitterServices = this.selectedSitterServices.filter(v => v !== value);
    }
  }

  onBehavioralTraitChange(event: any, index: number) {
    const value = event.target.value;
    if (event.target.checked) {
      this.dogs[index].behavioralTraits.push(value);
    } else {
      this.dogs[index].behavioralTraits = this.dogs[index].behavioralTraits.filter((trait: string) => trait !== value);
    }
  }

  onFavoriteActivityChange(event: any, index: number) {
    const value = event.target.value;
    if (event.target.checked) {
      this.dogs[index].favoriteActivities.push(value);
    } else {
      this.dogs[index].favoriteActivities = this.dogs[index].favoriteActivities.filter((activity: string) => activity !== value);
    }
  }

  nextSitterPage() {
    this.currentSitterPage++;
  }

  previousSitterPage() {
    if (this.currentSitterPage > 0) {
      this.currentSitterPage--;
    }
  }

  // Example for dogs:
  nextDogPage(index: number) {
    this.currentDogPage[index]++;
  }

  previousDogPage(index: number) {
    if (this.currentDogPage[index] > 0) {
      this.currentDogPage[index]--;
    }
  }

  onCheckboxChange() {
    if (this.isSitter || this.addDog) {
      this.showGeneralInfo = false;
    }

    if (this.addDog && this.showDogSections.length !== this.dogs.length) {
      this.showDogSections = this.dogs.map(() => true);
    }

    if (this.addDog) {
      this.showDogSections = this.dogs.map(() => true);
    }
  }

 submitForm() {
  const signupData = this.prepareSignupData();
  const payload = {
    email: this.email,
    signupData: signupData
  };

  this.http.post<{ isComplete: boolean, success: boolean, message?: string }>(
    SignupComponent.signupURL, payload
  ).subscribe({
    next: res => {
      if (res.success && res.isComplete) {
        this.userContext.setUserCompleteStatus(true);
        this.snackBar.open('Signup successful!', 'Close', { duration: 1500 });
        setTimeout(() => this.navigationService.requestHomeRedirect(), 1500);
      } else {
        this.snackBar.open(res?.message || 'You must complete the signup before submitting.', 'Close', {
          duration: 2500
        });
      }
    },
    error: err => {
      console.error('Signup failed:', err);
      this.snackBar.open('Signup failed. Please try again.', 'Close', { duration: 2000 });
    }
  });
}


  // this.http.post<{ isComplete: boolean }>(SignupComponent.signupURL, payload)
  //   .subscribe({
  //     next: res => {
  //       console.log('Submitted successfully:', res);
  //       this.userContext.setUserCompleteStatus(res?.isComplete === true);
  //       //this.userContext.setUserCompleteStatus(true);
  //       this.snackBar.open('Signup successful!', 'Close', {
  //         duration: 1500
  //       });

  //       setTimeout(() => {
  //       this.navigationService.requestHomeRedirect();
  //       }, 1500);

  //     },
  //     error: err => {
  //       console.error('Submission failed:', err);
  //       this.snackBar.open('Signup failed. Please try again.', 'Close', {
  //         duration: 1500
  //       });
  //     }
  //   });



  prepareSignupData() {
    return {
      phone: this.phone,
      city: this.city,
      street: this.street,
      //profilePic: this.profilePic, // for now just the file name or base64 if needed
      isSitter: this.isSitter,
      addDog: this.addDog,
      sitterDetails: this.isSitter ? {
        gender: this.gender,
        bio: this.sitterBio,
        experience: this.experience,
        rate: this.rate,
        availability: this.availability,
        experienceWith: this.selectedSitterExperience,
        services: this.selectedSitterServices,
        imageUrl: this.sitterImageUrl 
      } : null,
      dogs: this.addDog ? this.dogs.map(d => ({
        name: d.name,
        breed: d.breed,
        gender: d.gender,
        size: d.size,
        weight: d.weight,
        age: d.age,
        healthConditions: d.health,
        moreDetails: d.moreDetails,
        behavioralTraits: d.behavioralTraits,
        favoriteActivities: d.favoriteActivities,
        fixed: d.fixed === 'yes',
        rabiesVaccinated: d.rabiesVaccinated === 'yes',
        imageUrl: d.imageUrl 
      })) : []

    };
  }


// onProfilePicSelected(event: Event): void {
//   console.log('[onProfilePicSelected] Event triggered:', event);

//   const input = event.target as HTMLInputElement;
//   const file = input.files?.[0];

//   if (!file) {
//     console.warn('[onProfilePicSelected] No file selected.');
//     return;
//   }

//   console.log('[onProfilePicSelected] File selected:', {
//     name: file.name,
//     type: file.type,
//     size: file.size
//   });

//   const profilePicFile = file;
//   this.profilePic = file.name;

//   const lambdaUrl = SignupComponent.uploadProfilePicURL;
//   console.log('[onProfilePicSelected] Sending request to Lambda for presigned URL:', {
//     fileName: file.name,
//     fileType: file.type
//   });

//   this.http.post<any>(lambdaUrl, {
//     fileName: file.name,
//     fileType: file.type
//   }).subscribe({
//     next: (res) => {
//       console.log('[Lambda Response] Presigned URL and Public URL received:', res);

//       const presignedUrl = res.url;
//       const publicUrl = res.publicUrl;

//       console.log('[S3 Upload] Uploading file to S3 via presigned URL...');
//       this.http.put(presignedUrl, file, {
//         headers: { 'Content-Type': file.type }
//       }).subscribe({
//         next: () => {
//           console.log('[S3 Upload] Upload successful');
//           this.profilePic = publicUrl;
//           console.log('[S3 Upload] Stored public URL:', publicUrl);
//         },
//         error: (err) => {
//           console.error('[S3 Upload] Upload to S3 failed:', err);
//         }
//       });
//     },
//     error: (err) => {
//       console.error('[Lambda Error] Failed to get presigned URL:', err);
//     }
//   });
// }

onSitterPicSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.sitterImageFile = file;
  this.uploadImageToS3(file, (url) => {
    this.sitterImageUrl = url;
  });
}

onDogPicSelected(event: Event, index: number): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.uploadImageToS3(file, (url) => {
    this.dogs[index].imageUrl = url;
  });
}
  private uploadImageToS3(file: File, done: (publicUrl: string) => void, fail?: (e:any)=>void) {
  const lambdaUrl = SignupComponent.uploadProfilePicURL;

  this.http.post<any>(lambdaUrl, {
    fileName: file.name,
    fileType: file.type
  }).subscribe({
    next: (res) => {
      const presignedUrl = res.url;
      const publicUrl = res.publicUrl;

      this.http.put(presignedUrl, file, { headers: { 'Content-Type': file.type } })
        .subscribe({
          next: () => done(publicUrl),
          error: (err) => { console.error('[S3 Upload] failed', err); fail?.(err); }
        });
    },
    error: (err) => { console.error('[Lambda Error] presigned URL failed', err); fail?.(err); }
  });
}

onCityInput(v: string) {
  this.city = v;
  this.cityQuery$.next(v);
  this.addressSuggestions = [];
  this.cityActiveIndex = 0;
}

onStreetInput(v: string) {
  this.street = v;
  this.addressQuery$.next(v);
  this.citySuggestions = [];
  this.addressActiveIndex = 0;
}

pickAddress(s: { description: string; place_id: string }) {
  this.street = s.description;
  this.addressSuggestions = [];
}

pickCity(s: { description: string; place_id: string }) {
  this.city = s.description;
  this.citySuggestions = [];

  this.street = '';
  this.addressSuggestions = [];

  this.places.details(s.place_id, this.placesToken).subscribe((d: any) => {
  this.cityCenter = { lat: d.lat, lng: d.lng };
  this.cityName = extractCityName(d.address_components) || this.city; // e.g., "Tel Aviv-Yafo"
  const vp = d.geometry?.viewport;
  if (vp?.south !== undefined) {
    this.cityRect = { sw: { lat: vp.south, lng: vp.west }, ne: { lat: vp.north, lng: vp.east } };
  } else if (vp?.southwest) {
    this.cityRect = { sw: { lat: vp.southwest.lat, lng: vp.southwest.lng },
                      ne: { lat: vp.northeast.lat, lng: vp.northeast.lng } };
  } else {
    this.cityRect = null;
  }
});

}

private extractCityName(components?: AddressComponent[] | null): string | null {
  if (!components) return null;
  const get = (t: string) => components.find(c => c.types?.includes(t))?.long_name || null;
  return get('locality') || get('administrative_area_level_2') || get('administrative_area_level_1');
}

private scrollCityIntoView() {
  setTimeout(() => document.querySelector<HTMLElement>(`#city-opt-${this.cityActiveIndex}`)?.scrollIntoView({block:'nearest'}));
}
private scrollAddressIntoView() {
  setTimeout(() => document.querySelector<HTMLElement>(`#addr-opt-${this.addressActiveIndex}`)?.scrollIntoView({block:'nearest'}));
}

onCityKeydown(ev: KeyboardEvent) {
  const n = this.citySuggestions?.length ?? 0;
  if (!n) return;                            // let caret move normally if list closed

  if (ev.key === 'ArrowDown') {
    ev.preventDefault();
    this.cityActiveIndex = (this.cityActiveIndex + 1) % n;
    this.scrollCityIntoView();
  } else if (ev.key === 'ArrowUp') {
    ev.preventDefault();
    this.cityActiveIndex = (this.cityActiveIndex - 1 + n) % n;
    this.scrollCityIntoView();
  } else if (ev.key === 'Enter') {
    ev.preventDefault();                     // stop form submit
    const s = this.citySuggestions[this.cityActiveIndex] ?? this.citySuggestions[0];
    if (s) this.pickCity(s);
  } else if (ev.key === 'Escape') {
    this.citySuggestions = [];
  }
}

onStreetKeydown(ev: KeyboardEvent) {
  const n = this.addressSuggestions?.length ?? 0;
  if (!n) return;

  if (ev.key === 'ArrowDown') {
    ev.preventDefault();
    this.addressActiveIndex = (this.addressActiveIndex + 1) % n;
    this.scrollAddressIntoView();
  } else if (ev.key === 'ArrowUp') {
    ev.preventDefault();
    this.addressActiveIndex = (this.addressActiveIndex - 1 + n) % n;
    this.scrollAddressIntoView();
  } else if (ev.key === 'Enter') {
    ev.preventDefault();
    const s = this.addressSuggestions[this.addressActiveIndex] ?? this.addressSuggestions[0];
    if (s) this.pickAddress(s);
  } else if (ev.key === 'Escape') {
    this.addressSuggestions = [];
  }
}

onCityArrow(dir: 1|-1, ev: Event) {
  ev.preventDefault(); ev.stopPropagation();
  const n = this.citySuggestions?.length ?? 0;
  if (!n) return;
  this.cityActiveIndex = (this.cityActiveIndex + dir + n) % n;
  this.scrollCityIntoView();
}

onStreetArrow(dir: 1|-1, ev: Event) {
  ev.preventDefault(); ev.stopPropagation();
  const n = this.addressSuggestions?.length ?? 0;
  if (!n) return;
  this.addressActiveIndex = (this.addressActiveIndex + dir + n) % n;
  this.scrollAddressIntoView();
}

onCityEnter(ev: Event) {
  ev.preventDefault(); ev.stopPropagation();
  const s = this.citySuggestions[this.cityActiveIndex] ?? this.citySuggestions[0];
  if (s) this.pickCity(s);
}

onStreetEnter(ev: Event) {
  ev.preventDefault(); ev.stopPropagation();
  const s = this.addressSuggestions[this.addressActiveIndex] ?? this.addressSuggestions[0];
  if (s) this.pickAddress(s);
}

}

function extractCityName(components?: any[]): string | null {
  if (!components) return null;
  const get = (t: string) => components.find(c => c.types?.includes(t))?.long_name || null;
  return get('locality') || get('administrative_area_level_2') || get('administrative_area_level_1');
}




