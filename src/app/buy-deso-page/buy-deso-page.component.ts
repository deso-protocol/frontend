import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "buy-deso-page",
  templateUrl: "./buy-deso-page.component.html",
  styleUrls: ["./buy-deso-page.component.scss"],
})
export class BuyDeSoPageComponent implements OnInit {
  isLeftBarMobileOpen: boolean = false;

  ngOnInit() {
    this.titleService.setTitle("Buy $DESO - DeSo");
  }

  constructor(public globalVars: GlobalVarsService, private titleService: Title) {}
}
