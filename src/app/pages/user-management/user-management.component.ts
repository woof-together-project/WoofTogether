import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Subject, of, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap, catchError } from 'rxjs/operators';
import { NavigationService } from '../../shared/navigation/navigation.service';
import { PlacesService } from '../../shared/map/places/PlacesService';

type AddressComponent = { long_name: string; short_name: string; types: string[] };

/* ---------------- Types (top-level) ---------------- */
interface SitterWizardVM {
  profilePictureUrl?: string;
  gender: '' | 'male' | 'female';
  rate: number | null;
  availability: string;
  sitterBio: string;
  experienceYears: number | null;
  experienceDetails: string[];
  serviceOptions: string[];
}

type SitterListField = 'experienceDetails' | 'serviceOptions';

interface DogVM {
  id?: number;
  name: string;
  breed: string;
  gender: string;
  size: string;
  weight: number | null;
  age: number | null;
  birthMonth: number | null;
  birthYear: number | null;
  healthConditions: string;
  moreDetails: string;
  fixed: '' | 'yes' | 'no';
  rabiesVaccinated: '' | 'yes' | 'no';
  favoriteActivities: string[];
  behavioralTraits: string[];
  profilePictureUrl?: string;
}

type DogField =
  | 'name'
  | 'breed'
  | 'gender'
  | 'size'
  | 'weight'
  | 'age'
  | 'birthMonth'
  | 'birthYear'
  | 'healthConditions'
  | 'moreDetails'
  | 'fixed'
  | 'rabiesVaccinated'
  | 'favoriteActivities'
  | 'behavioralTraits'
  | 'profilePictureUrl';

type MultiSection = 'sitter' | 'dog';
type MultiField =
  | 'experienceDetails'
  | 'serviceOptions'
  | 'behavioralTraits'
  | 'favoriteActivities';

interface ModalVM {
  open: boolean;
  title: string;
  section: MultiSection | null;
  field: MultiField | null;
  dogIndex: number; //
  options: string[];
  selected: Set<string>;
}

/* ---------------- Component ---------------- */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MatSnackBarModule ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})

export class UserManagementComponent {
  static readonly profileURL =
    'https://oriosyqlioqnmqo7xyr4ojoara0ycilg.lambda-url.us-east-1.on.aws/';
  static readonly updateURL =
    'https://r4776sz54z52iqfj4zbea55nti0ssbgi.lambda-url.us-east-1.on.aws/';
  static readonly uploadProfilePicURL =
    'https://mec7bs3xaigxfcycy4h3alpfmy0tagat.lambda-url.us-east-1.on.aws/';

  constructor(
    private http: HttpClient,
    private userContext: UserContextService,
    private snackBar: MatSnackBar,
    private navigationService: NavigationService,
    private places: PlacesService,
    private cdRef: ChangeDetectorRef
  ) {
    this.newDog = this.blankDog();
  }

  @ViewChild('streetInput') streetInput?: ElementRef<HTMLInputElement>;
  private placesToken =
  (crypto as any).randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

    cityQuery$ = new Subject<string>();
    addressQuery$ = new Subject<string>();

    citySuggestions: { description: string; place_id: string }[] = [];
    addressSuggestions: { description: string; place_id: string }[] = [];

    cityCenter: { lat: number; lng: number } | null = null;
    cityName: string | null = null;
    cityRect: { sw: { lat: number; lng: number }, ne: { lat: number; lng: number } } | null = null;

    cityActiveIndex = 0;
    addressActiveIndex = 0;

  private ops = new Set<string>();
  private lock(key: string): boolean {
    if (this.ops.has(key)) return false;
    this.ops.add(key);
    return true;
  }
  private unlock(key: string) {
    this.ops.delete(key);
  }
  //private lastClientErrorAt = 0;
  //private readonly CLIENT_ERR_WINDOW_MS = 3500;
  private snackRef?: MatSnackBarRef<SimpleSnackBar>;

  addDogAttempted = false;

  months = [
  { value: 1,  label: 'Jan' },
  { value: 2,  label: 'Feb' },
  { value: 3,  label: 'Mar' },
  { value: 4,  label: 'Apr' },
  { value: 5,  label: 'May' },
  { value: 6,  label: 'Jun' },
  { value: 7,  label: 'Jul' },
  { value: 8,  label: 'Aug' },
  { value: 9,  label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

  years: number[] = [];

  experienceWithOptions = [
    'Elder Dogs',
    'Young Dogs',
    'Cubs',
    'Reactive Dogs',
    'Aggressive to Other Animals',
    'Aggressive to People',
    'Anxious Dogs',
    'Big Dogs',
    'Small Dogs'
  ];

  serviceOptionsMaster = ['Dog-Sitting', 'Dog-Walking', 'Dog-Boarding'];

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

  /* ---- Identity ---- */
  email = '';
  username = '';
  sub = '';

  /* ---- General ---- */
  phone = '';
  city = '';
  street = '';
  profilePic = '';

  /* ---- Sitter ---- */
  isSitter = false;
  sitterActive = true;
  rate: number | null = null;
  availability = '';
  sitterBio = '';
  experienceYears: number | null = null;
  experienceDetails: string[] = [];
  serviceOptions: string[] = [];
  confirmDeactivateOpen = false;
  sitterProfilePic = '';
  gender = '';

  /* ---- Dogs ---- */
  dogs: DogVM[] = [];
  dogOpen: boolean[] = [];
  deleteDogConfirmOpen = false;
  deleteDogIndex: number | null = null;

  /* ---- Edit state ---- */
  editState = {
    general: {} as Record<string, boolean>,
    sitter: {} as Record<string, boolean>,
    dogs: {} as Record<number, Record<DogField, boolean>>
  };
  originals = {
    general: {} as Record<string, any>,
    sitter: {} as Record<string, any>,
    dogs: {} as Record<number, Partial<Record<DogField, DogVM[DogField]>>>
  };

  /* ---- Multi-select modal ---- */
  modal: ModalVM = {
    open: false,
    title: '',
    section: null,
    field: null,
    dogIndex: -1,
    options: [],
    selected: new Set<string>()
  };

  addDogModalOpen = false;
  addDogPage = 0; // 0..3
  newDog!: DogVM;

  becomeSitterOpen = false;
  sitterPage = 0;
  sitterAttempted = false;

  loaded = false;

  sitterWizard: SitterWizardVM = {
    profilePictureUrl: '',
    gender: '',
    rate: null,
    availability: '',
    sitterBio: '',
    experienceYears: null,
    experienceDetails: [],
    serviceOptions: []
  };

  private blankDog(): DogVM {
    return {
      id: undefined,
      name: '',
      breed: '',
      gender: '',
      size: '',
      weight: null,
      age: null,
      birthMonth: null,
      birthYear: null,
      healthConditions: '',
      moreDetails: '',
      fixed: '',
      rabiesVaccinated: '',
      favoriteActivities: [],
      behavioralTraits: [],
      profilePictureUrl: ''
    };
  }

  ngOnInit(): void {
    this.userContext.getUserObservable().subscribe((u) => {
      this.email = u?.email ?? '';
      this.username = u?.username ?? '';
      this.sub = u?.sub ?? '';
      const thisYear = new Date().getFullYear();
      const span = 25;                 // show 25 years back (adjust if you want)
      this.years = Array.from({length: span + 1}, (_, i) => thisYear - i);
      if (this.email) this.loadProfile();
    });

    this.cityQuery$
    .pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(q => this.places.autocomplete(q, this.placesToken, 'city'))
    )
    .subscribe({
      next: res => { this.citySuggestions = res.predictions ?? []; },
      error: err => console.error('[CITY AUTOCOMPLETE] HTTP error', err)
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
          cityRect:   this.cityRect   ?? undefined,
          cityName:   this.cityName   ?? undefined
        }
      ))
    )
    .subscribe(res => this.addressSuggestions = res.predictions ?? []);
  }

  private extractCityName(components?: AddressComponent[] | null): string | null {
    if (!components) return null;
    const get = (t: string) => components.find(c => c.types?.includes(t))?.long_name || null;
    return get('locality') || get('administrative_area_level_2') || get('administrative_area_level_1');
  }

  private loadProfile(): void {
    const url = `${UserManagementComponent.profileURL}?email=${encodeURIComponent(
      this.email
    )}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const user = res?.user;
        const sitter = res?.sitter;
        const dogs = Array.isArray(res?.dogs) ? res.dogs : [];

        if (user) {
          this.phone = user.Phone ?? '';
          this.city = user.City ?? '';
          this.street = user.Street ?? '';
          this.email = user.Email ?? this.email;
          this.username = user.Name ?? this.username;
        }

        this.isSitter = !!sitter;
        if (sitter) {
          this.sitterActive = this.parseActiveFlag(sitter.Active);
          this.rate = sitter.Rate ?? null;
          this.availability = sitter.Availability ?? '';
          this.sitterBio = sitter.AboutMe ?? '';
          this.experienceYears = sitter.ExperienceYears ?? '';
          this.experienceDetails = this.toStringArray(sitter.ExperienceDetails);
          this.serviceOptions    = this.toStringArray(sitter.ServiceOptions);
          this.gender = sitter.Gender ?? '';
          this.sitterProfilePic = sitter.ProfilePictureUrl ?? '';
        }

        this.dogs = dogs.map((d: any) => ({
          id: d.Id,
          name: d.Name ?? '',
          breed: d.Breed ?? '',
          gender: d.Gender ?? '',
          size: d.Size ?? '',
          weight: d.Weight ?? null,
          age: d.Age ?? null,
          healthConditions: d.HealthConditions ?? '',
          moreDetails: d.MoreDetails ?? '',
          fixed: d.Fixed ? 'yes' : 'no',
          rabiesVaccinated: d.RabiesVaccinated ? 'yes' : 'no',
          favoriteActivities: this.toStringArray(d.FavoriteActivities),
          behavioralTraits:  this.toStringArray(d.BehavioralTraits),
          profilePictureUrl: d.ProfilePictureUrl ?? ''
        }));

        this.dogOpen = new Array(this.dogs.length).fill(false);
      },
      error: (err) => {
        console.error('Load profile failed:', err);
        this.warn('Failed to load profile');
      },
      complete: () => {
        this.loaded = true;
      }
    });
  }

  openBecomeSitterModal() {
    this.becomeSitterOpen = true;
    this.sitterPage = 0;
    this.sitterAttempted = false;
    this.sitterWizard = {
      profilePictureUrl: '',
      gender: '',
      rate: null,
      availability: '',
      sitterBio: '',
      experienceYears: null,
      experienceDetails: [],
      serviceOptions: []
    };
  }
  closeBecomeSitterModal() {
    this.becomeSitterOpen = false;
  }

  prevSitterPage() {
    if (this.sitterPage > 0) this.sitterPage--;
  }

  onSitterWizardPicSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const key = 'sitter:create:pic';
    if (!this.lock(key)) return;

    this.http.post<any>(UserManagementComponent.uploadProfilePicURL, {
      fileName: file.name,
      fileType: file.type
    }).subscribe({
      next: (res) => {
        this.http.put(res.url, file, { headers: { 'Content-Type': file.type } })
          .subscribe({
            next: () => { this.sitterWizard.profilePictureUrl = res.publicUrl; this.ok('Photo uploaded'); this.unlock(key); },
            error: () => { this.warn('Upload failed'); this.unlock(key); }
          });
      },
      error: () => { this.warn('Upload failed'); this.unlock(key); }
    });
  }

  private validateSitterPage(page: number): string[] {
    const e: string[] = [];
    const s = this.sitterWizard;

    if (page === 0) {
      if (!s.profilePictureUrl) e.push('profilePictureUrl');
      if (!s.gender) e.push('gender');
      if (s.experienceYears == null || !Number.isInteger(+s.experienceYears) || +s.experienceYears < 0) e.push('experienceYears');
      if (s.rate == null || +s.rate < 0) e.push('rate');
    } else if (page === 1) {
      if (!s.availability.trim()) e.push('availability');
      if (!s.sitterBio.trim()) e.push('sitterBio');
    } else if (page === 2) {
      if (!s.serviceOptions.length) e.push('serviceOptions');
      // experienceDetails can be empty if you want
    }
    return e;
  }

  nextSitterPage() {
    this.sitterAttempted = true;
    if (this.validateSitterPage(this.sitterPage).length) return;
    this.sitterAttempted = false;
    if (this.sitterPage < 2) this.sitterPage++;
  }

  /** Create sitter once by posting the normal update endpoint for each field.
   *  _ensure_sitter on the server will create the row on the first call. */
  async saveNewSitter() {
    this.sitterAttempted = true;
    // Validate last page too
    if (this.validateSitterPage(this.sitterPage).length || this.validateSitterPage(0).length || this.validateSitterPage(1).length) return;

    const key = 'sitter:create';
    if (!this.lock(key)) return;

    try {
      const s = this.sitterWizard;
      const posts: Array<[string, any]> = [
        ['gender', s.gender],
        ['experienceYears', Number(s.experienceYears)],
        ['rate', Number(s.rate)],
        ['availability', s.availability],
        ['sitterBio', s.sitterBio],
        ['experienceDetails', s.experienceDetails],
        ['serviceOptions', s.serviceOptions],
      ];
      if (s.profilePictureUrl) {
        posts.unshift(['profilePictureUrl', s.profilePictureUrl]); // optional first
      }

      // First call creates sitter record; the rest fill fields
      for (const [field, value] of posts) {
        await firstValueFrom(
          this.http.post(UserManagementComponent.updateURL, {
            email: this.email, section: 'sitter', field, value
          })
        );
      }

      this.ok('Sitter profile created!');
      this.becomeSitterOpen = false;

      // Refresh the UI → will flip isSitter=true and show the normal sitter card
      this.isSitter = true;
      this.sitterActive = true;
      this.loadProfile();
    } catch (err: any) {
      this.warn(this.msgFrom(err));
    } finally {
      this.unlock(key);
    }
  }


  isEditing(section: 'general' | 'sitter', field: string) {
    if (section === 'sitter' && !this.sitterActive) return false;
    return !!this.editState[section][field];
  }

  toggleEdit(section: 'general' | 'sitter', field: string) {
    if (section === 'sitter' && !this.sitterActive) return;
    if (!this.editState[section][field]) {
      this.originals[section][field] = (this as any)[field];
    }
    this.editState[section][field] = !this.editState[section][field];
  }

  cancelField(section: 'general' | 'sitter', field: string) {
    (this as any)[field] = this.originals[section][field];
    this.editState[section][field] = false;
  }

  saveField(section: 'general' | 'sitter', field: string) {
    if (section === 'sitter' && !this.sitterActive) return;

    const value = (this as any)[field];
    const err = this.validateSingleField(section, field, value);
    if (err) {
      (this as any)[field] = this.originals[section][field];
      this.editState[section][field] = false;
      this.warn(this.msgFrom(err));
      return;
    }

    const wasCityChange =
      section === 'general' &&
      field === 'city' &&
      String(this.originals.general['city'] ?? '').trim() !== String(this.city ?? '').trim();
    const prevCity = this.originals.general['city'];

    const key = `field:${section}:${field}`;
    if (!this.lock(key)) return;

    const payload = { email: this.email, section, field, value };
    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState[section][field] = false;
        this.ok('Saved');
        this.unlock(key);

        if (wasCityChange) {
          this.street = '';
          this.editState.general['street'] = true;

          this.cityCenter = null;
          this.cityRect   = null;
          this.cityName   = this.city || null;
          this.addressSuggestions = [];
          this.editState.general['street'] = true;
          this.ok('City updated. Please update your street.');
          setTimeout(() => this.streetInput?.nativeElement?.focus(), 0);
          this.openStreetForEdit({ clear: true });
          this.warn('City changed — please update your street');
        }
      },
      error: (err) => {
        (this as any)[field] = this.originals[section][field];
        this.editState[section][field] = false;
        this.warn(this.msgFrom(err));
        this.unlock(key);
      }
    });
  }

  toggleSitterActive() {
    const confirmMsg = this.sitterActive
      ? 'Deactivate your sitter profile? You can re-activate anytime.'
      : 'Activate your sitter profile?';
    if (!window.confirm(confirmMsg)) return;

    const key = 'sitter:toggle';
    if (!this.lock(key)) return;

    const prev = this.sitterActive;
    const next = !this.sitterActive;

    if (!next) Object.keys(this.editState.sitter).forEach(k => (this.editState.sitter[k] = false));
    this.sitterActive = next;

    this.http.post(UserManagementComponent.updateURL, {
      email: this.email, section: 'sitter', field: 'active', value: next
    }).subscribe({
      next: () => { this.ok(next ? 'Sitter activated' : 'Sitter deactivated'); this.unlock(key); },
      error: (err) => {
        this.sitterActive = prev;
        this.warn(this.msgFrom(err));
        this.unlock(key);
      }
    });
  }

  trackByIndex = (i: number) => i;

  isEditingDog(i: number, field: DogField) {
    return !!this.editState.dogs[i]?.[field];
  }

  toggleDogEdit(i: number, field: DogField) {
    this.editState.dogs[i] =
      this.editState.dogs[i] || ({} as Record<DogField, boolean>);
    this.originals.dogs[i] = this.originals.dogs[i] || {};
    if (!this.editState.dogs[i][field]) {
      this.originals.dogs[i][field] = this.getDogField(i, field);
    }
    this.editState.dogs[i][field] = !this.editState.dogs[i][field];
  }

  cancelDogField(i: number, field: DogField) {
    const orig = this.originals.dogs[i][field] as DogVM[typeof field];
    if (orig !== undefined) {
      this.setDogField(i, field, orig);
    }
    this.editState.dogs[i][field] = false;
  }

  saveDogField(i: number, field: DogField) {
    const value = this.getDogField(i, field);

    const err = this.validateDogField(field, value);
    if (err) {
      const orig = this.originals.dogs[i]?.[field] as DogVM[typeof field];
      if (orig !== undefined) this.setDogField(i, field, orig);
      this.editState.dogs[i][field] = false;
      this.warn(this.msgFrom(err));
      return;
    }

    const key = `dog:${i}:${field}`;
    if (!this.lock(key)) return;            // <-- prevent double submit

    const dogId = this.dogs[i].id;
    const payload = dogId != null
      ? { email: this.email, entity: 'dog', dogId, field, value }
      : { email: this.email, entity: 'dog', index: i, field, value };

    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState.dogs[i][field] = false;
        this.ok('Saved');
        this.unlock(key);
      },
      error: (err) => {
        const orig = this.originals.dogs[i]?.[field] as DogVM[typeof field];
        if (orig !== undefined) this.setDogField(i, field, orig);
        this.editState.dogs[i][field] = false;
        this.warn(this.msgFrom(err));
        this.unlock(key);
      }
    });
  }

  private performDogDelete(i: number) {
    const d = this.dogs[i];
    if (!d) return;

    const key = `dog:delete:${i}`;
    if (!this.lock(key)) return;

    const payload = d.id != null
      ? { email: this.email, entity: 'dog', action: 'delete', dogId: d.id }
      : { email: this.email, entity: 'dog', action: 'delete', index: i };

    const snapshotDogs = [...this.dogs];
    const snapshotOpen = [...this.dogOpen];

    this.dogs.splice(i, 1);
    this.dogOpen.splice(i, 1);

    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => { this.ok('Dog removed'); this.unlock(key); },
      error: (err) => {
        this.dogs = snapshotDogs;
        this.dogOpen = snapshotOpen;
        this.warn(this.msgFrom(err));
        this.unlock(key);
      }
    });
  }

  confirmDeleteDogFromModal() {
    if (this.deleteDogIndex == null) return;
    const i = this.deleteDogIndex;
    this.closeDeleteDogConfirm();
    this.performDogDelete(i);
  }

  startSitterPicEdit(input: HTMLInputElement) {
    if (!this.sitterActive) return;
    input.click();
  }

  onSitterPicSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const key = 'sitter:pic';
    if (!this.lock(key)) return;

    this.http.post<any>(UserManagementComponent.uploadProfilePicURL, {
      fileName: file.name,
      fileType: file.type
    }).subscribe({
      next: (res) => {
        this.http.put(res.url, file, { headers: { 'Content-Type': file.type } }).subscribe({
          next: () => {
            this.sitterProfilePic = res.publicUrl;
            this.http.post(UserManagementComponent.updateURL, {
              email: this.email,
              section: 'sitter',
              field: 'profilePictureUrl',
              value: res.publicUrl
            }).subscribe({
              next: () => { this.ok('Sitter photo updated'); this.unlock(key); },
              error: (err) => { this.warn(this.msgFrom(err)); this.unlock(key); }
            });
          },
          error: () => { this.warn('Upload failed'); this.unlock(key); }
        });
      },
      error: () => { this.warn('Upload failed'); this.unlock(key); }
    });
  }

  startDogPicEdit(_i: number, input: HTMLInputElement) {
    input.click();
  }

  onDogPicSelected(ev: Event, i: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file || !this.dogs[i]) return;

    const key = `dog:pic:${i}`;
    if (!this.lock(key)) return;

    this.http.post<any>(UserManagementComponent.uploadProfilePicURL, {
      fileName: file.name,
      fileType: file.type
    }).subscribe({
      next: (res) => {
        this.http.put(res.url, file, { headers: { 'Content-Type': file.type } }).subscribe({
          next: () => {
            this.dogs[i].profilePictureUrl = res.publicUrl;
            this.http.post(UserManagementComponent.updateURL, {
              email: this.email,
              entity: 'dog',                      // dog entity
              dogId: this.dogs[i].id,             // (or index if new/unsaved)
              field: 'profilePictureUrl',         // <-- field name on your backend
              value: res.publicUrl
            }).subscribe({
              next: () => { this.ok('Dog photo updated'); this.unlock(key); },
              error: (err) => { this.warn(this.msgFrom(err)); this.unlock(key); }
            });
          },
          error: () => { this.warn('Upload failed'); this.unlock(key); }
        });
      },
      error: () => { this.warn('Upload failed'); this.unlock(key); }
    });
  }

  onNewDogPicSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const key = 'newdog:pic';
    if (!this.lock(key)) return;

    this.http.post<any>(UserManagementComponent.uploadProfilePicURL, {
      fileName: file.name,
      fileType: file.type
    }).subscribe({
      next: (res) => {
        this.http.put(res.url, file, { headers: { 'Content-Type': file.type } })
          .subscribe({
            next: () => { this.newDog.profilePictureUrl = res.publicUrl; this.ok('Photo uploaded'); this.unlock(key); },
            error: () => { this.warn('Upload failed'); this.unlock(key); }
          });
      },
      error: () => { this.warn('Upload failed'); this.unlock(key); }
    });
  }

  openDeactivateConfirm() {
    this.confirmDeactivateOpen = true;
  }

  confirmDeactivate() {
    this.confirmDeactivateOpen = false;
    this.toggleSitterActive();
  }

  displayList(list?: string[] | null): string {
    return Array.isArray(list) && list.length ? list.join(', ') : '—';
  }

  openMultiEdit(
    section: MultiSection,
    field: MultiField,
    options: string[],
    current: string[] | undefined,
    dogIndex: number = -1,
    title = 'Edit'
  ) {
    if (section === 'sitter' && !this.sitterActive) return;
    this.modal.open = true;
    this.modal.title = title;
    this.modal.section = section;
    this.modal.field = field;
    this.modal.dogIndex = dogIndex;
    this.modal.options = options.slice();
    this.modal.selected = new Set(current ?? []);
  }

  toggleOption(opt: string, checked: boolean) {
    if (checked) this.modal.selected.add(opt);
    else this.modal.selected.delete(opt);
  }

  closeMultiEdit() {
    this.modal.open = false;
    this.modal.title = '';
    this.modal.section = null;
    this.modal.field = null;
    this.modal.dogIndex = -1;
    this.modal.options = [];
    this.modal.selected = new Set<string>();
  }

  saveMultiEdit() {
    if (!this.modal.section || !this.modal.field) return;

    const values = Array.from(this.modal.selected);
    const field = this.modal.field;

    if (this.modal.section === 'sitter') {
      (this as any)[field] = values;

      const key = `multi:sitter:${field}`;
      if (!this.lock(key)) return;

      this.http.post(UserManagementComponent.updateURL, {
        email: this.email, section: 'sitter', field, value: values
      }).subscribe({
        next: () => { this.ok('Saved'); this.closeMultiEdit(); this.unlock(key); },
        error: (err) => { this.warn(this.msgFrom(err)); this.unlock(key); }
      });

    } else {
      const i = this.modal.dogIndex;
      if (i < 0) return;

      if (field === 'behavioralTraits') this.dogs[i].behavioralTraits = values;
      else if (field === 'favoriteActivities') this.dogs[i].favoriteActivities = values;

      const key = `multi:dog:${i}:${field}`;
      if (!this.lock(key)) return;

      this.http.post(UserManagementComponent.updateURL, {
        email: this.email, entity: 'dog', dogId: this.dogs[i].id, field, value: values
      }).subscribe({
        next: () => { this.ok('Saved'); this.closeMultiEdit(); this.unlock(key); },
        error: (err) => { this.warn(this.msgFrom(err)); this.unlock(key); }
      });
    }
  }

  openAddDogModal() {
    this.addDogModalOpen = true;
    this.addDogPage = 0;
    this.newDog = this.blankDog();
  }

  closeAddDogModal() {
    this.addDogModalOpen = false;
  }

  prevAddDogPage() {
    if (this.addDogPage > 0) this.addDogPage--;
  }

  onWizardCheckChange(
    field: 'behavioralTraits' | 'favoriteActivities',
    value: string,
    ev: Event
  ) {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    const curr = new Set(this.newDog[field] ?? []);
    if (checked) curr.add(value);
    else curr.delete(value);
    this.newDog[field] = Array.from(curr);
  }

  private getDogField<K extends DogField>(i: number, key: K): DogVM[K] {
    return (this.dogs[i] as any)[key] as DogVM[K];
  }
  private setDogField<K extends DogField>(i: number, key: K, value: DogVM[K]) {
    (this.dogs[i] as any)[key] = value;
  }

  private parseActiveFlag(v: any): boolean {
    if (v === undefined || v === null) return true;
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'active';
  }

  openDeleteDogConfirm(i: number) {
    this.deleteDogIndex = i;
    this.deleteDogConfirmOpen = true;
  }

  closeDeleteDogConfirm() {
    this.deleteDogConfirmOpen = false;
    this.deleteDogIndex = null;
  }

  isBlank(v: any): boolean {
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  }

  private requiredGeneralFields = new Set<string>([
    'phone', 'city', 'street', 'email' // adjust as you like
  ]);

  private requiredSitterFields = new Set<string>([
    'rate', 'availability', 'sitterBio', 'experienceYears', 'experienceDetails', 'serviceOptions'// tweak as needed
  ]);

  private validateSingleField(
    section: 'general' | 'sitter',
    field: string,
    value: any
  ): string | null {

    if (section === 'general') {
      if (field === 'phone') {
        if (this.isBlank(value)) return 'Phone number is required';
        // simple phone sanity check; relax/tighten as you prefer
        if (!/^\+?[0-9()\-\s]{7,}$/.test(String(value))) {
          return 'Please enter a valid phone number';
        }
        return null;
      }

      if (this.requiredGeneralFields.has(field) && this.isBlank(value)) {
        return 'This field cannot be left blank';
      }
      return null;
    }

    if (section === 'sitter') {
      if (field === 'rate') {
        if (value === null || value === '') return 'Rate is required';
        const n = Number(value);
        if (Number.isNaN(n) || n < 0) return 'Rate must be a non-negative number';
        return null;
      }
      if (field === 'experienceYears') {
        if (this.isBlank(value)) return 'Experience years is required';
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0) return 'Enter a non-negative whole number';
        return null;
      }
      if (this.requiredSitterFields.has(field) && this.isBlank(value)) {
        return 'This field cannot be left blank';
      }
      return null;
    }

    return null;
  }

  private validateDogField(field: DogField, value: any): string | null {
    const isBlank = (v: any) =>
      v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

    switch (field) {
      case 'name':
      case 'breed':
        if (isBlank(value)) return 'This field cannot be left blank';
        return null;

      case 'gender':
        if (isBlank(value)) return 'Gender is required';
        if (!['male', 'female'].includes(String(value))) return 'Choose Male or Female';
        return null;

      case 'size':
        if (isBlank(value)) return 'Size is required';
        return null;

      case 'weight':
      case 'age': {
        if (value === '' || value === null || value === undefined) return null;
        const n = Number(value);
        if (Number.isNaN(n) || n < 0) return 'Enter a non-negative number';
        return null;
      }

      case 'fixed':
      case 'rabiesVaccinated':
        if (value !== '' && value !== 'yes' && value !== 'no') return 'Select Yes or No';
        return null;

      case 'healthConditions':
      case 'moreDetails':
      case 'favoriteActivities':
      case 'behavioralTraits':
      default:
        return null;
    }
  }

  private msgFrom(e: any): string {
    return typeof e === 'string'
      ? e
      : (e?.error?.message || e?.message || 'Something went wrong');
  }

  private showSnack(message: string, panelClass: string[], duration: number) {
    const open = () => {
      this.snackRef = this.snackBar.open(message, 'OK', {
        duration,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass,
      });
      this.snackRef.afterDismissed().subscribe(() => (this.snackRef = undefined));
    };

    if (this.snackRef) {
      const prev = this.snackRef;
      this.snackRef = undefined;
      prev.afterDismissed().subscribe(open);
      prev.dismiss();
    } else {
      open();
    }
  }

  private ok(message: string, ms = 1700) {
    this.showSnack(message, ['success-snackbar'], ms);
  }
  private warn(message: string, ms = 2200) {
    this.showSnack(message, ['warn-snackbar'], ms);
  }

  private isBlankStr(v:any) {
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
  }

  private validateAddDogPage(page: number): string[] {
    const e: string[] = [];
    const d = this.newDog;

    if (page === 0) {
      if (!d.name?.trim()) e.push('name');
      if (!d.breed?.trim()) e.push('breed');
      if (!d.gender)        e.push('gender');
      if (d.fixed !== 'yes' && d.fixed !== 'no') e.push('fixed');
    }
    if (page === 1) {
      if (!d.size) e.push('size');
      if (d.weight == null) e.push('weight');
      if (d.age == null)    e.push('age');
      if (d.rabiesVaccinated !== 'yes' && d.rabiesVaccinated !== 'no') {
        e.push('rabiesVaccinated');
      }
    }
    return e;
  }

  nextAddDogPage() {
    this.addDogAttempted = true;
    if ((this.addDogPage === 0 && this.page0Errors()) ||
        (this.addDogPage === 1 && this.page1Errors())) {
      return;
    }
    this.addDogAttempted = false;
    if (this.addDogPage < 3) this.addDogPage++;
  }

  saveNewDog() {
    this.addDogAttempted = true;
    if (this.page0Errors() || this.page1Errors()) {
      return;
    }

    const key = 'dog:create';
    if (!this.lock(key)) return;

    const payload = { email: this.email, entity: 'dog', action: 'create', dog: this.newDog };
    this.http.post<any>(UserManagementComponent.updateURL, payload).subscribe({
      next: (res) => {
        const assignedId = res?.dogId ?? res?.id ?? res?.dog?.Id ?? undefined;
        const created: DogVM = {
        ...this.newDog,
        id: assignedId,
        age: this.ageDecimal(this.newDog.birthYear!, this.newDog.birthMonth!)};
        this.dogs = [...this.dogs, created];
        this.dogOpen = [...this.dogOpen, true];
        this.addDogAttempted = false;
        this.closeAddDogModal();
        this.unlock(key);
      },
      error: (_err: any) => {
        this.unlock(key);
      }
    });
  }

  isMonthDisabledForNewDog(month: number): boolean {
    const y = this.newDog?.birthYear;
    if (!y) return false;
    const now = new Date();
    const yNow = now.getFullYear();
    const mNow = now.getMonth() + 1;
    return (y > yNow) || (y === yNow && month > mNow);
  }

  onNewDogYearChange(y: number | null) {
    this.newDog.birthYear = y;
    if (this.newDog.birthMonth && this.isMonthDisabledForNewDog(this.newDog.birthMonth)) {
      this.newDog.birthMonth = null;
    }
  }

  private isMissing(v: unknown) {
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
  }
  private page0Errors(): boolean {
    const d = this.newDog;
    return this.isMissing(d.name) || this.isMissing(d.breed)
    || this.isMissing(d.profilePictureUrl) || this.isMissing(d.birthMonth)
        || this.isMissing(d.birthYear);
  }

  private page1Errors(): boolean {
    const d = this.newDog;
    return this.isMissing(d.size)
        || d.weight == null
        || this.isFutureBirth(d.birthYear as number, d.birthMonth as number)
        || this.isMissing(d.rabiesVaccinated)
        || this.isMissing(d.gender) || this.isMissing(d.fixed);
  }

  getAgeString(birthYear: number, birthMonth: number): string {
    if (!birthYear || !birthMonth) return '';
    const now = new Date();
    let y = now.getFullYear() - birthYear;
    let m = (now.getMonth() + 1) - birthMonth;
    if (m < 0) { y -= 1; m += 12; }
    if (y < 0) return '0 months';
    const yPart = y > 0 ? `${y} year${y > 1 ? 's' : ''}` : '';
    const mPart = m > 0 ? `${m} month${m > 1 ? 's' : ''}` : (y === 0 ? '0 months' : '');
    return [yPart, mPart].filter(Boolean).join(', ');
  }

  isFutureBirth(y?: number | null, m?: number | null): boolean {
    if (!y || !m) return false;
    const now = new Date();
    const yNow = now.getFullYear();
    const mNow = now.getMonth() + 1;
    return y > yNow || (y === yNow && m > mNow);
  }

  private toStringArray(input: any): string[] {
    if (Array.isArray(input)) return input.map(x => String(x).trim()).filter(Boolean);
    if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
    return [];
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
      this.cityName = this.extractCityName(d.address_components) || this.city;
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

  private scrollCityIntoView() {
    setTimeout(() =>
      document.querySelector<HTMLElement>(`#city-opt-${this.cityActiveIndex}`)
        ?.scrollIntoView({ block: 'nearest' })
    );
  }
  private scrollAddressIntoView() {
    setTimeout(() =>
      document.querySelector<HTMLElement>(`#addr-opt-${this.addressActiveIndex}`)
        ?.scrollIntoView({ block: 'nearest' })
    );
  }

  onCityKeydown(ev: KeyboardEvent) {
    const n = this.citySuggestions?.length ?? 0;
    if (!n) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); this.cityActiveIndex = (this.cityActiveIndex + 1) % n; this.scrollCityIntoView(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); this.cityActiveIndex = (this.cityActiveIndex - 1 + n) % n; this.scrollCityIntoView(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); const s = this.citySuggestions[this.cityActiveIndex] ?? this.citySuggestions[0]; if (s) this.pickCity(s); }
    else if (ev.key === 'Escape') { this.citySuggestions = []; }
  }

  onStreetKeydown(ev: KeyboardEvent) {
    const n = this.addressSuggestions?.length ?? 0;
    if (!n) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); this.addressActiveIndex = (this.addressActiveIndex + 1) % n; this.scrollAddressIntoView(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); this.addressActiveIndex = (this.addressActiveIndex - 1 + n) % n; this.scrollAddressIntoView(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); const s = this.addressSuggestions[this.addressActiveIndex] ?? this.addressSuggestions[0]; if (s) this.pickAddress(s); }
    else if (ev.key === 'Escape') { this.addressSuggestions = []; }
  }

  onCityArrow(dir: 1|-1, ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    const n = this.citySuggestions?.length ?? 0; if (!n) return;
    this.cityActiveIndex = (this.cityActiveIndex + dir + n) % n; this.scrollCityIntoView();
  }
  onStreetArrow(dir: 1|-1, ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    const n = this.addressSuggestions?.length ?? 0; if (!n) return;
    this.addressActiveIndex = (this.addressActiveIndex + dir + n) % n; this.scrollAddressIntoView();
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

  private openStreetForEdit(options?: { clear?: boolean }) {
    const clear = options?.clear ?? false;

    if (clear) this.street = '';                 // wipe old street when city changed
    this.editState.general['street'] = true;     // open inline editor

    // reset biasing so suggestions match the new city
    this.cityCenter = null;
    this.cityRect   = null;
    this.cityName   = this.city || null;
    this.addressSuggestions = [];

    // force a render tick, THEN focus
    this.cdRef.detectChanges();
    setTimeout(() => this.streetInput?.nativeElement?.focus(), 50);
  }

  private ageDecimal(year: number, month: number): number {
    const now = new Date();
    const totalMonths = (now.getFullYear() - year) * 12 + (now.getMonth() + 1) - month;
    const years = Math.max(0, totalMonths) / 12;
    return Math.round(years * 100) / 100;
  }

  formatAgeDecimal(age: number): string {
    return age.toFixed(2).replace(/\.?0+$/, '');
  }

  onSitterWizardListToggle(field: SitterListField, opt: string, checked: boolean) {
    const curr = new Set(this.sitterWizard[field]);
    if (checked) curr.add(opt); else curr.delete(opt);
    this.sitterWizard[field] = Array.from(curr);
  }

}
