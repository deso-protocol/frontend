import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";

class RightBarTabOption {
  name: string;
  width: number;
}

@Component({
  selector: "right-bar-creators",
  templateUrl: "./right-bar-creators.component.html",
  styleUrls: ["./right-bar-creators.component.sass"],
})
export class RightBarCreatorsComponent implements OnInit {
  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  activeTab: string;

  static RightBarTabKey = "RightBarTab";

  static GAINERS: RightBarTabOption = { name: "Gainers", width: 90 };
  static DIAMONDS: RightBarTabOption = { name: "Diamonded Creators", width: 190 };
  static COMMUNITY: RightBarTabOption = { name: "Community Projects", width: 190 };

  chartMap = {
    [RightBarCreatorsComponent.GAINERS.name]: RightBarCreatorsComponent.GAINERS,
    [RightBarCreatorsComponent.DIAMONDS.name]: RightBarCreatorsComponent.DIAMONDS,
    [RightBarCreatorsComponent.COMMUNITY.name]: RightBarCreatorsComponent.COMMUNITY,
  };

  ngOnInit() {
    const defaultTab = this.backendApi.GetStorage(RightBarCreatorsComponent.RightBarTabKey);
    this.activeTab = defaultTab in this.chartMap ? defaultTab : RightBarCreatorsComponent.GAINERS.name;
    this.selectTab();
  }

  selectTab() {
    console.log(JSON.stringify(this.activeTab));
    const rightTabOption = this.chartMap[this.activeTab];
    const selectElement = document.getElementById("right-bar-chart-select");
    selectElement.style.width = rightTabOption.width + "px";
    this.backendApi.SetStorage(RightBarCreatorsComponent.RightBarTabKey, this.activeTab);
  }
}
