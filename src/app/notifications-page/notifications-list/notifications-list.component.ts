import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { Datasource, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { AppRoutingModule } from "../../app-routing.module";

@Component({
  selector: "app-notifications-list",
  templateUrl: "./notifications-list.component.html",
  styleUrls: ["./notifications-list.component.scss"],
})
export class NotificationsListComponent implements OnInit {
  // stores a mapping of page number to promises
  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  // stores a mapping of page number to notification index
  pagedIndexes = {
    0: -1,
  };

  // stores a cache of all profiles and posts we've seen
  profileMap = {};
  postMap = {};

  // tracks if we've reached the end of all notifications
  lastPage = null;

  // constants
  pageSize = 50;

  // Track the total number of items for our empty state
  // null means we're loading items
  totalItems = null;

  // Track if we're loading notifications for the first time
  isLoading = true;

  // Track if we're loading the next page of notifications
  loadingMoreNotifications = false;
  // NOTE: I'm not super thrilled with how pagination turned out.
  // we juggle promises and indexes around in a bit of a weird fashion
  // and i'm sure there's a cleaner way to do this. for now, it works,
  // but it's begging to be refactored in the future.

  // TODO: Cleanup - Create InfiniteScroller class to de-duplicate this logic
  datasource: IDatasource = new Datasource({
    get: (index, count, success) => {
      const startIndex = Math.max(index, 0);
      const endIndex = index + count - 1;
      if (startIndex > endIndex) {
        this.isLoading = false;
        success([]); // empty result
        return;
      }

      const startPage = Math.floor(startIndex / this.pageSize);
      const endPage = Math.floor(endIndex / this.pageSize);

      const pageRequests: any[] = [];
      for (let i = startPage; i <= endPage; i++) {
        const existingRequest = this.pagedRequests[i];
        if (existingRequest) {
          pageRequests.push(existingRequest);
        } else {
          // we need to wait for the previous page before we can fetch the next one
          const newRequest = this.pagedRequests[i - 1].then((_) => {
            return this.getPage(i);
          });
          this.pagedRequests[i] = newRequest;
          pageRequests.push(newRequest);
        }
      }

      return Promise.all(pageRequests).then((pageResults) => {
        pageResults = pageResults.reduce((acc, result) => [...acc, ...result], []);
        const start = startIndex - startPage * this.pageSize;
        const end = start + endIndex - startIndex + 1;
        this.isLoading = false;
        return pageResults.slice(start, end);
      });
    },
    settings: {
      startIndex: 0,
      minIndex: 0,
      bufferSize: 10,
      windowViewport: true,
      infinite: true,
    },
  });

  constructor(private globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  ngOnInit() {}

  getPage(page: number) {
    if (this.lastPage && page > this.lastPage) {
      return [];
    }

    const fetchStartIndex = this.pagedIndexes[page];
    this.loadingMoreNotifications = true;
    return this.backendApi
      .GetNotifications(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        fetchStartIndex /*FetchStartIndex*/,
        this.pageSize /*NumToFetch*/
      )
      .toPromise()
      .then(
        (res) => {
          // add all profiles and posts to our cache maps
          Object.assign(this.profileMap, res.ProfilesByPublicKey);
          Object.assign(this.postMap, res.PostsByHash);

          // Map all notifications to a format that is easy for our template to render
          // Filter out any null notifications we couldn't process
          const chunk = res.Notifications.map((notification) => this.transformNotification(notification)).filter(
            Boolean
          );

          // Index 0 means we're done. if the array is empty we're done.
          // subtract one so we don't fetch the last notification twice
          this.pagedIndexes[page + 1] = res.Notifications[res.Notifications.length - 1]?.Index - 1 || 0;

          // if the chunk was incomplete or the Index was zero we're done
          if (chunk.length < this.pageSize || this.pagedIndexes[page + 1] === 0) {
            this.lastPage = page;
          }

          // Track the total number of items for our empty state
          this.totalItems = (this.totalItems || 0) + chunk.length;

          return chunk;
        },
        (err) => {
          console.error(this.backendApi.stringifyError(err));
        }
      )
      .finally(() => (this.loadingMoreNotifications = false));
  }

  // NOTE: the outputs of this function are inserted directly into the DOM
  // using innerHTML. you MUST sanitize any user content that gets rendered. For example,
  // we sanitize post text and image URLs because they could contain HTML characters. We
  // don't sanitize numbers or usernames because they can't contain HTML characters.
  //
  // NOTE: We support rendering unfollows and unlikes but they're currently filtered
  // out by frontend_server's TxnMetaIsNotification
  protected transformNotification(notification: any) {
    const txnMeta = notification.Metadata;
    const userPublicKeyBase58Check = this.globalVars.loggedInUser.PublicKeyBase58Check;

    if (txnMeta == null) {
      return null;
    }

    // The transactor is usually needed so parse her out and try to convert her
    // to a username.
    const actor = this.profileMap[txnMeta.TransactorPublicKeyBase58Check] || {
      Username: "anonymous",
      ProfilePic: "/assets/img/default_profile_pic.png",
    };
    const userProfile = this.profileMap[userPublicKeyBase58Check];
    const actorName = `<b>${actor.Username}</b>`;

    // We map everything to an easy-to-use object so the template
    // doesn't have to do any hard work
    const result = {
      actor, // who created the notification
      icon: null,
      action: null, // the action they took
      post: null, // the post involved
      parentPost: null, // the parent post involved
      link: AppRoutingModule.profilePath(actor.Username),
    };

    if (txnMeta.TxnType === "BASIC_TRANSFER") {
      let txnAmountNanos = 0;
      for (let ii = 0; ii < notification.TxnOutputResponses.length; ii++) {
        if (notification.TxnOutputResponses[ii].PublicKeyBase58Check === userPublicKeyBase58Check) {
          txnAmountNanos += notification.TxnOutputResponses[ii].AmountNanos;
        }
      }
      result.icon = "fas fa-money-bill-wave-alt fc-green";
      result.action = `${actorName} sent you ${this.globalVars.nanosToBitClout(txnAmountNanos)} ` +
        `$CLOUT!</b> (~${this.globalVars.nanosToUSD(txnAmountNanos, 2)})`;
      return result;
    } else if (txnMeta.TxnType === "CREATOR_COIN") {
      // If we don't have the corresponding metadata then return null.
      const ccMeta = txnMeta.CreatorCoinTxindexMetadata;
      if (!ccMeta) {
        return null;
      }

      result.icon = "fas fa-money-bill-wave-alt fc-green";

      if (ccMeta.OperationType === "buy") {
        result.action = `${actorName} bought <b>~${this.globalVars.nanosToUSD(
          ccMeta.BitCloutToSellNanos,
          2
        )}</b> worth of <b>$${userProfile.Username}</b>!`;
        return result;
      } else if (ccMeta.OperationType === "sell") {
        // TODO: We cannot compute the USD value of the sale without saving the amount of BitClout
        // that was used to complete the transaction in the backend, which we are too lazy to do.
        // So for now we just tell the user the amount of their coin that was sold.
        result.action = `${actorName} sold <b>${this.globalVars.nanosToBitClout(ccMeta.CreatorCoinToSellNanos)} $${
          userProfile.Username
        }.</b>`;
        return result;
      }
    } else if (txnMeta.TxnType === "CREATOR_COIN_TRANSFER") {
      const cctMeta = txnMeta.CreatorCoinTransferTxindexMetadata;
      if (!cctMeta) {
        return null;
      }

      if (cctMeta.DiamondLevel) {
        result.icon = "icon-diamond fc-blue";
        let postText = "";
        if (cctMeta.PostHashHex) {
          const truncatedPost = this.truncatePost(cctMeta.PostHashHex);
          postText = `<i class="text-grey7">${truncatedPost}</i>`;
          result.link = AppRoutingModule.postPath(cctMeta.PostHashHex);
        }
        result.action = `${actorName} gave <b>${cctMeta.DiamondLevel.toString()} diamond${
          cctMeta.DiamondLevel > 1 ? "s" : ""
        }</b> (~${this.globalVars.getUSDForDiamond(cctMeta.DiamondLevel)}) ${postText}`;
      } else {
        result.icon = "fas fa-paper-plane fc-blue";
        result.action = `${actorName} sent you <b>${this.globalVars.nanosToBitClout(
          cctMeta.CreatorCoinToTransferNanos,
          6
        )} ${cctMeta.CreatorUsername} coins`;
      }

      return result;
    } else if (txnMeta.TxnType === "SUBMIT_POST") {
      const spMeta = txnMeta.SubmitPostTxindexMetadata;
      if (!spMeta) {
        return null;
      }

      // Grab the hash of the post that created this notification.
      const postHash = spMeta.PostHashBeingModifiedHex;

      // Go through the affected public keys until we find ours. Then
      // return a notification based on the Metadata.
      for (const currentPkObj of txnMeta.AffectedPublicKeys) {
        if (currentPkObj.PublicKeyBase58Check !== userPublicKeyBase58Check) {
          continue;
        }

        // In this case, we are dealing with a reply to a post we made.
        if (currentPkObj.Metadata === "ParentPosterPublicKeyBase58Check") {
          result.post = this.postMap[postHash];
          result.parentPost = this.postMap[spMeta.ParentPostHashHex];
          if (result.post === null || result.parentPost === null) {
            return;
          }

          return result;
        } else if (currentPkObj.Metadata === "MentionedPublicKeyBase58Check") {
          result.post = this.postMap[postHash];
          if (result.post === null) {
            return;
          }

          return result;
        } else if (currentPkObj.Metadata === "RecloutedPublicKeyBase58Check") {
          result.post = this.postMap[postHash];
          if (result.post === null) {
            return;
          }
          return result;
        }
      }
    } else if (txnMeta.TxnType === "FOLLOW") {
      const followMeta = txnMeta.FollowTxindexMetadata;
      if (!followMeta) {
        return null;
      }

      if (followMeta.IsUnfollow) {
        result.icon = "fas fa-user fc-blue";
        result.action = `${actorName} unfollowed you`;
      } else {
        result.icon = "fas fa-user fc-blue";
        result.action = `${actorName} followed you`;
      }

      return result;
    } else if (txnMeta.TxnType === "LIKE") {
      const likeMeta = txnMeta.LikeTxindexMetadata;
      if (!likeMeta) {
        return null;
      }

      const postHash = likeMeta.PostHashHex;

      const postText = this.truncatePost(postHash);
      if (!postText) {
        return null;
      }
      const action = likeMeta.IsUnlike ? "unliked" : "liked";

      result.icon = likeMeta.IsUnlike ? "fas fa-heart-broken fc-red" : "fas fa-heart fc-red";
      result.action = `${actorName} ${action} <i class="text-grey7">${postText}</i>`;
      result.link = AppRoutingModule.postPath(postHash);

      return result;
    }

    // If we don't recognize the transaction type we return null
    return null;
  }

  truncatePost(postHashHex: any): string | null {
    const post = this.postMap[postHashHex];
    if (!post) {
      return null;
    }
    return _.truncate(_.escape(`${post.Body} ${post.ImageURLs?.[0] || ""}`));
  }

  async afterCommentCallback(uiParent, index, newComment) {
    const uiPostParentHashHex = this.globalVars.getPostContentHashHex(uiParent.post);
    await this.datasource.adapter.relax();
    await this.datasource.adapter.update({
      predicate: ({ $index, data, element }) => {
        let currentNotification = data as any;
        if ($index === index) {
          newComment.parentPost = currentNotification.post;
          currentNotification.post.Comments = currentNotification.post.Comments || [];
          currentNotification.post.Comments.unshift(_.cloneDeep(newComment));
          currentNotification.post = this.globalVars.incrementCommentCount(currentNotification.post);
          return [currentNotification];
        } else if (
          currentNotification.post &&
          this.globalVars.getPostContentHashHex(currentNotification.post) === uiPostParentHashHex
        ) {
          // We also want to increment the comment count on any other notifications related to the same post hash hex.
          currentNotification.post = this.globalVars.incrementCommentCount(currentNotification.post);
          return [currentNotification];
        }
        // Leave all other items in the datasource as is.
        return true;
      },
    });
  }
}
