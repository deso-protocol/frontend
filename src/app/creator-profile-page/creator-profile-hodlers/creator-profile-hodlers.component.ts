import { Component, Input } from "@angular/core";
import { BackendApiService, ProfileEntryResponse, BalanceEntryResponse } from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { IDatasource, IAdapter } from "ngx-ui-scroll";
import { InfiniteScroller } from "src/app/infinite-scroller";

@Component({
  selector: "creator-profile-hodlers",
  templateUrl: "./creator-profile-hodlers.component.html",
  styleUrls: ["./creator-profile-hodlers.component.scss"],
})
export class CreatorProfileHodlersComponent {
  static PAGE_SIZE = 100;
  static WINDOW_VIEWPORT = true;
  static BUFFER_SIZE = 5; // todo anna: do we want 5 or default?

  constructor(private globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  @Input() profile: ProfileEntryResponse;

  showTotal = false;
  lastPage = null;
  loadingFirstPage = true;
  loadingNextPage = false;
  pagedKeys = {
    0: "",
  };

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

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    CreatorProfileHodlersComponent.PAGE_SIZE,
    this.getPage.bind(this),
    CreatorProfileHodlersComponent.WINDOW_VIEWPORT,
    CreatorProfileHodlersComponent.BUFFER_SIZE
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();
}
