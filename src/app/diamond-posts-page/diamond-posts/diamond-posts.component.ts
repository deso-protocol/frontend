import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";
import { BackendApiService, DiamondsPost, PostEntryResponse, ProfileEntryResponse } from "../../backend-api.service";
import * as _ from "lodash";

@Component({
  selector: "diamond-posts",
  templateUrl: "./diamond-posts.component.html",
  styleUrls: ["./diamond-posts.component.sass"],
})
export class DiamondPostsComponent {
  constructor(
    public globalVars: GlobalVarsService,
    private router: Router,
    private backendApi: BackendApiService,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe((params) => {
      this.receiverUsername = params.receiver;
      this.senderUsername = params.sender;
    });
  }

  receiverUsername: string;
  senderUsername: string;

  receiverProfileEntryResponse: ProfileEntryResponse;
  senderProfileEntryResponse: ProfileEntryResponse;

  datasource: IDatasource<IAdapter<any>> = this.getDatasource();
  loadingFirstPage = true;
  loadingNextPage = false;
  pagedKeys = {
    0: "",
  };

  lastDiamondLevelOnPage = {
    0: 0,
  };

  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  lastPage = null;

  static PAGE_SIZE = 10;

  getDatasource() {
    return new Datasource<IAdapter<DiamondsPost>>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }
        const startPage = Math.floor(startIdx / DiamondPostsComponent.PAGE_SIZE);
        const endPage = Math.floor(endIdx / DiamondPostsComponent.PAGE_SIZE);

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
          const start = startIdx - startPage * DiamondPostsComponent.PAGE_SIZE;
          const end = start + endIdx - startIdx + 1;
          return pageResults.slice(start, end);
        });
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        bufferSize: 10,
        windowViewport: true,
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
      .GetDiamondedPosts(
        this.globalVars.localNode,
        "",
        this.receiverUsername,
        "",
        this.senderUsername,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        lastPostHashHex,
        DiamondPostsComponent.PAGE_SIZE
      )
      .toPromise()
      .then((res) => {
        const posts: PostEntryResponse[] = res.DiamondedPosts;
        this.pagedKeys[page + 1] = posts.length > 0 ? posts[posts.length - 1].PostHashHex : "";
        this.lastDiamondLevelOnPage[page] = posts.length > 0 ? posts[posts.length - 1].DiamondsFromSender : -1;
        if (!posts || posts.length < DiamondPostsComponent.PAGE_SIZE || this.pagedKeys[page + 1] === "") {
          this.lastPage = page;
        }
        if (!this.receiverProfileEntryResponse) {
          this.receiverProfileEntryResponse = res.ReceiverProfileEntryResponse;
        }
        if (!this.senderProfileEntryResponse) {
          this.senderProfileEntryResponse = res.SenderProfileEntryResponse;
        }
        const diamondPosts = posts.map((post) => {
          post.ProfileEntryResponse = res.ReceiverProfileEntryResponse
          const diamondPost = new DiamondsPost();
          diamondPost.Post = post;
          return diamondPost;
        });

        let lastDiamondLevel = this.lastDiamondLevelOnPage[page - 1];
        for (let ii = 0; ii < diamondPosts.length; ii++) {
          diamondPosts[ii].Post.ProfileEntryResponse = this.receiverProfileEntryResponse;
          if (diamondPosts[ii].Post.DiamondsFromSender != lastDiamondLevel) {
            diamondPosts[ii].ShowDiamondDivider = true;
            lastDiamondLevel = diamondPosts[ii].Post.DiamondsFromSender;
          }
        }
        return diamondPosts;
      })
      .finally(() => {
        this.loadingFirstPage = false;
        this.loadingNextPage = false;
      });
  }

  diamondArray(n: number): Array<number> {
    return Array(n);
  }

  async _prependComment(uiPostParent, newComment) {
    await this.datasource.adapter.relax();
    await this.datasource.adapter.update({
      predicate: ({ $index, data, element }) => {
        let currentPost = (data as any) as PostEntryResponse;
        if (currentPost.PostHashHex === uiPostParent.PostHashHex) {
          newComment.parentPost = currentPost;
          currentPost.Comments = currentPost.Comments || [];
          currentPost.Comments.unshift(_.cloneDeep(newComment));
          currentPost.CommentCount += 1;
        }
        currentPost = _.cloneDeep(currentPost);
        return [currentPost];
      },
    });
  }
}
