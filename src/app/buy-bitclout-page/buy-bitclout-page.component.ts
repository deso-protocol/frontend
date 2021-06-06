import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Title } from '@angular/platform-browser';

@Component({
  selector: "buy-bitclout-page",
  templateUrl: "./buy-bitclout-page.component.html",
  styleUrls: ["./buy-bitclout-page.component.scss"],
})
export class BuyBitcloutPageComponent {
  isLeftBarMobileOpen: boolean = false;

  constructor(public globalVars: GlobalVarsService, private titleService: Title) {}

  // Set Title function for dynamically setting the title
  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }
}
