import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import {
  BackendApiService,
  NFTBidData,
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
  static NOT_FOR_SALE = "Not For Sale";
  static MY_BIDS = "My Bids";
  tabs = [CreatorProfileNftsComponent.FOR_SALE, CreatorProfileNftsComponent.NOT_FOR_SALE];
  activeTab: string;

  nftTabMap = {
    my_bids: CreatorProfileNftsComponent.MY_BIDS,
    for_sale: CreatorProfileNftsComponent.FOR_SALE,
    not_for_sale: CreatorProfileNftsComponent.NOT_FOR_SALE,
  };

  nftTabInverseMap = {
    [CreatorProfileNftsComponent.FOR_SALE]: "for_sale",
    [CreatorProfileNftsComponent.MY_BIDS]: "my_bids",
    [CreatorProfileNftsComponent.NOT_FOR_SALE]: "not_for_sale",
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
    if (this.globalVars.loggedInUser.PublicKeyBase58Check === this.profile.PublicKeyBase58Check) {
      this.tabs.push(CreatorProfileNftsComponent.MY_BIDS);
    }
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.nftTab && queryParams.nftTab in this.nftTabMap) {
        this.activeTab = this.nftTabMap[queryParams.nftTab];
      }
    });

    let checkNotForSale = false;
    if (!this.activeTab) {
      this.activeTab = CreatorProfileNftsComponent.FOR_SALE;
    }
    this.isLoading = true;
    if (this.activeTab === CreatorProfileNftsComponent.MY_BIDS) {
      this.getNFTBids().add(() => (this.isLoading = false));
    } else {
      this.getNFTs(this.activeTab === CreatorProfileNftsComponent.FOR_SALE).add(() => {
        if (checkNotForSale && !this.nftResponse.length) {
          this.activeTab = CreatorProfileNftsComponent.NOT_FOR_SALE;
          this.getNFTs(false).add(() => (this.isLoading = false));
        } else {
          this.isLoading = false;
        }
      });
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
        }
      );
  }

  getNFTs(isForSale: boolean | null = null): Subscription {
    return this.backendApi
      .GetNFTsForUser(
        this.globalVars.localNode,
        this.profile.PublicKeyBase58Check,
        this.globalVars?.loggedInUser.PublicKeyBase58Check,
        isForSale
      )
      .subscribe(
        (res: {
          NFTsMap: { [k: string]: { PostEntryResponse: PostEntryResponse; NFTEntryResponses: NFTEntryResponse[] } };
        }) => {
          this.nftResponse = [];
          for (const k in res.NFTsMap) {
            this.nftResponse.push(res.NFTsMap[k]);
          }
          this.lastPage = Math.floor(this.nftResponse.length / CreatorProfileNftsComponent.PAGE_SIZE);
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
          this.resetDatasource();
        });
      } else {
        return this.getNFTs(this.activeTab === CreatorProfileNftsComponent.FOR_SALE).add(() => {
          this.resetDatasource();
        });
      }
    } else {
      return of("").subscribe((res) => res);
    }
  }

  resetDatasource(): void {
    this.datasource.adapter.reset().then(() => {
      this.loadingNewSelection = false;
      this.isLoading = false;
      this.updateNFTTabParam(event);
    });
  }

  updateNFTTabParam(event): void {
    // Update query params to reflect current tab
    const urlTree = this.router.createUrlTree([], {
      queryParams: { nftTab: this.nftTabInverseMap[event] || "for_sale" },
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
            (res) => {
              this.datasource.adapter.remove({
                predicate: ({ data }) => {
                  const currBidEntry = data as any;
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
}
