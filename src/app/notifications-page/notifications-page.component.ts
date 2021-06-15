import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-notifications-page",
  templateUrl: "./notifications-page.component.html",
  styleUrls: ["./notifications-page.component.scss"],
})
export class NotificationsPageComponent {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Notifications - BitClout");
  }
}
