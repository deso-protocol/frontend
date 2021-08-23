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
  postHashHex = "75f16239b57de0531f9579f3817beb0a67515e4999947f293c112fb0260178e4";
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
        this.post = res.PostFound;
      })
      .add(() => (this.loading = false));
  }

  onDiamondSent(): void {
    this.globalVars.loggedInUser.TutorialStatus = TutorialStatus.DIAMOND;
    this.globalVars.logEvent("diamond : send : next");
    this.router.navigate([RouteNames.TUTORIAL + "/" + RouteNames.CREATE_POST]);
  }
}
