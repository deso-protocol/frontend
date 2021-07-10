import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import {
  BackendApiService,
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

  lastPage = null;
  isLoading = true;
  // loadingFirstPage = true;
  // loadingNextPage = false;

  pagedKeys = {
    0: "",
  };

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
    this.backendApi
      .GetNFTsForUser(
        this.globalVars.localNode,
        this.profile.PublicKeyBase58Check,
        this.globalVars?.loggedInUser.PublicKeyBase58Check,
        true
      )
      .subscribe(
        (res: {
          NFTsMap: { [k: string]: { PostEntryResponse: PostEntryResponse; NFTEntryResponses: NFTEntryResponse[] } };
        }) => {
          this.nftResponse = [];
          for (const k in res.NFTsMap) {
            const nftEntry = res.NFTsMap[k];
            nftEntry.PostEntryResponse.ProfileEntryResponse = this.profile;
            this.nftResponse.push(nftEntry);
          }
          this.lastPage = Math.floor(this.nftResponse.length / CreatorProfileNftsComponent.PAGE_SIZE);
        }
      )
      .add(() => {
        this.isLoading = false;
      });
  }

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    return new Promise((resolve, reject) => {
      resolve(
        this.nftResponse.slice(
          page * CreatorProfileNftsComponent.PAGE_SIZE,
          Math.min((page + 1) * CreatorProfileNftsComponent.PAGE_SIZE, this.nftResponse.length)
        )
      );
    });
    // if (this.lastPage != null && page > this.lastPage) {
    //   return [];
    // }
    // this.loadingNextPage = true;
    // const lastPostHashHex = this.pagedKeys[page];
    // return this.backendApi
    //   .GetNFTsForUser(
    //     this.globalVars.localNode,
    //     this.profile.Username,
    //     this.globalVars.loggedInUser?.PublicKeyBase58Check,
    //     true,
    //     page * CreatorProfileNftsComponent.PAGE_SIZE,
    //     CreatorProfileNftsComponent.PAGE_SIZE
    //   )
    //   .toPromise()
    //   .then((res) => {
    //     const nftEntries: NFTEntryResponse[] = res.NFTEntries;
    //     nftEntries.map((nftEntry) => (nftEntry.PostEntryResponse.ProfileEntryResponse = this.profile));
    //     return nftEntries;
    //   })
    //   .finally(() => {
    //     this.loadingFirstPage = false;
    //     this.loadingNextPage = false;
    //   });
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
}
