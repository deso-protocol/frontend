import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { BackendApiService, ProfileEntryResponse, BalanceEntryResponse } from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { Datasource, IDatasource, IAdapter } from "ngx-ui-scroll";

@Component({
  selector: "creator-profile-hodlers",
  templateUrl: "./creator-profile-hodlers.component.html",
  styleUrls: ["./creator-profile-hodlers.component.scss"],
})
export class CreatorProfileHodlersComponent {
  showTotal = false;

  @Input() profile: ProfileEntryResponse;

  datasource: IDatasource<IAdapter<any>>;
  loadingFirstPage = true;
  loadingNextPage = false;
  pagedKeys = {
    0: "",
  };

  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  lastPage = null;

  static PAGE_SIZE = 100;
  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {
    this.datasource = this.getDatasource();
  }

  // TODO: Cleanup - Create InfiniteScroller class to de-duplicate this logic
  getDatasource() {
    return new Datasource<IAdapter<any>>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }
        const startPage = Math.floor(startIdx / CreatorProfileHodlersComponent.PAGE_SIZE);
        const endPage = Math.floor(endIdx / CreatorProfileHodlersComponent.PAGE_SIZE);

        const pageRequests: any[] = [];
        for (let i = startPage; i <= endPage; i++) {
          const existingRequest = this.pagedRequests[i];
          if (existingRequest) {
            pageRequests.push(existingRequest);
          } else {
            const newRequest = this.pagedRequests[i - 1].then((_) => {
              return this.getPage(i);
            });
            this.pagedRequests[i] = newRequest;
            pageRequests.push(newRequest);
          }
        }

        return Promise.all(pageRequests).then((pageResults) => {
          pageResults = pageResults.reduce((acc, result) => [...acc, ...result], []);
          const start = startIdx - startPage * CreatorProfileHodlersComponent.PAGE_SIZE;
          const end = start + endIdx - startIdx + 1;
          return pageResults.slice(start, end);
        });
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        padding: 0.5,
        windowViewport: true,
        infinite: true,
      },
    });
  }

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    this.loadingNextPage = true;
    const lastPublicKeyBase58Check = this.pagedKeys[page];
    return this.backendApi
      .GetHodlersForPublicKey(
        this.globalVars.localNode,
        "",
        this.profile.Username,
        lastPublicKeyBase58Check,
        CreatorProfileHodlersComponent.PAGE_SIZE,
        false,
        false
      )
      .toPromise()
      .then((res) => {
        const balanceEntryResponses: any[] = res.Hodlers;
        this.pagedKeys[page + 1] = res.LastPublicKeyBase58Check || "";
        if (
          balanceEntryResponses.length < CreatorProfileHodlersComponent.PAGE_SIZE ||
          this.pagedKeys[page + 1] === ""
        ) {
          this.lastPage = page;
          this.showTotal = true;
          if (page > 0 || (page === 0 && balanceEntryResponses.length !== 0)) {
            balanceEntryResponses.push({ totalRow: true });
          }
        }
        this.loadingNextPage = false;
        this.loadingFirstPage = false;
        return balanceEntryResponses;
      });
  }

  isRowForCreator(row: BalanceEntryResponse) {
    return row.CreatorPublicKeyBase58Check == row.HODLerPublicKeyBase58Check;
  }

  usernameStyle() {
    return {
      "max-width": this.globalVars.isMobile() ? "100px" : "200px",
    };
  }

  getTooltipForRow(row: BalanceEntryResponse): string {
    if (
      row.HODLerPublicKeyBase58Check === this.profile.PublicKeyBase58Check &&
      row.ProfileEntryResponse.IsReserved &&
      !row.ProfileEntryResponse.IsVerified
    ) {
      return `These creator coins are reserved for ${this.profile.Username}`;
    }
    return row.HasPurchased
      ? `This user has purchased some amount of $${this.profile.Username} coin.`
      : `This user has not purchased $${this.profile.Username} coin.
      The user has only received these creator coins from transfers.
      Buying any amount of this coin will change the status to "purchased."`;
  }

  stopEvent(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }
}
