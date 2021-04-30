import { Component } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "buy-bitclout-logged-out",
  templateUrl: "./buy-bitclout-logged-out.component.html",
  styleUrls: ["./buy-bitclout-logged-out.component.scss"],
})
export class BuyBitcloutLoggedOutComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
