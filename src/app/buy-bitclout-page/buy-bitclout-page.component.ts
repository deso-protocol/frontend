import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "buy-bitclout-page",
  templateUrl: "./buy-bitclout-page.component.html",
  styleUrls: ["./buy-bitclout-page.component.scss"],
})
export class BuyBitcloutPageComponent {
  isLeftBarMobileOpen: boolean = false;

  constructor(public globalVars: GlobalVarsService) {}
}
