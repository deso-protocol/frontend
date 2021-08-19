import { Component, OnInit } from "@angular/core";
import { BackendApiService, NFTCollectionResponse } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { InfiniteScroller } from "../infinite-scroller";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import { uniqBy } from "lodash";

@Component({
  selector: "nft-showcase",
  templateUrl: "./nft-showcase.component.html",
})
export class NftShowcaseComponent implements OnInit {
  globalVars: GlobalVarsService;
  loading: boolean = false;
  nftCollections: NFTCollectionResponse[];
  lastPage: number;
  static PAGE_SIZE = 20;
  static WINDOW_VIEWPORT = true;
  static BUFFER_SIZE = 5;
  static PADDING = 0.5;

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    NftShowcaseComponent.PAGE_SIZE,
    this.getPage.bind(this),
    NftShowcaseComponent.WINDOW_VIEWPORT,
    NftShowcaseComponent.BUFFER_SIZE,
    NftShowcaseComponent.PADDING
  );

  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.loading = true;
    this.backendApi
      .GetNFTShowcase(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.globalVars.loggedInUser?.PublicKeyBase58Check
      )
      .subscribe(
        (res: any) => {
          this.nftCollections = res.NFTCollections;
          if (this.nftCollections) {
            this.nftCollections.sort((a, b) => b.HighestBidAmountNanos - a.HighestBidAmountNanos);
            this.nftCollections = uniqBy(
              this.nftCollections,
              (nftCollection) => nftCollection.PostEntryResponse.PostHashHex
            );
          }
          this.lastPage = Math.floor(this.nftCollections?.length / NftShowcaseComponent.PAGE_SIZE);
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * NftShowcaseComponent.PAGE_SIZE;
    const endIdx = (page + 1) * NftShowcaseComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(this.nftCollections.slice(startIdx, Math.min(endIdx, this.nftCollections.length)));
    });
  }
}
