import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { FeedComponent } from "../../feed/feed.component";
import { Datasource, IDatasource, IAdapter } from "ngx-ui-scroll";
import { ToastrService } from "ngx-toastr";
import { Title } from "@angular/platform-browser";

import * as _ from "lodash";

@Component({
  selector: "post-thread",
  templateUrl: "./post-thread.component.html",
  styleUrls: ["./post-thread.component.scss"],
})
export class PostThreadComponent {
  currentPost;
  currentPostHashHex: string;
  scrollingDisabled = false;
  showToast = false;
  commentLimit = 20;
  datasource: IDatasource<IAdapter<any>>;

  @Input() hideHeader: boolean = false;
  @Input() hideCurrentPost: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private changeRef: ChangeDetectorRef,
    private toastr: ToastrService,
    private titleService: Title
  ) {
    // This line forces the component to reload when only a url param changes.  Without this, the UiScroll component
    // behaves strangely and can reuse data from a previous post.
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.datasource = this.getDataSource();
    this.route.params.subscribe((params) => {
      this._setStateFromActivatedRoute(route);
    });
  }

  _rerenderThread() {
    // Force angular to re-render the whole thread tree by cloning currentPost
    // If we don't do this, the parent's commentCount won't always update (angular won't
    // be able to detect a change)
    //
    // Note: this may lead to performance issues in a big thread, so this may not be
    // a good long-term solution
    this.currentPost = _.cloneDeep(this.currentPost);
  }

  // TODO: Cleanup - Update InfiniteScroller class to de-duplicate this logic
  getDataSource() {
    return new Datasource<IAdapter<any>>({
      get: (index, count, success) => {
        const comments = this.currentPost.Comments || [];
        if (!comments || (this.scrollingDisabled && index > comments.length)) {
          success([]);
          return;
        }
        if (index + count < comments.length || (index + count > comments.length && this.scrollingDisabled)) {
          // MinIndex doesn't actually prevent us from going below 0, causing initial posts to disappear on long thread
          if (index < 0) {
            index = 0;
          }
          success(comments.slice(index, index + count));
          return;
        }

        this.getPost(false, index, count).subscribe(
          (res) => {
            // If we got more comments, push them onto the list of comments, increase comment count
            // and determine if we should continue scrolling
            if (res.PostFound.Comments) {
              if (res.PostFound.Comments.length < count) {
                this.scrollingDisabled = true;
              }
              if (this.currentPost.Comments) {
                this.currentPost.Comments.push(...res.PostFound.Comments);
                // Make sure we don't have duplicate comments
                this.currentPost.Comments = _.uniqBy(this.currentPost.Comments, "PostHashHex");
              }
              success(this.currentPost.Comments.slice(index, index + count));
              return;
            } else {
              // If there are no more comments, we should stop scrolling
              this.scrollingDisabled = true;
              success([]);
              return;
            }
          },
          (err) => {
            // TODO: post threads: rollbar
            console.error(err);
            this.router.navigateByUrl("/" + this.globalVars.RouteNames.NOT_FOUND, { skipLocationChange: true });
          }
        );
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        bufferSize: 10,
        windowViewport: true,
        infinite: true,
      },
    });
  }

  // Call this when the post object in the datasource is outdated. Typically this is called
  // after we updated the comment count. This replaces the outdated object with the new object.
  replacePostInDatasource(datasourceAdapter, postEntryResponse) {
    datasourceAdapter.replace({
      predicate: ({ data }) => (data as any).PostHashHex === postEntryResponse.PostHashHex,
      items: [postEntryResponse],
    });
  }

  appendToSubcommentList(postWithComments, postWithCommentsParent, postEntryResponse) {
    this.appendSubcomment(postEntryResponse, postWithComments, true /* shouldAppend */);
  }

  // Appends newPost to uiParentPost's Comments array, and updates CommentCounts as needed
  //
  // newPost is the post the user created
  //
  // uiParentPost is the "parent" in the UI - the post that we're attaching newPost to in the UI.
  // We attach newPost by adding to uiParentPost's Comments array. This is arguably very confusing,
  // since newPost is not neccesarily a comment on uiParentPost. We should probably change this.
  //
  // uiParentPost may not be the same as the "true parent" - the post that the user actually responded to
  // when creating newPost.
  //
  // If shouldAppend is true, this appends newPost to uiParentPost's Comments. Otherwise,
  // this prepends to uiParentPost's Comments.
  //
  // All posts are postEntryResponses
  //
  // Note: I removed grandparent comment count incrementing on here. From a UX perspective,
  // I personally found it more confusing than useful.
  async appendSubcomment(newPost, uiParentPost, shouldAppend) {
    let trueParentPost = await this._findTrueParentOfPost(newPost);
    let trueParentPostHashHex = trueParentPost.PostHashHex;

    await this.datasource.adapter.relax(); // Wait until it's ok to modify the data
    await this.datasource.adapter.update({
      predicate: ({ $index, data, element }) => {
        let currentPost = data as any;

        // If the current post is the true parent, increment the true parent's commentCount
        if (currentPost.PostHashHex == trueParentPostHashHex) {
          currentPost.CommentCount += 1;
        }

        // If current post is the UI parent, update the UI parent's comments array to
        // include the currentPost.
        if (currentPost.PostHashHex == uiParentPost.PostHashHex) {
          // Look for the true parent within the comments.
          // If they're in there, bump up their comment count.
          for (let [index, comment] of (currentPost.Comments || []).entries()) {
            if (comment.PostHashHex == trueParentPostHashHex) {
              comment.CommentCount += 1;
              // Need to clone here to force an angular re-render. Otherwise, when commenting
              // on another subcomment, the subcomment comment count won't update.
              currentPost.Comments[index] = _.cloneDeep(comment);
            }
          }

          // Push onto uiParentPost's Comments array
          currentPost.Comments = currentPost.Comments || [];

          if (shouldAppend) {
            currentPost.Comments.push(newPost);
          } else {
            currentPost.Comments.unshift(newPost);
          }
        }

        // Need to clone here to force an angular re-render. Otherwise, when commenting on
        // a comment, the parent comment count won't update.
        currentPost = _.cloneDeep(currentPost);

        return [currentPost];
      },
    });
  }

  // Returns a flat array of all posts in the data source
  async _allPosts() {
    let posts = [];

    // Update is a hack. I just need some way to iterate over all the posts in the datasource.
    // It'd be better if there were an explicit iteration method, but I don't think it exists
    // (at least not at the time of writing).
    await this.datasource.adapter.update({
      predicate: ({ $index, data, element }) => {
        let currentPost = data as any;

        posts.push(currentPost);
        posts = posts.concat(currentPost.Comments || []);

        return true;
      },
    });

    return posts;
  }

  // Iterates over all the posts in datasource and returns the "true parent" of postEntryResponse.
  // The true parent is the post that postEntryResponse is a reply to.
  async _findTrueParentOfPost(postEntryResponse) {
    if (!postEntryResponse) {
      return null;
    }
    let allPosts = await this._allPosts();

    const trueParentPostIndex = allPosts.findIndex((post) => {
      return post.PostHashHex === postEntryResponse.ParentStakeID;
    });

    return allPosts[trueParentPostIndex];
  }

  updateCommentCountAndShowToast(parentPost, postEntryResponse) {
    parentPost.CommentCount += 1;

    // Show toast when adding comment to parent post
    this.toastr.info("Your post was sent!", null, { positionClass: "toast-top-center", timeOut: 3000 });
  }

  prependToCommentList(parentPost, postEntryResponse) {
    parentPost.CommentCount += 1;

    // Prepend the comment to the scroll datasource
    this.datasource.adapter.prepend(postEntryResponse);
    this.currentPost.ParentPosts.map((parentPost) => parentPost.CommentCount++);
  }

  prependToSubcommentList(postWithComments, postWithCommentsParent, postEntryResponse) {
    this.appendSubcomment(postEntryResponse, postWithComments, false /* shouldAppend */);
  }

  onPostHidden(hiddenPostEntryResponse, parentPostEntryResponse, grandparentPostEntryResponse) {
    if (parentPostEntryResponse == null) {
      // TODO: this has a bug. Posts cached in the global state can still show up in the
      // user's the global feed after deletion.
      // deleted the root post, redirect home
      this.router.navigate(["/"], { queryParamsHandling: "merge" });
    } else {
      this.onCommentHidden(hiddenPostEntryResponse, parentPostEntryResponse, grandparentPostEntryResponse);
    }
  }

  // Note: there are definitely issues here where we're decrementing parent/grandparent CommentCounts
  // by the incorrect amount in many cases. For example, when adding a new comment and subcomment,
  // the frontend is currently only incrementing the parent, so this only decrements the parent.
  // However, the backend is incrementing both the parent and grandparent. We should revisit / unify
  // all this stuff.
  async onCommentHidden(hiddenPostEntryResponse, parentPostEntryResponse, grandparentPostEntryResponse) {
    let allPosts = await this._allPosts();
    FeedComponent.onPostHidden(allPosts, hiddenPostEntryResponse, parentPostEntryResponse, null);

    // This seems a little off. We're decrementing all the way up the tree, but I think
    // our comment counts only take into account two layers. TODO: reconsider this
    if (parentPostEntryResponse.PostHashHex === this.currentPostHashHex) {
      this.currentPost.ParentPosts.map((parentPost) => parentPost.CommentCount--);
    }

    // Remove hidden post from datasource if it's in there. Note: It may not be in there if
    // it's a reply to a subcomment.
    this.datasource.adapter.remove({
      predicate: ({ data }) => {
        return (data as any).PostHashHex === hiddenPostEntryResponse.PostHashHex;
      },
    });
  }

  getPost(fetchParents: boolean = true, commentOffset: number = 0, commentLimit: number = this.commentLimit) {
    // Hit the Get Single Post endpoint with specific parameters
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }
    return this.backendApi.GetSinglePost(
      this.globalVars.localNode,
      this.currentPostHashHex /*PostHashHex*/,
      readerPubKey /*ReaderPublicKeyBase58Check*/,
      fetchParents,
      commentOffset,
      commentLimit,
      this.globalVars.showAdminTools() /*AddGlobalFeedBool*/
    );
  }

  refreshPosts() {
    // Fetch the post entry
    this.getPost().subscribe(
      (res) => {
        if (!res || !res.PostFound) {
          this.router.navigateByUrl("/" + this.globalVars.RouteNames.NOT_FOUND, { skipLocationChange: true });
          return;
        }
        if (
          res.PostFound.IsNFT &&
          (!this.route.snapshot.url.length || this.route.snapshot.url[0].path != this.globalVars.RouteNames.NFT)
        ) {
          this.router.navigate(["/" + this.globalVars.RouteNames.NFT, this.currentPostHashHex], {
            queryParamsHandling: "merge",
          });
          return;
        }
        // Set current post
        this.currentPost = res.PostFound;
        this.titleService.setTitle(this.currentPost.ProfileEntryResponse.Username + " on BitClout");
      },
      (err) => {
        // TODO: post threads: rollbar
        console.error(err);
        this.router.navigateByUrl("/" + this.globalVars.RouteNames.NOT_FOUND, { skipLocationChange: true });
      }
    );
  }

  _setStateFromActivatedRoute(route) {
    // get the username of the target user (user whose followers / following we're obtaining)
    this.currentPostHashHex = route.snapshot.params.postHashHex;

    // it's important that we call this here and not in ngOnInit. Angular does not reload components when only a param changes.
    // We are responsible for refreshing the components.
    // if the user is on a thread page and clicks on a comment, the currentPostHashHex will change, but angular won't "load a new
    // page" and re-render the whole component using the new post hash. instead, angular will
    // continue using the current component and merely change the URL. so we need to explictly
    // refresh the posts every time the route changes.
    this.refreshPosts();
    this.datasource.adapter.reset();
  }

  isPostBlocked(post: any): boolean {
    return this.globalVars.hasUserBlockedCreator(post.PosterPublicKeyBase58Check);
  }

  afterUserBlocked(blockedPubKey: any) {
    this.globalVars.loggedInUser.BlockedPubKeys[blockedPubKey] = {};
  }
}
