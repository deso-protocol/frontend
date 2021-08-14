import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, PostEntryResponse, TutorialStatus } from "../../../backend-api.service";
import { RouteNames } from "../../../app-routing.module";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";

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
    private router: Router
  ) {}

  post: PostEntryResponse;
  // TODO: replace with prod post hash hex
  postHashHex = "7eba2b76e2b1851070f2740e25c1c70c64a228e226f0dff5734f19d3baca8224";
  loading: boolean = true;

  ngOnInit() {
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
      })
      .add(() => (this.loading = false));
    // TODO: replace with real data
  }

  onDiamondSent(): void {
    // this.globalVars.TutorialStatus = TutorialStatus.DIAMOND;
    this.router.navigate([
      RouteNames.TUTORIAL,
      RouteNames.INVEST,
      RouteNames.BUY_CREATOR,
      this.globalVars.loggedInUser.ProfileEntryResponse?.Username,
    ]);
  }
}
