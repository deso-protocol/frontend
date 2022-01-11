import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Title } from "@angular/platform-browser";
import { environment } from "src/environments/environment";

@Component({
  selector: "buy-deso-page",
  templateUrl: "./buy-deso-page.component.html",
  styleUrls: ["./buy-deso-page.component.scss"],
})
export class BuyDeSoPageComponent implements OnInit {
  isLeftBarMobileOpen: boolean = false;

  ngOnInit() {
    this.titleService.setTitle(`Buy $DESO - ${environment.node.name}`);
  }

  constructor(public globalVars: GlobalVarsService, private titleService: Title) {}
}
