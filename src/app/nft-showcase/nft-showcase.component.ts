import { Component, OnInit } from "@angular/core";
import { BackendApiService, NFTCollectionResponse } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "nft-showcase",
  templateUrl: "./nft-showcase.component.html",
})
export class NftShowcaseComponent implements OnInit {
  globalVars: GlobalVarsService;
  loading: boolean = false;
  nftCollections: NFTCollectionResponse[];

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.loading = true;
    this.backendApi
      .GetNFTShowcase(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.globalVars.loggedInUser.PublicKeyBase58Check
      )
      .subscribe(
        (res: any) => {
          this.nftCollections = res.NFTCollections;
          if (this.nftCollections) {
            this.nftCollections.sort((a, b) => b.HighestBidAmountNanos - a.HighestBidAmountNanos);
          }
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }
}
