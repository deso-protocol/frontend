import { Directive, ElementRef, Input, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import * as _ from "lodash";

@Directive({
  selector: "[avatar]",
})
export class AvatarDirective implements OnChanges {
  @Input() avatar: string = "";

  constructor(private globalVars: GlobalVarsService, private backendApi: BackendApiService, private el: ElementRef) {}

  setAvatar() {
    // The fallback route is the route to the pic we use if we can't find an avatar for the user.
    let fallbackRoute = `?fallback=${this.backendApi.GetDefaultProfilePictureURL(window.location.host)}`;

    // If fetching the avatar for the current user, use the last timestamp of profile update to bust
    // the cache so we get the updated avatar.
    let cacheBuster = "";
    if(this.avatar === this.globalVars.loggedInUser.PublicKeyBase58Check && this.globalVars.profileUpdateTimestamp) {
      cacheBuster = `&${this.globalVars.profileUpdateTimestamp}`;
    }

    // Although it would be hard for an attacker to inject a malformed public key into the app,
    // we do a basic _.escape anyways just to be extra safe.
    let profPicURL = _.escape(this.backendApi.GetSingleProfilePictureURL(
      this.globalVars.localNode,
      this.avatar,
      cacheBuster
    ))

    // Set the URL on the element.
    this.el.nativeElement.style.backgroundImage = `url(${profPicURL})`;
  }

  ngOnChanges(changes: any) {
    if (changes.avatar && changes.avatar !== this.avatar) {
      this.setAvatar();
    }
  }
}
