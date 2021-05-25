import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "diamond-posts-page",
  templateUrl: "./diamond-posts-page.component.html",
  styleUrls: ["./diamond-posts-page.component.sass"],
})
export class DiamondPostsPageComponent {
  constructor(private globalVars: GlobalVarsService, private router: Router) {}
}
