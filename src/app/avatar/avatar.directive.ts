import { Directive, ElementRef, Input, OnChanges, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";

@Directive({
  selector: "[avatar]",
})
export class AvatarDirective implements OnInit, OnChanges {
  @Input() avatar: string = "";

  constructor(private globalVars: GlobalVarsService, private backendApi: BackendApiService, private el: ElementRef) {}

  setAvatar() {
    if (this.avatar in this.globalVars.avatarMap) {
      this.el.nativeElement.style.backgroundImage = this.globalVars.avatarMap[this.avatar];
      return;
    }
    this.backendApi.GetSingleProfilePicture(this.globalVars.localNode, this.avatar).subscribe(
      (res) => {
        // this.profilePic = res.ProfilePic;
        const img = `url('${res.ProfilePic}')`;
        this.el.nativeElement.style.backgroundImage = img;
        this.globalVars.avatarMap[this.avatar] = img;
      },
      (err) => {
        this.el.nativeElement.style.backgroundImage = `url('/assets/img/default_profile_pic.png')`;
        this.globalVars.avatarMap[this.avatar] = `url('/assets/img/default_profile_pic.png')`;
      }
    );
  }

  ngOnInit(): void {
    this.setAvatar();
  }

  ngOnChanges(changes: any) {
    if (changes.avatar) {
      this.setAvatar();
    }
  }
}
