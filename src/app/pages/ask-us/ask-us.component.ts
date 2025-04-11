import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  standalone: true,
  //selector: 'app-login', 
  templateUrl: './ask-us.component.html',
  styleUrls: ['./ask-us.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})

export class AskUsComponent {
  sittersForm = new FormGroup({
    name: new FormControl(''),
    location: new FormControl(''),
    availability: new FormControl(''),
    experience: new FormControl(''),
  });

  constructor() {}
}
