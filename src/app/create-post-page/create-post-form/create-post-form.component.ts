import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { Router } from "@angular/router";
import { FeedComponent } from "../../feed/feed.component";
import { TutorialStatus } from "../../backend-api.service";
import * as introJs from "intro.js/intro";

@Component({
  selector: "create-post-form",
  templateUrl: "./create-post-form.component.html",
  styleUrls: ["./create-post-form.component.scss"],
})
export class CreatePostFormComponent {
  @Input() inTutorial: boolean = false;
  introJS = introJs();
  skipTutorialExitPrompt = false;
  constructor(public globalVars: GlobalVarsService, public router: Router) {}

  onPostCreated(postEntryResponse) {
    if (this.inTutorial) {
      this.exitTutorial();
      this.globalVars.loggedInUser.TutorialStatus = TutorialStatus.COMPLETE;
      this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE], {
        queryParams: { feedTab: FeedComponent.GLOBAL_TAB },
      });
      return;
    }
    // Twitter takes you to the main feed with your post at the top. That's more work so I'm just
    // taking the user to his profile for now. Hopefully the new post appears near the top.
    // TODO: Twitter's behavior is prob better, do that instead
    this.router.navigate(
      ["/" + this.globalVars.RouteNames.USER_PREFIX, postEntryResponse.ProfileEntryResponse.Username],
      { queryParamsHandling: "merge" }
    );
  }

  ngAfterViewInit() {
    if (this.inTutorial) {
      this.globalVars.preventBackButton();
      this.initiateIntro();
    }
  }

  initiateIntro() {
    setTimeout(() => this.postIntro(), 50);
  }

  postIntro() {
    this.introJS = introJs();
    const userCanExit = !this.globalVars.loggedInUser?.MustCompleteTutorial || this.globalVars.loggedInUser?.IsAdmin;
    const tooltipClass = userCanExit ? "tutorial-tooltip" : "tutorial-tooltip tutorial-header-hide";

    this.introJS.setOptions({
      tooltipClass,
      hideNext: true,
      exitOnEsc: false,
      exitOnOverlayClick: userCanExit,
      overlayOpacity: 0.8,
      steps: [
        {
          intro: `Last step! Create your first post so that other users can find you and invest in you. When you're done, <b>click the post button</b>`,
          element: document.querySelector("#tutorial-post-container"),
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
