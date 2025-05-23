import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  @Input() center: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  @Input() zoom = 12;
@Input() markers: { id: number; lat: number; lng: number; label?: string }[] = [];

   @Output() markerClicked = new EventEmitter<number>();

  onMarkerClick(markerId: number) {
    this.markerClicked.emit(markerId);
  }
}
