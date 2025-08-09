import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, AsyncPipe  } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoadingOverlayService } from './shared/loading-overlay.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, NgIf, AsyncPipe ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(public overlay: LoadingOverlayService) {}
  ngOnInit(): void {
  }
}
