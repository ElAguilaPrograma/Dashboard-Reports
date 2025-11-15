import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  constructor(private sidebarService: SidebarService) {}

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
