import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  sidebarVisible$: Observable<boolean>;
  
  constructor(private sidebarService: SidebarService) {
    this.sidebarVisible$ = this.sidebarService.sidebarVisible$;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
