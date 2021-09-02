import { Component, OnInit, Input, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService, TutorialStatus } from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { AppRoutingModule, RouteNames } from "../../app-routing.module";
import { Title } from "@angular/platform-browser";
import { BsModalRef } from "ngx-bootstrap/modal";

export type ProfileUpdates = {
  usernameUpdate: string;
  descriptionUpdate: string;
  profilePicUpdate: string;
};

export type ProfileUpdateErrors = {
  usernameError: boolean;
  descriptionError: boolean;
  profilePicError: boolean;
  founderRewardError: boolean;
};

@Component({
  selector: "feed-create-post-modal",
  templateUrl: "./feed-create-post-modal.component.html",
  styleUrls: ["./feed-create-post-modal.component.scss"],
})
export class FeedCreatePostModalComponent {
  @Input() loggedInUser: any;
  @Input() inTutorial: boolean = false;

  updateProfileBeingCalled: boolean = false;
  descriptionInput: string;
  profileUpdates: ProfileUpdates = {
    usernameUpdate: "",
    descriptionUpdate: "",
    profilePicUpdate: "",
  };
  profileUpdateErrors: ProfileUpdateErrors = {
    usernameError: false,
    descriptionError: false,
    profilePicError: false,
    founderRewardError: false,
  };
  profileUpdated = false;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private router: Router,
    public bsModalRef: BsModalRef
  ) {}

  onPostCreated(postEntryResponse) {
    this.router.navigate(
      ["/" + this.globalVars.RouteNames.USER_PREFIX, postEntryResponse.ProfileEntryResponse.Username],
      { queryParamsHandling: "merge" }
    );
  }
}
