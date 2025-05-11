import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sitter } from './sitter.model';

@Component({
  selector: 'app-sitters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sitters.component.html',
  styleUrls: ['./sitters.component.css']
})

export class SittersComponent implements OnInit {
  constructor(private http: HttpClient) {}

  selectedTab: 'map' | 'criteria' | null = 'map';
  sitters: Sitter[] = [];
  loading = false;
  location = {
    latitude: 32.0853,     // example: Tel Aviv
    longitude: 34.7818,
    radius: 10             // in km (default radius)
  };

  selectedServiceOptions: string[] = [];
  selectedDogTypes: string[] = [];
  selectedGender: string = "any";
  minRate: number = 0;
  maxRate: number = 150; //define according to the data that exists in the backend
  filteredSitters: Sitter[] = [];
  selectedSitter: Sitter | null = null;
  selectedSitterId: number | null = null;

  // Replace hardcoded filter options with dynamic arrays
  experienceWithOptions: string[] = [];
  serviceOptions: string[] = [];
  genderOptions: string[] = ['Any', 'Female', 'Male']; // Still static for now

  // Filters model
  filters = {
    servicesSelected: [] as string[],
    gender: 'Any',
    rateMax: 150,
    experiencedWith: [] as string[]
  };

  ngOnInit(): void {
    this.sitters = [
        {
          user_id: 1,
          name: "Nina’s Dog World",
          gender: "female",
          aboutMe: "I’m a loving dog mom who enjoys spending time with all kinds of dogs. Experienced with shy and anxious rescues.",
          moreDetails: "Great with nervous dogs, medication administration, and older rescues. Volunteered at the SPCA in Tel Aviv for 2 years, and provided 3 years of private in-home sitting services. Specialize in nervous dogs who need extra patience.",
          experienceYears: "2019–now",
          rate: 75,
          reviews: [
            "Very dependable and active — my dog loves Nina!",
            "Always on time and caring.",
            "Excellent communication."
          ],
          distance: 2.3,
          serviceOptions: ["dog-sitting", "dog-walking"],
          experiencedWith: ["anxious dogs", "elder dogs", "small dogs"],
          availability: "Available weekdays from 16:00 to 20:00. Unavailable: May 12–15",
          imageUrl: "assets/images/female_dogsitter.png",
          email: "nina@example.com"
        },
        {
          user_id: 2,
          name: "Paws with Alex",
          gender: "male",
          aboutMe: "I enjoy long walks and energetic dogs. Great for active pups who love to explore.",
          moreDetails: "Best for big dogs that love exercise. College student with weekend flexibility. Helped train two Labrador puppies. Provided weekend boarding for neighbors. Great with big breeds like Huskies and Labs.",
          experienceYears: "2021–now",
          rate: 60,
          reviews: ["Very dependable and active — my dog loves Alex!"],
          distance: 5.0,
          serviceOptions: ["dog-walking", "dog-boarding"],
          experiencedWith: ["big dogs", "young dogs", "cubs"],
          availability: "Available weekends and national holidays. Unavailable: June 5",
          imageUrl: "assets/images/male_dogsitter.png",
          email: "alex@example.com"
        },
        {
          user_id: 3,
          name: "Dana's Pup Retreat",
          gender: "female",
          aboutMe: "Calm, responsible, and attentive. Ideal for older or anxious dogs that need structure and consistency.",
          moreDetails: "Veterinary assistant background. Comfortable with medical needs and post-surgery care.",
          experienceYears: "2017–now",
          rate: 90,
          reviews: ["Dana is a lifesaver for senior dogs. Highly recommended."],
          distance: 3.1,
          serviceOptions: ["dog-sitting", "dog-boarding"],
          experiencedWith: ["elder dogs", "anxious dogs", "small dogs"],
          availability: "Available Mon–Fri mornings. Unavailable: May 20–22",
          imageUrl: "assets/images/female_dogsitter.png",
          email: "dana@example.com"
        },
        {
          user_id: 4,
          name: "Itay the Dog Buddy",
          gender: "male",
          aboutMe: "Friendly and reliable sitter with a deep love for dogs. Your pet’s routine will be my priority.",
          moreDetails: "Comfortable with multi-pet households. Can manage reactive or dominant dogs.",
          experienceYears: "2020–now",
          rate: 70,
          reviews: ["Reliable and great with my two dogs — they love him!"],
          distance: 2.8,
          serviceOptions: ["dog-sitting", "dog-walking"],
          experiencedWith: ["reactive dogs", "big dogs", "anxious dogs"],
          availability: "Flexible schedule including evenings and some weekends. Unavailable: May 18",
          imageUrl: "assets/images/male_dogsitter.png",
          email: "itay@example.com"
        },
        {
          user_id: 5,
          name: "Yael’s Doggy Paradise",
          gender: "female",
          aboutMe: "Full of energy and always happy to walk or play with your pup! I treat every dog like they’re my own.",
          moreDetails: "Fun-focused care. Perfect for energetic or playful dogs.",
          experienceYears: "2018–now",
          rate: 85,
          reviews: ["My dog gets excited every time she sees Yael!"],
          distance: 4.4,
          serviceOptions: ["dog-sitting", "dog-walking", "dog-boarding"],
          experiencedWith: ["young dogs", "cubs", "small dogs"],
          availability: "Evenings, holidays, and most weekends. Unavailable: June 1–3",
          imageUrl: "assets/images/female_dogsitter.png",
          email: "yael@example.com"
        },
        {
          user_id: 6,
          name: "Roi the New Walker",
          gender: "male",
          aboutMe: "While I’m new to professional sitting, I’m extremely responsible and punctual.",
          moreDetails: "New to paid dog-sitting, but great with basic training and active dogs.",
          experienceYears: "2023–now",
          rate: 50,
          reviews: ["Very sweet and careful. Great for short walks and beginner dogs."],
          distance: 6.2,
          serviceOptions: ["dog-walking"],
          experiencedWith: ["young dogs", "big dogs"],
          availability: "Weekdays 10:00–15:00. Not available Fridays or mornings with classes.",
          imageUrl: "assets/images/male_dogsitter.png",
          email: "roi@example.com"
        }
    ];

    //TODO - see if its relevant to the backend
    //this.loadSittersByLocation();

    // Simulate fetch from backend
    this.experienceWithOptions = [
      'Elder Dogs', 'Young Dogs', 'Cubs',
      'Reactive Dogs', 'Aggressive to Other Animals',
      'Aggressive to People', 'Anxious Dogs',
      'Big Dogs', 'Small Dogs'
    ];

    this.serviceOptions = ['Dog-Sitting', 'Dog-Walking', 'Dog-Boarding'];
  }

  onSelectSitter(sitter: Sitter) {
    if (this.selectedSitter?.user_id === sitter.user_id) {
      // Clicked the same sitter again → close
      this.selectedSitter = null;
    } else {
      // New sitter or first time → open
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
    // Reset filter form values
    this.filters = {
      servicesSelected: [],
      gender: 'Any',
      rateMax: 150,
      experiencedWith: []
    };
    this.selectedServiceOptions = [];
    this.selectedDogTypes = [];
    this.selectedGender = 'any';
    this.minRate = 0;
    this.maxRate = 150;

    // Fetch all sitters again (reset results)
    this.loadSittersByLocation();
    this.filteredSitters = [];
  }


  //need to send this to the backend and bring the data
  applyFilters(): void {
    const url = 'https://your-backend-url/sitters/filter';

    const payload = {
      ...this.filters,
      latitude: this.location.latitude,
      longitude: this.location.longitude,
      radius: this.location.radius
    };

    this.http.post<Sitter[]>(url, payload).subscribe({
      next: (data) => this.filteredSitters = data,
      error: () => console.error('Filter request failed')
    });
  }

 // TODO: TEMPORARY! REPLACE THIS
  currentUserEmail = 'daniella@gmail.com'; // Temporary until user context is ready

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
    const url = 'https://your-backend-url/sitters/nearby';
    const body = {
      latitude: this.location.latitude,
      longitude: this.location.longitude,
      radius: this.location.radius
    };

    this.http.post<Sitter[]>(url, body).subscribe({
      next: (data) => this.sitters = data,
      error: () => console.error('Failed to load sitters by location')
    });
}



}
