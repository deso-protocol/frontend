import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-notifications-page",
  templateUrl: "./notifications-page.component.html",
  styleUrls: ["./notifications-page.component.scss"],
})
export class NotificationsPageComponent {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle(`Notifications - ${environment.node.name}`);
  }
}
