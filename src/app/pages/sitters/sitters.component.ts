import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  standalone: true,
  //selector: 'app-login', 
  templateUrl: './sitters.component.html',
  styleUrls: ['./sitters.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})

export class SittersComponent {
  sittersForm = new FormGroup({
    name: new FormControl(''),
    location: new FormControl(''),
    availability: new FormControl(''),
    experience: new FormControl(''),
  });

  constructor() {}
}
