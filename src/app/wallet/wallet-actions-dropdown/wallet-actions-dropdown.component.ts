import { Component, Input } from "@angular/core";
import { AppRoutingModule } from "../../app-routing.module";

@Component({
  selector: "wallet-actions-dropdown",
  templateUrl: "./wallet-actions-dropdown.component.html",
})
export class WalletActionsDropdownComponent {
  @Input() hodlingUsername: string;
  AppRoutingModule = AppRoutingModule;

  constructor() {}
}
