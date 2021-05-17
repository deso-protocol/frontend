import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";

class RightBarTabOption {
  name: string;
  width: number;
  poweredBy: {
    name: string;
    link: string;
  };
}

@Component({
  selector: "right-bar-creators",
  templateUrl: "./right-bar-creators.component.html",
  styleUrls: ["./right-bar-creators.component.sass"],
})
export class RightBarCreatorsComponent implements OnInit {
  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  activeTab: string;
  selectedOptionWidth: string;
  activeRightTabOption: RightBarTabOption;

  static RightBarTabKey = "RightBarTab";

  static GAINERS: RightBarTabOption = {
    name: "Top Daily Gainers",
    width: 175,
    poweredBy: { name: "BitClout Pulse", link: "https://bitcloutpulse.com" },
  };
  static DIAMONDS: RightBarTabOption = {
    name: "Top Daily Diamonded Creators",
    width: 275,
    poweredBy: { name: "BitClout Pulse", link: "https://bitcloutpulse.com" },
  };
  static COMMUNITY: RightBarTabOption = {
    name: "Top Community Projects",
    width: 225,
    poweredBy: { name: "BitHunt", link: "https://bithunt.com" },
  };

  chartMap = {
    [RightBarCreatorsComponent.GAINERS.name]: RightBarCreatorsComponent.GAINERS,
    [RightBarCreatorsComponent.DIAMONDS.name]: RightBarCreatorsComponent.DIAMONDS,
    [RightBarCreatorsComponent.COMMUNITY.name]: RightBarCreatorsComponent.COMMUNITY,
  };

  ngOnInit() {
    const defaultTab = this.backendApi.GetStorage(RightBarCreatorsComponent.RightBarTabKey);
    this.activeTab = defaultTab in this.chartMap ? defaultTab : this.selectRandomTab();
    this.selectTab(true);
  }

  selectRandomTab(): string {
    const keys = Object.keys(this.chartMap);
    return keys[(keys.length * Math.random()) << 0];
  }

  selectTab(skipStorage: boolean = false) {
    const rightTabOption = this.chartMap[this.activeTab];
    this.activeRightTabOption = rightTabOption;
    this.selectedOptionWidth = rightTabOption.width + "px";
    if (!skipStorage) {
      this.backendApi.SetStorage(RightBarCreatorsComponent.RightBarTabKey, this.activeTab);
    }
  }
}
