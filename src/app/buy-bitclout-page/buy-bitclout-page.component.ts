import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "buy-bitclout-page",
  templateUrl: "./buy-bitclout-page.component.html",
  styleUrls: ["./buy-bitclout-page.component.scss"],
})
export class BuyBitcloutPageComponent implements OnInit {
  isLeftBarMobileOpen: boolean = false;

  ngOnInit() {
    this.titleService.setTitle("Buy $CLOUT - BitClout");
  }

  constructor(public globalVars: GlobalVarsService, private titleService: Title) {}
}
