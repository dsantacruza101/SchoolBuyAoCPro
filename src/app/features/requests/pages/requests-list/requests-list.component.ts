import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  templateUrl: './requests-list.component.html',
  styleUrl: './requests-list.component.css',
})
export class RequestsListComponent {}
