import { Component } from "@angular/core";
import { BackendApiService, RichListEntryResponse } from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";

@Component({
  selector: "supply-monitoring-stats",
  templateUrl: "./supply-monitoring-stats.component.html",
  styleUrls: ["./supply-monitoring-stats.component.scss"],
})
export class SupplyMonitoringStatsComponent {
  static BUFFER_SIZE = 10;
  static PAGE_SIZE = 10;
  static WINDOW_VIEWPORT = true;
  totalSupplyDESO: number;
  loadingTotalSupply: boolean = true;
  failedLoadingTotalSupply: boolean = false;
  richList: RichListEntryResponse[];
  loadingRichList: boolean = true;
  failedLoadingRichList: boolean = false;
  countKeysWithDESO: number;
  loadingCountKeysWithDESO: boolean = false;
  failedLoadingCountKeysWithDESO: boolean = false;
  noSupplyMonitoring: boolean = false;
  datasource: IDatasource<IAdapter<any>> = this.getDatasource();
  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.backendApi
      .GetRichList(this.globalVars.localNode)
      .subscribe(
        (res) => {
          this.richList = res || [];
        },
        (err) => {
          this.failedLoadingRichList = true;
        }
      )
      .add(() => (this.loadingRichList = false));
    this.backendApi
      .GetTotalSupply(this.globalVars.localNode)
      .subscribe(
        (res) => {
          this.totalSupplyDESO = res;
        },
        (err) => {
          this.failedLoadingTotalSupply = true;
        }
      )
      .add(() => (this.loadingTotalSupply = false));

    this.backendApi
      .GetCountOfKeysWithDESO(this.globalVars.localNode)
      .subscribe(
        (res) => {
          this.countKeysWithDESO = res;
        },
        (err) => {
          this.failedLoadingCountKeysWithDESO = true;
        }
      )
      .add(() => (this.loadingCountKeysWithDESO = false));
  }

  getDatasource(): IDatasource<IAdapter<any>> {
    return new Datasource<IAdapter>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }
        if (endIdx + 1 > this.richList.length) {
          success(this.richList.slice(startIdx, this.richList.length) as any[]);
          return;
        }
        success(this.richList.slice(startIdx, endIdx + 1) as any[]);
        return;
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        bufferSize: 5,
        padding: 0.5,
        windowViewport: true,
        infinite: true,
      },
    });
  }
}
