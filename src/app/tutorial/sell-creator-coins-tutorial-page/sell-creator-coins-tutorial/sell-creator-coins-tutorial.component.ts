import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../../../backend-api.service";
import { AppRoutingModule } from "../../../app-routing.module";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "sell-creator-coins-tutorial",
  templateUrl: "./sell-creator-coins-tutorial.component.html",
  styleUrls: ["./sell-creator-coins-tutorial.component.scss"],
})
export class SellCreatorCoinsTutorialComponent implements OnInit {
  username: string;
  profile: ProfileEntryResponse;
  loading: boolean = true;

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.params.subscribe((params) => {
      if (!params.username) {
        // TODO: hmm this is fishy - some exception handling
      }
      this.username = params.username;
      this.backendApi.GetSingleProfile(this.globalVars.localNode, "", params.username).subscribe((res) => {
        // How do we want to handle the profile not found or blacklisted case in the tutorial?
        if (!res || res.IsBlacklisted) {
          this.loading = false;
          return;
        }
        this.profile = res.Profile;
        this.loading = false;
      });
    });
  }

  ngOnInit() {
    // this.isLoadingProfilesForFirstTime = true;
    this.titleService.setTitle("Buy Creator Coins Tutorial - BitClout");
    // TODO: replace with real data
  }
}
