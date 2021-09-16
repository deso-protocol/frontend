import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "mint-nft-page",
  templateUrl: "./mint-nft-page.component.html",
  styleUrls: ["./mint-nft-page.component.scss"],
})
export class MintNftPageComponent {
  isLeftBarMobileOpen: boolean = false;
  title: string = null;

  constructor(public globalVars: GlobalVarsService) {}
}
