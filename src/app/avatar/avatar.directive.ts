import { Directive, ElementRef, Input, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";

@Directive({
  selector: "[avatar]",
})
export class AvatarDirective implements OnChanges {
  @Input() avatar: string = "";

  constructor(private globalVars: GlobalVarsService, private backendApi: BackendApiService, private el: ElementRef) {}

  setAvatar() {
    this.el.nativeElement.style.backgroundImage = `url(${this.backendApi.GetSingleProfilePictureURL(
      this.globalVars.localNode,
      this.avatar,
      // If fetching the avatar for the current user, use the last timestamp of profile update to bust the cache so
      // we get the updated avatar.
      this.avatar === this.globalVars.loggedInUser.PublicKeyBase58Check && this.globalVars.profileUpdateTimestamp
        ? `?${this.globalVars.profileUpdateTimestamp}`
        : ""
    )}), url("/assets/img/default_profile_pic.png")`;
  }

  ngOnChanges(changes: any) {
    if (changes.avatar && changes.avatar !== this.avatar) {
      this.setAvatar();
    }
  }
}
