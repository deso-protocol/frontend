import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, PostEntryResponse, ProfileEntryResponse } from "../../../backend-api.service";
import {AppRoutingModule, RouteNames} from "../../../app-routing.module";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import { Title } from "@angular/platform-browser";
import { RightBarCreatorsLeaderboardComponent } from "../../../right-bar-creators/right-bar-creators-leaderboard/right-bar-creators-leaderboard.component";
import {Router} from "@angular/router";

@Component({
  selector: "diamond-tutorial",
  templateUrl: "./diamond-tutorial.component.html",
  styleUrls: ["./diamond-tutorial.component.scss"],
})
export class DiamondTutorialComponent implements OnInit {
  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title,
    private router: Router,
  ) {}

  post: PostEntryResponse;
  // TODO: replace with prod post hash hex
  postHashHex = "3e42215a120a6e9d4848117f5829a2c4d9f692360fd14b78daea483a72d142dc";

  ngOnInit() {
    // this.isLoadingProfilesForFirstTime = true;
    this.titleService.setTitle("Diamond Tutorial - BitClout");
    this.backendApi
      .GetSinglePost(
        this.globalVars.localNode,
        this.postHashHex,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        false,
        0,
        0,
        false
      )
      .subscribe((res) => {
        // TODO: handle any errors or post not found?
        this.post = res.PostFound;
      });
    // TODO: replace with real data
  }

  onDiamondSent(): void {
    console.log("diamond sent!");
    this.router.navigate([RouteNames.TUTORIAL, RouteNames.INVEST, RouteNames.BUY_CREATOR, this.globalVars.loggedInUser.ProfileEntryResponse?.Username]);
  }
}
