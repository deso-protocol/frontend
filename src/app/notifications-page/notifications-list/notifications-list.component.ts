import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { Datasource, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { AppRoutingModule } from "../../app-routing.module";
import { Apollo, gql } from "apollo-angular";
import { forkJoin, Observable, of, zip } from "rxjs";
import { map } from "lodash";
import { switchMap } from "rxjs/operators";
import { not } from "@angular/compiler/src/output/output_ast";

const NOTIFICATIONS_QUERY = gql`
  query NotificationsQuery($publicKey: String!) {
    notifications(publicKey: $publicKey) {
      transactionHash
      postHash
      amount
      type
      timestamp
      from {
        name
      }
    }
  }
`;

enum NotificationType {
  SendBitClout = 1,
  Like = 2,
  Follow = 3,
  CoinPurchase = 4,
  CoinTransfer = 5,
  CoinDiamond = 6,
  PostMention = 7,
  PostReply = 8,
  PostReclout = 9,
}

@Component({
  selector: "app-notifications-list",
  templateUrl: "./notifications-list.component.html",
  styleUrls: ["./notifications-list.component.scss"],
})
export class NotificationsListComponent implements OnInit {
  // stores a mapping of page number to promises
  pagedRequests = {
    "-1": of([]),
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
          const newRequest = this.getPageGraph(i);
          this.pagedRequests[i] = newRequest;
          pageRequests.push(newRequest);
        }
      }

      forkJoin(pageRequests).subscribe((pageResults) => {
          const start = startIndex - startPage * this.pageSize;
          const end = start + endIndex - startIndex + 1;
          this.isLoading = false;
          this.loadingMoreNotifications = false;
          success(pageResults.slice(start, end));
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

  constructor(
    private globalVars: GlobalVarsService, 
    private backendApi: BackendApiService,
    private apollo: Apollo
  ) {}

  ngOnInit() {}

  getPageGraph(page: number) {
    if (this.lastPage && page > this.lastPage) {
      return [];
    }

    const fetchStartIndex = this.pagedIndexes[page];
    this.loadingMoreNotifications = true;

    return this.apollo.query({
      query: NOTIFICATIONS_QUERY,
      variables: {
        publicKey: this.globalVars.loggedInUser.PublicKeyBase58Check
      }
    }).pipe(switchMap((res) => {
      const notifications = (res.data as any).notifications;

        // Map all notifications to a format that is easy for our template to render
        // Filter out any null notifications we couldn't process
        const chunk = notifications.map((notification) => this.transformNotificationGraph(notification)).filter(
          Boolean
        );

        // Index 0 means we're done. if the array is empty we're done.
        // subtract one so we don't fetch the last notification twice
        // this.pagedIndexes[page + 1] = res.Notifications[res.Notifications.length - 1]?.Index - 1 || 0;

        // if the chunk was incomplete or the Index was zero we're done
        // if (chunk.length < this.pageSize || this.pagedIndexes[page + 1] === 0) {
          this.lastPage = page;
        // }

        // Track the total number of items for our empty state
        this.totalItems = (this.totalItems || 0) + chunk.length;

        return chunk;
    }))
  }

  // NOTE: the outputs of this function are inserted directly into the DOM
  // using innerHTML. you MUST sanitize any user content that gets rendered. For example,
  // we sanitize post text and image URLs because they could contain HTML characters. We
  // don't sanitize numbers or usernames because they can't contain HTML characters.
  //
  // NOTE: We support rendering unfollows and unlikes but they're currently filtered
  // out by frontend_server's TxnMetaIsNotification
  protected transformNotificationGraph(notification: any) {
    const currentUser = this.globalVars.loggedInUser;
    const currentUserPublicKey = currentUser.PublicKeyBase58Check;

    // The transactor is usually needed so parse her out and try to convert her
    // to a username.
    const actor = {
      Username: notification.from.name,
      PublicKeyBase58Check: notification.from.name,
      ProfilePic: "/assets/img/default_profile_pic.png",
    };
    const actorName = `<b>${notification.from.name}</b>`;

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

    if (notification.type === NotificationType.SendBitClout) {
      let txnAmountNanos = notification.amount;
      result.icon = "fas fa-money-bill-wave-alt fc-green";
      result.action = `${actorName} sent you ${this.globalVars.nanosToBitClout(txnAmountNanos)} ` +
        `$CLOUT!</b> (~${this.globalVars.nanosToUSD(txnAmountNanos, 2)})`;
      return result;
    } else if (notification.type === NotificationType.Like) {
      const postText = this.truncatePost(notification.postHash);
      if (!postText) {
        return null;
      }

      result.icon = "fas fa-heart fc-red";
      result.action = `${actorName} liked <i class="text-grey7">${postText}</i>`;
      result.link = AppRoutingModule.postPath(notification.postHash);
    } else if (notification.type === NotificationType.Follow) {
      result.icon = "fas fa-user fc-blue";
      result.action = `${actorName} followed you`;

      return result;
    } else if (notification.type === NotificationType.CoinPurchase) {
      result.icon = "fas fa-money-bill-wave-alt fc-green";
      result.action = `${actorName} bought <b>~${this.globalVars.nanosToUSD(notification.amount, 2)}</b>
        worth of <b>$${currentUser.ProfileEntryResponse.Username}</b>!`;
 
      return result;
    } else if (notification.type === NotificationType.CoinTransfer) {
      if (notification.postHash) {
        result.icon = "icon-diamond fc-blue";
        let postText = "";
        if (notification.postHash) {
          const truncatedPost = this.truncatePost(notification.postHash);
          postText = `<i class="text-grey7">${truncatedPost}</i>`;
          result.link = AppRoutingModule.postPath(notification.postHash);
        }
        result.action = `${actorName} gave <b>${notification.amount.toString()} diamond${
          notification.amount > 1 ? "s" : ""
        }</b> (~${this.globalVars.getUSDForDiamond(notification.amount)}) ${postText}`;
      } else {
        result.icon = "fas fa-paper-plane fc-blue";
        result.action = `${actorName} sent you <b>${this.globalVars.nanosToBitClout(notification.amount, 6)} ${notification.other.Name} coins`;
      }

      return result;
    } else if (notification.type === NotificationType.PostMention) {
      result.post = notification.postHash;
    } else if (notification.type === NotificationType.PostReply) {
      result.post = notification.postHash;
    } else if (notification.type === NotificationType.PostReclout) {
      result.post = notification.postHash;
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
