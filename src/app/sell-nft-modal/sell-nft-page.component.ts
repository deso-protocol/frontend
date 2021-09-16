import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "sell-nft-page",
  templateUrl: "./sell-nft-page.component.html",
  styleUrls: ["./sell-nft-page.component.scss"],
})
export class SellNftPageComponent {
  isLeftBarMobileOpen: boolean = false;
  title: string = null;

  constructor(public globalVars: GlobalVarsService) {}
}
