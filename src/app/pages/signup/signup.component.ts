import { Component, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationService } from '../../shared/navigation/navigation.service';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})

export class SignupComponent {
  static readonly signupURL =  'https://eu2okj2maowkb7rrlnqmtnmfru0nvaif.lambda-url.us-east-1.on.aws/'; //signup lambda function URL
  constructor(private http: HttpClient, private userContext: UserContextService,
        private snackBar: MatSnackBar,  private navigationService: NavigationService
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
  { name: '', breed: '', gender: '', fixed: '', size: '', weight: null, age: null, rabiesVaccinated: '', behavioralTraits: [], favoriteActivities: [], health: '', moreDetails: '' }
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
    'Protective',
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
      moreDetails: ''
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

    // If user just checked addDog, reset showDogSections properly
    if (this.addDog && this.showDogSections.length !== this.dogs.length) {
      this.showDogSections = this.dogs.map(() => true);
    }

    if (this.addDog) {
      // Make sure all dog sections are expanded
      this.showDogSections = this.dogs.map(() => true);
    }
  }

 submitForm() {
  console.log('Form submitted with the following data:');
  console.log('Email:', this.email);
  console.log('Nickname:', this.nickname);

  const signupData = this.prepareSignupData();
  const payload = {
    email: this.email,
    signupData: signupData
  };

  console.log('Submitting form with payload:', payload);

  this.http.post(SignupComponent.signupURL , payload)
    .subscribe({
      next: res => {
        console.log('Submitted successfully:', res);
        // Update user context isComplete flag
        this.userContext.setUserCompleteStatus(true);
        this.snackBar.open('Signup successful!', 'Close', {
          duration: 1500
        });

        setTimeout(() => {
        this.navigationService.requestHomeRedirect();
        }, 1500);

      },
      error: err => {
        console.error('Submission failed:', err);
        this.snackBar.open('Signup failed. Please try again.', 'Close', {
          duration: 1500
        });
      }
    });
}


  prepareSignupData() {
    return {
      phone: this.phone,
      city: this.city,
      street: this.street,
      profilePic: this.profilePic, // for now just the file name or base64 if needed
      isSitter: this.isSitter,
      addDog: this.addDog,
      sitterDetails: this.isSitter ? {
        gender: this.gender,
        bio: this.sitterBio,
        experience: this.experience,
        rate: this.rate,
        availability: this.availability,
        experienceWith: this.selectedSitterExperience,
        services: this.selectedSitterServices
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
        rabiesVaccinated: d.rabiesVaccinated === 'yes'
      })) : []

    };
  }


onProfilePicSelected(event: Event): void {
  console.log('[onProfilePicSelected] Event triggered:', event);

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    console.warn('[onProfilePicSelected] No file selected.');
    return;
  }

  console.log('[onProfilePicSelected] File selected:', {
    name: file.name,
    type: file.type,
    size: file.size
  });

  const profilePicFile = file;
  this.profilePic = file.name;

  const lambdaUrl = SignupComponent.signupURL;
  console.log('[onProfilePicSelected] Sending request to Lambda for presigned URL:', {
    fileName: file.name,
    fileType: file.type
  });

  this.http.post<any>(lambdaUrl, {
    fileName: file.name,
    fileType: file.type
  }).subscribe({
    next: (res) => {
      console.log('[Lambda Response] Presigned URL and Public URL received:', res);

      const presignedUrl = res.url;
      const publicUrl = res.publicUrl;

      console.log('[S3 Upload] Uploading file to S3 via presigned URL...');
      this.http.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type }
      }).subscribe({
        next: () => {
          console.log('[S3 Upload] Upload successful');
          this.profilePic = publicUrl;
          console.log('[S3 Upload] Stored public URL:', publicUrl);
        },
        error: (err) => {
          console.error('[S3 Upload] Upload to S3 failed:', err);
        }
      });
    },
    error: (err) => {
      console.error('[Lambda Error] Failed to get presigned URL:', err);
    }
  });
}

}



