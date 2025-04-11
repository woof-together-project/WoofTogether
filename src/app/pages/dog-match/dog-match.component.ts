import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  standalone: true,
  //selector: 'app-login', 
  templateUrl: './dog-match.component.html',
  styleUrls: ['./dog-match.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})

export class DogMatchComponent {
  sittersForm = new FormGroup({
    name: new FormControl(''),
    location: new FormControl(''),
    availability: new FormControl(''),
    experience: new FormControl(''),
  });

  constructor() {}
}
