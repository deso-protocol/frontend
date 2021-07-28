import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import {
  BackendApiService,
  NFTBidEntryResponse,
  NFTEntryResponse,
  PostEntryResponse,
  ProfileEntryResponse,
} from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { InfiniteScroller } from "../../infinite-scroller";
import { of, Subscription } from "rxjs";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

@Component({
  selector: "creator-profile-nfts",
  templateUrl: "./creator-profile-nfts.component.html",
  styleUrls: ["./creator-profile-nfts.component.scss"],
})
export class CreatorProfileNftsComponent implements OnInit {
  static PAGE_SIZE = 10;
  static BUFFER_SIZE = 5;
  static WINDOW_VIEWPORT = true;
  static PADDING = 0.5;

  @Input() profile: ProfileEntryResponse;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() showProfileAsReserved: boolean;

  nftResponse: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  myBids: NFTBidEntryResponse[];

  lastPage = null;
  isLoading = true;
  loadingNewSelection = false;
  static FOR_SALE = "For Sale";
  static MY_BIDS = "My Bids";
  static MY_GALLERY = "Gallery";
  tabs = [CreatorProfileNftsComponent.FOR_SALE, CreatorProfileNftsComponent.MY_GALLERY];
  activeTab: string;

  nftTabMap = {
    my_bids: CreatorProfileNftsComponent.MY_BIDS,
    for_sale: CreatorProfileNftsComponent.FOR_SALE,
    my_gallery: CreatorProfileNftsComponent.MY_GALLERY,
  };

  nftTabInverseMap = {
    [CreatorProfileNftsComponent.FOR_SALE]: "for_sale",
    [CreatorProfileNftsComponent.MY_BIDS]: "my_bids",
    [CreatorProfileNftsComponent.MY_GALLERY]: "my_gallery",
  };

  CreatorProfileNftsComponent = CreatorProfileNftsComponent;

  @Output() blockUser = new EventEmitter();

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    if (this.globalVars.loggedInUser?.PublicKeyBase58Check === this.profile.PublicKeyBase58Check) {
      this.tabs.push(CreatorProfileNftsComponent.MY_BIDS);
    }
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.nftTab && queryParams.nftTab in this.nftTabMap) {
        if (
          queryParams.nftTab === this.nftTabInverseMap[CreatorProfileNftsComponent.MY_BIDS] &&
          this.globalVars.loggedInUser?.PublicKeyBase58Check !== this.profile.PublicKeyBase58Check
        ) {
          this.updateNFTTabParam(CreatorProfileNftsComponent.MY_GALLERY);
        } else {
          this.onActiveTabChange(this.nftTabMap[queryParams.nftTab]);
        }
      }
    });

    if (!this.activeTab) {
      this.isLoading = true;
      let defaultTab = this.profileBelongsToLoggedInUser()
        ? CreatorProfileNftsComponent.MY_BIDS
        : CreatorProfileNftsComponent.MY_GALLERY;
      this.onActiveTabChange(defaultTab);
    }
  }

  getNFTBids(): Subscription {
    return this.backendApi
      .GetNFTBidsForUser(
        this.globalVars.localNode,
        this.profile.PublicKeyBase58Check,
        this.globalVars.loggedInUser?.PublicKeyBase58Check
      )
      .subscribe(
        (res: {
          PublicKeyBase58CheckToProfileEntryResponse: { [k: string]: ProfileEntryResponse };
          PostHashHexToPostEntryResponse: { [k: string]: PostEntryResponse };
          NFTBidEntries: NFTBidEntryResponse[];
        }) => {
          _.forIn(res.PostHashHexToPostEntryResponse, (value, key) => {
            value.ProfileEntryResponse =
              res.PublicKeyBase58CheckToProfileEntryResponse[value.PosterPublicKeyBase58Check];
            res.PostHashHexToPostEntryResponse[key] = value;
          });
          this.myBids = res.NFTBidEntries.map((bidEntry) => {
            bidEntry.PostEntryResponse = res.PostHashHexToPostEntryResponse[bidEntry.PostHashHex];
            return bidEntry;
          });
          this.lastPage = Math.floor(this.myBids.length / CreatorProfileNftsComponent.PAGE_SIZE);
          return this.myBids;
        }
      );
  }

  getNFTs(isForSale: boolean | null = null): Subscription {
    return this.backendApi
      .GetNFTsForUser(
        this.globalVars.localNode,
        this.profile.PublicKeyBase58Check,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        isForSale
      )
      .subscribe(
        (res: {
          NFTsMap: { [k: string]: { PostEntryResponse: PostEntryResponse; NFTEntryResponses: NFTEntryResponse[] } };
        }) => {
          this.nftResponse = [];
          for (const k in res.NFTsMap) {
            const responseElement = res.NFTsMap[k];
            if (
              (this.activeTab === CreatorProfileNftsComponent.MY_GALLERY &&
                responseElement.PostEntryResponse.PosterPublicKeyBase58Check !== this.profile.PublicKeyBase58Check) ||
              this.activeTab === CreatorProfileNftsComponent.FOR_SALE
            ) {
              this.nftResponse.push(responseElement);
            }
          }
          this.lastPage = Math.floor(this.nftResponse.length / CreatorProfileNftsComponent.PAGE_SIZE);
          return this.nftResponse;
        }
      );
  }

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * CreatorProfileNftsComponent.PAGE_SIZE;
    const endIdx = (page + 1) * CreatorProfileNftsComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(
        this.activeTab === CreatorProfileNftsComponent.MY_BIDS
          ? this.myBids.slice(startIdx, Math.min(endIdx, this.myBids.length))
          : this.nftResponse.slice(startIdx, Math.min(endIdx, this.nftResponse.length))
      );
    });
  }

  async _prependComment(uiPostParent, index, newComment) {
    const uiPostParentHashHex = this.globalVars.getPostContentHashHex(uiPostParent);
    await this.datasource.adapter.relax();
    await this.datasource.adapter.update({
      predicate: ({ $index, data, element }) => {
        let currentPost = (data as any) as PostEntryResponse;
        if ($index === index) {
          newComment.parentPost = currentPost;
          currentPost.Comments = currentPost.Comments || [];
          currentPost.Comments.unshift(_.cloneDeep(newComment));
          return [this.globalVars.incrementCommentCount(currentPost)];
        } else if (this.globalVars.getPostContentHashHex(currentPost) === uiPostParentHashHex) {
          // We also want to increment the comment count on any other notifications related to the same post hash hex.
          return [this.globalVars.incrementCommentCount(currentPost)];
        }
        // Leave all other items in the datasource as is.
        return true;
      },
    });
  }

  userBlocked() {
    this.blockUser.emit();
  }

  profileBelongsToLoggedInUser(): boolean {
    return (
      this.globalVars.loggedInUser?.ProfileEntryResponse &&
      this.globalVars.loggedInUser.ProfileEntryResponse.PublicKeyBase58Check === this.profile.PublicKeyBase58Check
    );
  }

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    CreatorProfileNftsComponent.PAGE_SIZE,
    this.getPage.bind(this),
    CreatorProfileNftsComponent.WINDOW_VIEWPORT,
    CreatorProfileNftsComponent.BUFFER_SIZE,
    CreatorProfileNftsComponent.PADDING
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();

  onActiveTabChange(event): Subscription {
    if (this.activeTab !== event) {
      this.activeTab = event;
      this.loadingNewSelection = true;
      this.isLoading = true;
      this.infiniteScroller.reset();
      if (this.activeTab === CreatorProfileNftsComponent.MY_BIDS) {
        return this.getNFTBids().add(() => {
          this.resetDatasource(event);
        });
      } else {
        return this.getNFTs(this.getIsForSaleValue()).add(() => {
          this.resetDatasource(event);
        });
      }
    } else {
      return of("").subscribe((res) => res);
    }
  }

  resetDatasource(event): void {
    this.infiniteScroller.reset();
    this.datasource.adapter.reset().then(() => {
      this.loadingNewSelection = false;
      this.isLoading = false;
      this.updateNFTTabParam(event);
    });
  }

  updateNFTTabParam(event): void {
    // Update query params to reflect current tab
    const urlTree = this.router.createUrlTree([], {
      queryParams: { nftTab: this.nftTabInverseMap[event] || "for_sale", tab: "nfts" },
      queryParamsHandling: "merge",
      preserveFragment: true,
    });
    this.location.go(urlTree.toString());
  }

  cancelBid(bidEntry: NFTBidEntryResponse): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Cancel Bid",
      html: `Are you sure you'd like to cancel this bid?`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.backendApi
          .CreateNFTBid(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            bidEntry.PostEntryResponse.PostHashHex,
            bidEntry.SerialNumber,
            0,
            this.globalVars.defaultFeeRateNanosPerKB
          )
          .subscribe(
            () => {
              return this.datasource.adapter.remove({
                predicate: ({ data }) => {
                  const currBidEntry = (data as any) as NFTBidEntryResponse;
                  return (
                    currBidEntry.SerialNumber === bidEntry.SerialNumber &&
                    currBidEntry.BidAmountNanos === currBidEntry.BidAmountNanos &&
                    currBidEntry.PostEntryResponse.PostHashHex === bidEntry.PostEntryResponse.PostHashHex
                  );
                },
              });
            },
            (err) => {
              console.error(err);
            }
          );
      }
    });
  }

  getIsForSaleValue(): boolean | null {
    return this.activeTab === CreatorProfileNftsComponent.MY_GALLERY ? null : true;
  }
}
