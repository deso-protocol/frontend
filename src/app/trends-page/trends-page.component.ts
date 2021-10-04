import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { environment } from "src/environments/environment";

@Component({
  selector: "trends-page",
  templateUrl: "./trends-page.component.html",
  styleUrls: ["./trends-page.component.scss"],
})
export class TrendsPageComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle(`Trends - ${environment.node.name}`);
  }
}
