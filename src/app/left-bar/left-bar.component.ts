import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule } from "../app-routing.module";
import { MessagesInboxComponent } from "../messages-page/messages-inbox/messages-inbox.component";
import { IdentityService } from "../identity.service";

@Component({
  selector: "left-bar",
  templateUrl: "./left-bar.component.html",
  styleUrls: ["./left-bar.component.sass"],
})
export class LeftBarComponent {
  MessagesInboxComponent = MessagesInboxComponent;

  @HostBinding("class") get classes() {
    return !this.isMobile ? "global__nav__flex" : "";
  }

  @Input() isMobile = false;
  @Output() closeMobile = new EventEmitter<boolean>();
  currentRoute: string;

  AppRoutingModule = AppRoutingModule;

  constructor(public globalVars: GlobalVarsService, private identityService: IdentityService) {}

  // send logged out users to the landing page
  // send logged in users to browse
  homeLink(): string {
    if (this.globalVars.showLandingPage()) {
      return "/" + this.globalVars.RouteNames.LANDING;
    } else {
      return "/" + this.globalVars.RouteNames.BROWSE;
    }
  }

  getHelpMailToAttr(): string {
    const loggedInUser = this.globalVars.loggedInUser;
    const pubKey = loggedInUser?.PublicKeyBase58Check;
    const btcAddress = this.identityService.identityServiceUsers[pubKey]?.btcDepositAddress;
    const bodyContent = encodeURIComponent(
      `The below information helps support address your case.\nMy public key: ${pubKey} \nMy BTC Address: ${btcAddress}`
    );
    const body = loggedInUser ? `?body=${bodyContent}` : "";
    return `mailto:${this.globalVars.supportEmail}${body}`;
  }

  logHelp(): void {
    this.globalVars.logEvent("help : click");
  }
}
