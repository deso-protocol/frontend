import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "wallet-page",
  templateUrl: "./wallet-page.component.html",
  styleUrls: ["./wallet-page.component.scss"],
})
export class WalletPageComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
