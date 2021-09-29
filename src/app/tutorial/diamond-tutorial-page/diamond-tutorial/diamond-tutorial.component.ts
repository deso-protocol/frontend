import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, PostEntryResponse, TutorialStatus } from "../../../backend-api.service";
import { RouteNames } from "../../../app-routing.module";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import * as introJs from "intro.js/intro";

@Component({
  selector: "diamond-tutorial",
  templateUrl: "./diamond-tutorial.component.html",
  styleUrls: ["./diamond-tutorial.component.scss"],
})
export class DiamondTutorialComponent implements OnInit {
  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title,
    private router: Router
  ) {}

  introJS = introJs();
  skipTutorialExitPrompt = false;
  post: PostEntryResponse;
  // Use this posthash in testnet.
  postHashHex = "3e42215a120a6e9d4848117f5829a2c4d9f692360fd14b78daea483a72d142dc";
  // postHashHex = "75f16239b57de0531f9579f3817beb0a67515e4999947f293c112fb0260178e4";
  loading: boolean = true;

  ngOnInit() {
    this.globalVars.preventBackButton();
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
    this.exitTutorial();
    this.globalVars.loggedInUser.TutorialStatus = TutorialStatus.DIAMOND;
    this.globalVars.loggedInUser.MustCompleteTutorial = false;
    this.globalVars.logEvent("diamond : send : next");
    this.router.navigate([RouteNames.TUTORIAL + "/" + RouteNames.CREATE_POST]);
  }

  ngAfterViewInit() {
    this.initiateIntro();
  }

  initiateIntro() {
    setTimeout(() => this.diamondIntro(), 50);
  }

  diamondIntro() {
    this.introJS = introJs();
    const userCanExit = !this.globalVars.loggedInUser?.MustCompleteTutorial || this.globalVars.loggedInUser?.IsAdmin;
    const tooltipClass = userCanExit ? "tutorial-tooltip" : "tutorial-tooltip tutorial-header-hide";
    const title = 'Give a Diamond <span class="ml-5px tutorial-header-step">Step 5/6</span>';
    this.introJS.setOptions({
      tooltipClass,
      hideNext: true,
      exitOnEsc: false,
      exitOnOverlayClick: userCanExit,
      overlayOpacity: 0.8,
      steps: [
        {
          title,
          intro: `Diamonds are tips that send money directly to the poster.`,
          element: document.querySelector(".feed-post-container"),
        },
        {
          title,
          intro: `<b>Click the diamond</b> to send $${this.globalVars.nanosToUSDNumber(this.globalVars.diamondLevelMap[1]).toFixed(2)}.`,
          element: document.querySelector("#diamond-button"),
        },
      ],
    });
    this.introJS.onexit(() => {
      if (!this.skipTutorialExitPrompt) {
        this.globalVars.skipTutorial(this);
      }
    });
    this.introJS.start();
  }

  tutorialCleanUp() {}

  exitTutorial() {
    this.skipTutorialExitPrompt = true;
    this.introJS.exit(true);
    this.skipTutorialExitPrompt = false;
  }
}
