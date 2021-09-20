import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { Location } from "@angular/common";
import { ProfileEntryResponse } from "../../backend-api.service";
import { AppRoutingModule } from "../../app-routing.module";

@Component({
  selector: "top-bar-mobile-header",
  templateUrl: "./top-bar-mobile-header.component.html",
  styleUrls: ["./top-bar-mobile-header.component.scss"],
})
export class TopBarMobileHeaderComponent {
  // Certain pages only have a back button and a title for the top bar.
  @Input() simpleTopBar: boolean = false;
  @Input() title: string = null;
  @Input() publicKeyBase58Check: string = null;
  @Input() profileEntryResponse: ProfileEntryResponse = null;
  @Input() backButtonFn = () => {
    this.location.back();
  };
  isSearching = false;
  AppRoutingModule = AppRoutingModule;
  constructor(public globalVars: GlobalVarsService, private location: Location) {}

  initiateSearch() {
    this.isSearching = true;
    // this will make the execution after the above boolean has changed
    setTimeout(() => {
      const searchElement = document.getElementById("searchbar");
      searchElement.focus();
    }, 0);
  }
}
