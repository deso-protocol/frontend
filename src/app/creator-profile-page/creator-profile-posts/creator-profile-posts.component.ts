import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { BackendApiService, PostEntryResponse, ProfileEntryResponse } from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";

@Component({
  selector: "creator-profile-posts",
  templateUrl: "./creator-profile-posts.component.html",
  styleUrls: ["./creator-profile-posts.component.scss"],
})
export class CreatorProfilePostsComponent {
  static PAGE_SIZE = 10;
  @Input() profile: ProfileEntryResponse;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() showProfileAsReserved: boolean;

  datasource: IDatasource<IAdapter<PostEntryResponse>> = this.getDatasource();
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

  @Output() blockUser = new EventEmitter();

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {
    // this.datasource = this.getDatasource();
  }

  // TODO: Cleanup - Create InfiniteScroller class to de-duplicate this logic
  getDatasource() {
    return new Datasource<IAdapter<PostEntryResponse>>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }
        const startPage = Math.floor(startIdx / CreatorProfilePostsComponent.PAGE_SIZE);
        const endPage = Math.floor(endIdx / CreatorProfilePostsComponent.PAGE_SIZE);

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
          const start = startIdx - startPage * CreatorProfilePostsComponent.PAGE_SIZE;
          const end = start + endIdx - startIdx + 1;
          return pageResults.slice(start, end);
        });
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        bufferSize: 10,
        padding: 0.25,
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
    const lastPostHashHex = this.pagedKeys[page];
    return this.backendApi
      .GetPostsForPublicKey(
        this.globalVars.localNode,
        "",
        this.profile.Username,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        lastPostHashHex,
        CreatorProfilePostsComponent.PAGE_SIZE,
        false /*MediaRequired*/
      )
      .toPromise()
      .then((res) => {
        const posts: PostEntryResponse[] = res.Posts;
        this.pagedKeys[page + 1] = res.LastPostHashHex || "";
        if (!posts || posts.length < CreatorProfilePostsComponent.PAGE_SIZE || this.pagedKeys[page + 1] === "") {
          this.lastPage = page;
        }

        posts.map((post) => (post.ProfileEntryResponse = this.profile));
        return posts;
      })
      .finally(() => {
        this.loadingFirstPage = false;
        this.loadingNextPage = false;
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
}
