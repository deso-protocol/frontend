import { Component } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "diamond-posts",
  templateUrl: "./diamond-posts.component.html",
  styleUrls: ["./diamond-posts.component.sass"],
})
export class DiamondPostsComponent {
  constructor(private globalVars: GlobalVarsService, private router: Router) {}
}
