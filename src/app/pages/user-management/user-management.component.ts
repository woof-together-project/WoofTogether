import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserContextService } from '../../shared/sharedUserContext/UserContextService';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

/* ---------------- Types (top-level) ---------------- */
interface DogVM {
  id?: number;
  name: string;
  breed: string;
  gender: string;
  size: string;
  weight: number | null;
  age: number | null;
  healthConditions: string;
  moreDetails: string;
  fixed: '' | 'yes' | 'no';
  rabiesVaccinated: '' | 'yes' | 'no';
  favoriteActivities: string[];
  behavioralTraits: string[];
}

type DogField =
  | 'name'
  | 'breed'
  | 'gender'
  | 'size'
  | 'weight'
  | 'age'
  | 'healthConditions'
  | 'moreDetails'
  | 'fixed'
  | 'rabiesVaccinated'
  | 'favoriteActivities'
  | 'behavioralTraits';

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
  dogIndex: number; // -1 when not a dog field
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
    'https://5org75ldcmqj6zhgsat7gi6mia0qwnav.lambda-url.us-east-1.on.aws/'; // GET ?sub=...
  static readonly updateURL =
    'https://tlvxanhnbet3pvmwmepkwwukre0ncsli.lambda-url.us-east-1.on.aws/'; // POST updates
  static readonly uploadProfilePicURL =
    'https://gmnmxjlmg5nwmqhs6nz7riribu0sukcb.lambda-url.us-east-1.on.aws/';

  constructor(
    private http: HttpClient,
    private userContext: UserContextService,
    private snackBar: MatSnackBar
  ) {
    // initialize newDog safely here (no "this" issues in field initializers)
    this.newDog = this.blankDog();
  }

    // --- One-toast-per-action / in-flight guard ---
  private ops = new Set<string>();
  private lock(key: string): boolean {
    if (this.ops.has(key)) return false;
    this.ops.add(key);
    return true;
  }
  private unlock(key: string) {
    this.ops.delete(key);
  }
  // --- single-message guard between client + server errors ---
  private lastClientErrorAt = 0;
  private readonly CLIENT_ERR_WINDOW_MS = 3500;
  private snackRef?: MatSnackBarRef<SimpleSnackBar>;

  addDogAttempted = false;

  /* ---- Option lists ---- */
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
  gender = '';

  /* ---- Sitter ---- */
  isSitter = false;
  sitterActive = true;
  rate: number | null = null;
  availability = '';
  sitterBio = '';
  experienceYears = '';
  experienceDetails: string[] = [];
  serviceOptions: string[] = [];
  confirmDeactivateOpen = false;

  /* ---- Dogs ---- */
  dogs: DogVM[] = [];
  dogOpen: boolean[] = []; // accordion state per-dog
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

  /* ---- Add-dog wizard modal (match HTML names) ---- */
  addDogModalOpen = false;
  addDogPage = 0; // 0..3
  newDog!: DogVM;

  private blankDog(): DogVM {
    return {
      id: undefined,
      name: '',
      breed: '',
      gender: '',
      size: '',
      weight: null,
      age: null,
      healthConditions: '',
      moreDetails: '',
      fixed: '',
      rabiesVaccinated: '',
      favoriteActivities: [],
      behavioralTraits: []
    };
  }

  ngOnInit(): void {
    this.userContext.getUserObservable().subscribe((u) => {
      this.email = u?.email ?? '';
      this.username = u?.username ?? '';
      this.sub = u?.sub ?? '';
      if (this.sub) this.loadProfile();
    });
  }

  /* ---------- Load profile ---------- */
  private loadProfile(): void {
    const url = `${UserManagementComponent.profileURL}?sub=${encodeURIComponent(
      this.sub
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
          this.profilePic = user.ProfilePictureUrl ?? '';
          this.gender = user.Gender ?? '';
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
        }));

        // match accordion state to dogs list
        this.dogOpen = new Array(this.dogs.length).fill(false);
      },
      error: (err) => {
        console.error('Load profile failed:', err);
        this.warn('Failed to load profile');
      }
    });
  }

  /* ---------- General / Sitter edit helpers ---------- */
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
  /* saveField(section: 'general' | 'sitter', field: string) {
    if (section === 'sitter' && !this.sitterActive) return;
    const payload = { sub: this.sub, section, field, value: (this as any)[field] };
    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState[section][field] = false;
        this.snackBar.open('Saved', 'Close', { duration: 900 });
      },
      error: (err) => {
        console.error('Save failed:', err);
        (this as any)[field] = this.originals[section][field];
        this.editState[section][field] = false;
        this.snackBar.open('Save failed', 'Close', { duration: 1200 });
      }
    });
  } */
  /* saveField(section: 'general' | 'sitter', field: string) {
    if (section === 'sitter' && !this.sitterActive) return;

    const value = (this as any)[field];
    const err = this.validateSingleField(section, field, value);
    if (err) {
      // revert and inform the user
      (this as any)[field] = this.originals[section][field];
      this.editState[section][field] = false;
      this.warn(this.msgFrom(err));
      return;
    }

    const payload = { sub: this.sub, section, field, value };
    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState[section][field] = false;
        this.ok('Saved');
      },
      error: (err) => {
        console.error('Save failed:', err);
        (this as any)[field] = this.originals[section][field];
        this.editState[section][field] = false;
        this.warn(this.msgFrom(err));
      }
    });
  } */

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

    const key = `field:${section}:${field}`;
    if (!this.lock(key)) return;            // <-- prevent double submit

    const payload = { sub: this.sub, section, field, value };
    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState[section][field] = false;
        this.ok('Saved');
        this.unlock(key);
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
      sub: this.sub, section: 'sitter', field: 'active', value: next
    }).subscribe({
      next: () => { this.ok(next ? 'Sitter activated' : 'Sitter deactivated'); this.unlock(key); },
      error: (err) => {
        this.sitterActive = prev;
        this.warn(this.msgFrom(err));
        this.unlock(key);
      }
    });
  }

  /* ---------- Dogs edit helpers ---------- */
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
  /* saveDogField(i: number, field: DogField) {
    const value = this.getDogField(i, field);
    const dogId = this.dogs[i].id;
    const payload =
      dogId != null
        ? { sub: this.sub, entity: 'dog', dogId, field, value }
        : { sub: this.sub, entity: 'dog', index: i, field, value };

    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState.dogs[i][field] = false;
        this.snackBar.open('Saved', 'Close', { duration: 900 });
      },
      error: (err) => {
        console.error('Save dog failed:', err);
        const orig = this.originals.dogs[i][field] as DogVM[typeof field];
        if (orig !== undefined) this.setDogField(i, field, orig);
        this.editState.dogs[i][field] = false;
        this.snackBar.open('Save failed', 'Close', { duration: 1200 });
      }
    });
  } */

  /* saveDogField(i: number, field: DogField) {
    const value = this.getDogField(i, field);

    // Validate first
    const err = this.validateDogField(field, value);
    if (err) {
      // revert to the original value and close edit
      const orig = this.originals.dogs[i]?.[field] as DogVM[typeof field];
      if (orig !== undefined) this.setDogField(i, field, orig);
      this.editState.dogs[i][field] = false;

      // loud snackbar (uses your existing warn() helper + CSS)
      this.warn('Save failed');
      return;
    }

    // proceed with save
    const dogId = this.dogs[i].id;
    const payload =
      dogId != null
        ? { sub: this.sub, entity: 'dog', dogId, field, value }
        : { sub: this.sub, entity: 'dog', index: i, field, value };

    this.http.post(UserManagementComponent.updateURL, payload).subscribe({
      next: () => {
        this.editState.dogs[i][field] = false;
        this.ok('Saved');
      },
      error: (err) => {
        console.error('Save dog failed:', err);
        const orig = this.originals.dogs[i]?.[field] as DogVM[typeof field];
        if (orig !== undefined) this.setDogField(i, field, orig);
        this.editState.dogs[i][field] = false;
        this.warn('Save failed');
      }
    });
  } */

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
      ? { sub: this.sub, entity: 'dog', dogId, field, value }
      : { sub: this.sub, entity: 'dog', index: i, field, value };

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
      ? { sub: this.sub, entity: 'dog', action: 'delete', dogId: d.id }
      : { sub: this.sub, entity: 'dog', action: 'delete', index: i };

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

  /* ---------- Profile picture upload ---------- */
  startProfilePicEdit(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onProfilePicSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.http
      .post<any>(UserManagementComponent.uploadProfilePicURL, {
        fileName: file.name,
        fileType: file.type
      })
      .subscribe({
        next: (res) => {
          const { url, publicUrl } = res;
          this.http
            .put(url, file, { headers: { 'Content-Type': file.type } })
            .subscribe({
              next: () => {
                this.profilePic = publicUrl;
                this.http
                  .post(UserManagementComponent.updateURL, {
                    sub: this.sub,
                    section: 'general',
                    field: 'profilePic',
                    value: publicUrl
                  })
                  .subscribe({
                    next: () =>
                      this.ok('Profile picture updated'),
                    error: () =>
                      this.warn('Failed to save picture URL')
                  });
              },
              error: (err) => {
                console.error('S3 upload failed', err);
                this.warn('Upload failed');
              }
            });
        },
        error: (err) => {
          console.error('Presigned URL error', err);
          this.warn('Upload failed');
        }
      });
  }

  openDeactivateConfirm() {
    this.confirmDeactivateOpen = true;
  }

  confirmDeactivate() {
    // close the dialog and proceed with the existing toggle logic
    this.confirmDeactivateOpen = false;
    this.toggleSitterActive();
  }

  /* ---------- Multi-select (existing) ---------- */
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
        sub: this.sub, section: 'sitter', field, value: values
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
        sub: this.sub, entity: 'dog', dogId: this.dogs[i].id, field, value: values
      }).subscribe({
        next: () => { this.ok('Saved'); this.closeMultiEdit(); this.unlock(key); },
        error: (err) => { this.warn(this.msgFrom(err)); this.unlock(key); }
      });
    }
  }


  /* ---------- Add-dog wizard: open/close/nav/save ---------- */
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

  /** Called by wizard checkbox inputs in template */
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

  /** Save the newly created dog */
  /* saveNewDog() {
    const key = 'dog:create';
    if (!this.lock(key)) return;

    const payload = { sub: this.sub, entity: 'dog', action: 'create', dog: this.newDog };
    this.http.post<any>(UserManagementComponent.updateURL, payload).subscribe({
      next: (res) => {
        const assignedId = res?.dogId ?? res?.id ?? res?.dog?.Id ?? undefined;
        const created: DogVM = { ...this.newDog, id: assignedId };
        this.dogs = [...this.dogs, created];
        this.dogOpen = [...this.dogOpen, true];
        this.ok('Dog added');
        this.closeAddDogModal();
        this.unlock(key);
      },
      error: (err) => {
        this.warn(this.msgFrom(err));
        this.unlock(key);
      }
    });
  } */

  /* ---------- Dog field accessors ---------- */
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

  // --- Inline-edit validation helpers + rules ---

  isBlank(v: any): boolean {
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  }

  /** Required fields per section for inline editing */
  private requiredGeneralFields = new Set<string>([
    'phone', 'city', 'street', 'email' // adjust as you like
  ]);

  private requiredSitterFields = new Set<string>([
    'rate', 'availability', 'sitterBio', 'experienceYears', 'experienceDetails', 'serviceOptions'// tweak as needed
  ]);

  /** Field-specific validators (return an error string or null if OK) */
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

  /** Required + type rules for existing-dog inline edits */
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
        // Optional, but if provided must be a non-negative number
        if (value === '' || value === null || value === undefined) return null;
        const n = Number(value);
        if (Number.isNaN(n) || n < 0) return 'Enter a non-negative number';
        return null;
      }

      case 'fixed':
      case 'rabiesVaccinated':
        if (value !== '' && value !== 'yes' && value !== 'no') return 'Select Yes or No';
        return null;

      // free text / arrays – no strict rules:
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
      prev.afterDismissed().subscribe(open); // wait for the exit animation
      prev.dismiss();                        // start dismissing the current one
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

  // --- Add at the top-level of the class ---

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
      // do not advance; inline messages are visible now
      return;
    }
    this.addDogAttempted = false;
    if (this.addDogPage < 3) this.addDogPage++;
  }

  saveNewDog() {
    this.addDogAttempted = true;
    if (this.page0Errors() || this.page1Errors()) {
      return; // inline errors are shown on pages 0/1
    }

    const key = 'dog:create';
    if (!this.lock(key)) return;

    const payload = { sub: this.sub, entity: 'dog', action: 'create', dog: this.newDog };
    this.http.post<any>(UserManagementComponent.updateURL, payload).subscribe({
      next: (res) => {
        const assignedId = res?.dogId ?? res?.id ?? res?.dog?.Id ?? undefined;
        const created: DogVM = { ...this.newDog, id: assignedId };
        this.dogs = [...this.dogs, created];
        this.dogOpen = [...this.dogOpen, true];
        this.addDogAttempted = false;
        this.closeAddDogModal();
        this.unlock(key);
      },
      error: (_err: any) => {
        // no snackbar; you can optionally surface server text inline somewhere in the modal header
        this.unlock(key);
      }
    });
  }

  private isMissing(v: unknown) {
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
  }
  private page0Errors(): boolean {
    const d = this.newDog;
    return this.isMissing(d.name) || this.isMissing(d.breed) ||
           this.isMissing(d.gender) || this.isMissing(d.fixed);
  }
  private page1Errors(): boolean {
    const d = this.newDog;
    return this.isMissing(d.size) || d.weight == null || d.age == null ||
           this.isMissing(d.rabiesVaccinated);
  }

  // Put this inside the component class
  private toStringArray(input: any): string[] {
    if (Array.isArray(input)) return input.map(x => String(x).trim()).filter(Boolean);
    if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}


}
