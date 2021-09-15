import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { AppRoutingModule } from "../../app-routing.module";
import { InfiniteScroller } from "src/app/infinite-scroller";
import { AnimationOptions } from 'ngx-lottie';

@Component({
  selector: "app-notifications-list",
  templateUrl: "./notifications-list.component.html",
  styleUrls: ["./notifications-list.component.scss"],
})
export class NotificationsListComponent {
  static BUFFER_SIZE = 10;
  static PAGE_SIZE = 50;
  static WINDOW_VIEWPORT = true;

  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  // stores a mapping of page number to notification index
  pagedIndexes = {
    0: -1,
  };

  lastPage = null;
  loadingFirstPage = true;
  loadingNextPage = false;

  // stores a cache of all profiles and posts we've seen
  profileMap = {};
  postMap = {};

  // Track the total number of items for our empty state
  // null means we're loading items
  totalItems = null;

  getPage(page: number) {
    if (this.lastPage && page > this.lastPage) {
      return [];
    }

    this.loadingNextPage = true;
    const fetchStartIndex = this.pagedIndexes[page];
    return this.backendApi
      .GetNotifications(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        fetchStartIndex /*FetchStartIndex*/,
        NotificationsListComponent.PAGE_SIZE /*NumToFetch*/
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
          if (chunk.length < NotificationsListComponent.PAGE_SIZE || this.pagedIndexes[page + 1] === 0) {
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
      .finally(() => {
        this.loadingFirstPage = false;
        this.loadingNextPage = false;
      });
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
    const actorName = actor.IsVerified
      ? `<b>${actor.Username}</b><span class="ml-1 d-inline-block align-center text-primary fs-12px"><i class="fas fa-check-circle fa-md align-middle"></i></span>`
      : `<b>${actor.Username}</b>`;

    // We map everything to an easy-to-use object so the template
    // doesn't have to do any hard work
    const result = {
      actor, // who created the notification
      icon: null,
      iconClass: null,
      action: null, // the action they took
      post: null, // the post involved
      parentPost: null, // the parent post involved
      link: AppRoutingModule.profilePath(actor.Username),
      bidInfo: null,
      comment: null, // the text of the comment
    };

    if (txnMeta.TxnType === "BASIC_TRANSFER") {
      let txnAmountNanos = 0;
      for (let ii = 0; ii < notification.TxnOutputResponses.length; ii++) {
        if (notification.TxnOutputResponses[ii].PublicKeyBase58Check === userPublicKeyBase58Check) {
          txnAmountNanos += notification.TxnOutputResponses[ii].AmountNanos;
        }
      }
      result.icon = "coin";
      result.iconClass = "fc-blue";

      result.action =
        `${actorName} sent you ${this.globalVars.nanosToBitClout(txnAmountNanos)} ` +
        `$CLOUT!</b> (~${this.globalVars.nanosToUSD(txnAmountNanos, 2)})`;
      return result;
    } else if (txnMeta.TxnType === "CREATOR_COIN") {
      // If we don't have the corresponding metadata then return null.
      const ccMeta = txnMeta.CreatorCoinTxindexMetadata;
      if (!ccMeta) {
        return null;
      }

      result.icon = "coin";
      result.iconClass = "fc-blue";

      if (ccMeta.OperationType === "buy") {
        result.action = `${actorName} bought <b>~${this.globalVars.nanosToUSD(
          ccMeta.BitCloutToSellNanos,
          2
        )}</b> worth of <a href="/${this.globalVars.RouteNames.USER_PREFIX}/${userProfile.Username}">@${userProfile.Username}</a>!`;
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
        result.icon = "diamond";
        result.iconClass = "fc-blue";
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
        result.icon = "send";
        result.iconClass = "fc-blue";
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
          result.icon = "message-square";
          result.iconClass = "fc-blue";
          const truncatedPost = this.truncatePost(spMeta.ParentPostHashHex);
          const postContent = `<i class="fc-muted">${truncatedPost}</i>`;
          result.action = `${actorName} Replying to <a href="/${this.globalVars.RouteNames.USER_PREFIX}/${userProfile.Username}">@${userProfile.Username}</a> ${postContent}`;
          result.comment = this.postMap[postHash]?.Body;
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
          const post = this.postMap[postHash];
          result.icon = "repeat";
          result.iconClass = "fc-blue";
          const recloutAction = post.Body === "" ? "Reclouting" : "Quote reclouting";
          const recloutedPost = post.RecloutedPostEntryResponse;
          const truncatedPost = _.truncate(_.escape(`${recloutedPost.Body} ${recloutedPost.ImageURLs?.[0] || ""}`));
          const recloutedPostContent = `<i class="fc-muted">${truncatedPost}</i>`;
          // Reclout
          if (post.Body === "") {
            result.action = `${actorName} ${recloutAction} <a href="/${this.globalVars.RouteNames.USER_PREFIX}/${userProfile.Username}">@${userProfile.Username}</a> ${recloutedPostContent}`;
          } else {
            // Quote Reclout
            const truncatedQuoteReclout = this.truncatePost(postHash);
            const quoteRecloutContent = `<i class="fc-muted">"${truncatedQuoteReclout}"</i>`;
            result.action = `${actorName} ${recloutAction} <a href="/${this.globalVars.RouteNames.USER_PREFIX}/${userProfile.Username}">@${userProfile.Username}</a> ${quoteRecloutContent} ${recloutedPostContent}`;
          }
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
        result.icon = "user";
        result.iconClass = "fc-blue";
        result.action = `${actorName} unfollowed you`;
      } else {
        result.icon = "user";
        result.iconClass = "fc-blue";
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

      result.icon = likeMeta.IsUnlike ? "heart" : "heart";
      result.iconClass = likeMeta.IsUnlike ? "fc-red" : "fc-red";
      result.action = `${actorName} ${action} <i class="text-grey7">${postText}</i>`;
      result.link = AppRoutingModule.postPath(postHash);

      return result;
    } else if (txnMeta.TxnType == "NFT_BID") {
      const nftBidMeta = txnMeta.NFTBidTxindexMetadata;
      if (!nftBidMeta) {
        return null;
      }

      const postHash = nftBidMeta.NFTPostHashHex;

      const actorName = actor.Username !== "anonymous" ? actor.Username : txnMeta.TransactorPublicKeyBase58Check;
      const truncatedPost = this.truncatePost(postHash);
      const postText = `<i class="fc-muted">${truncatedPost}</i>`;
      result.action = nftBidMeta.BidAmountNanos
        ? `${actorName} bid ${this.globalVars.nanosToBitClout(
            nftBidMeta.BidAmountNanos,
            2
          )} CLOUT (~${this.globalVars.nanosToUSD(nftBidMeta.BidAmountNanos, 2)}) for serial number ${
            nftBidMeta.SerialNumber
          } ${postText}`
        : `${actorName} cancelled their bid on serial number ${nftBidMeta.SerialNumber} ${postText}`;
      result.icon = "coin";
      result.iconClass = nftBidMeta.BidAmountNanos ? "fc-blue" : "fc-red";
      result.bidInfo = { SerialNumber: nftBidMeta.SerialNumber, BidAmountNanos: nftBidMeta.BidAmountNanos };
      return result;
    } else if (txnMeta.TxnType == "ACCEPT_NFT_BID") {
      const acceptNFTBidMeta = txnMeta.AcceptNFTBidTxindexMetadata;
      if (!acceptNFTBidMeta) {
        return null;
      }

      const postHash = acceptNFTBidMeta.NFTPostHashHex;

      result.post = this.postMap[postHash];
      result.action = `${actor.Username} accepted your bid of ${this.globalVars.nanosToBitClout(
        acceptNFTBidMeta.BidAmountNanos,
        2
      )} for serial number ${acceptNFTBidMeta.SerialNumber}`;
      result.icon = "award";
      result.iconClass = "fc-blue";
      result.bidInfo = { SerialNumber: acceptNFTBidMeta.SerialNumber, BidAmountNanos: acceptNFTBidMeta.BidAmountNanos };
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

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    NotificationsListComponent.PAGE_SIZE,
    this.getPage.bind(this),
    NotificationsListComponent.WINDOW_VIEWPORT,
    NotificationsListComponent.BUFFER_SIZE
  );
  datasource: IDatasource<IAdapter<PostEntryResponse>> = this.infiniteScroller.getDatasource();
}
