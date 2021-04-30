import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "top-bar-mobile-hamburger-menu",
  templateUrl: "./top-bar-mobile-hamburger-menu.component.html",
  styleUrls: ["./top-bar-mobile-hamburger-menu.component.scss"],
})
export class TopBarMobileHamburgerMenuComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
