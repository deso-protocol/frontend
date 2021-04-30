import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "create-post-form",
  templateUrl: "./create-post-form.component.html",
  styleUrls: ["./create-post-form.component.scss"],
})
export class CreatePostFormComponent {
  constructor(public globalVars: GlobalVarsService, public router: Router) {}

  onPostCreated(postEntryResponse) {
    // Twitter takes you to the main feed with your post at the top. That's more work so I'm just
    // taking the user to his profile for now. Hopefully the new post appears near the top.
    // TODO: Twitter's behavior is prob better, do that instead
    this.router.navigate(
      ["/" + this.globalVars.RouteNames.USER_PREFIX, postEntryResponse.ProfileEntryResponse.Username],
      { queryParamsHandling: "merge" }
    );
  }
}
