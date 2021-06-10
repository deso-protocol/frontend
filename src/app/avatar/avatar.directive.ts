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
    if (this.avatar in this.globalVars.avatarMap) {
      this.el.nativeElement.style.backgroundImage = this.globalVars.avatarMap[this.avatar];
      return;
    }
    this.backendApi.GetSingleProfilePicture(this.globalVars.localNode, this.avatar).subscribe(
      (res) => {
        this.setElementBackground(res.ProfilePic);
      },
      (err) => {
        this.setElementBackground("/assets/img/default_profile_pic.png");
      }
    );
  }

  ngOnChanges(changes: any) {
    if (changes.avatar && changes.avatar !== this.avatar) {
      this.setAvatar();
    }
  }

  setElementBackground(profilePic: string): void {
    const img = `url('${profilePic}')`;
    this.el.nativeElement.style.backgroundImage = img;
    this.globalVars.avatarMap[this.avatar] = img;
  }
}
