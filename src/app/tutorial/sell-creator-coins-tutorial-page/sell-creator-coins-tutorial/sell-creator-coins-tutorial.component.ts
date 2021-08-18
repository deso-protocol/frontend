import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../../../backend-api.service";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";

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
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe((params) => {
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
    this.titleService.setTitle("Buy Creator Coins Tutorial - BitClout");
  }
}
