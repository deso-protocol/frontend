import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "right-bar-creators",
  templateUrl: "./right-bar-creators.component.html",
  styleUrls: ["./right-bar-creators.component.sass"],
})
export class RightBarCreatorsComponent {
  constructor(public globalVars: GlobalVarsService) {}

  chartOptions = [
    { name: "Gainers", width: 100 },
    { name: "Diamonded Creators", width: 200 },
    { name: "Community Projects", width: 200 },
  ];

  chartWidthMap = {
    Gainers: 100,
    "Diamonded Creators": 200,
    "Community Projects": 200,
  };
  setSelectWidth(selectedTab: string) {
    // console.log(width);
    const width = this.chartWidthMap[selectedTab];
    const selectElement = document.getElementById("right-bar-chart-select");
    selectElement.style.width = width + "px";
  }
}
