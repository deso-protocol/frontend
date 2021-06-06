import { Component, OnInit } from "@angular/core";
import { Title } from '@angular/platform-browser';

@Component({
  selector: "app-notifications-page",
  templateUrl: "./notifications-page.component.html",
  styleUrls: ["./notifications-page.component.scss"],
})
export class NotificationsPageComponent {
  constructor(private titleService: Title) { }
  
  // Set Title function for dynamically setting the title
  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }
}
