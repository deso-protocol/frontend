import { ChangeDetectorRef, Component, HostListener, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BackendApiService } from "./backend-api.service";
import { GlobalVarsService } from "./global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { IdentityService } from "./identity.service";
import * as _ from "lodash";
import { environment } from "../environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    private ref: ChangeDetectorRef,
    private httpClient: HttpClient,
    private backendApi: BackendApiService,
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    public identityService: IdentityService,
    private router: Router
  ) {
    this.globalVars.Init(
      null, // loggedInUser
      [], // userList
      this.route // route
    );

    // Nuke the referrer so we don't leak anything
    // We also have a meta tag in index.html that does this in a different way to make
    // sure it's nuked.
    //
    // TODO: I'm pretty sure all of this could fail on IE so we should make sure people
    // only use the app with chrome.
    Object.defineProperty(document, "referrer", {
      get() {
        return "";
      },
    });
    Object.defineProperty(document, "referer", {
      get() {
        return "";
      },
    });
  }
  static DYNAMICALLY_ADDED_ROUTER_LINK_CLASS = "js-app-component__dynamically-added-router-link-class";

  showUsernameTooltip = false;

  bitcloutToUSDExchangeRateToDisplay = "fetching...";

  // Throttle the calls to update the top-level data so they only happen after a
  // previous call has finished.
  callingUpdateTopLevelData = false;
  problemWithNodeConnection = false;
  callingUpdateNodeInfo = false;

  // TODO: Cleanup - we should not be inserting links dynamically
  // This is used to add router links dynamically. Feed posts use this
  // to turn @-mentions into links.
  // See https://stackoverflow.com/a/62783788 for more info
  @HostListener("document:click", ["$event"])
  public handleClick(event: Event): void {
    if (event.target instanceof HTMLAnchorElement) {
      const element = event.target as HTMLAnchorElement;
      if (element.className === AppComponent.DYNAMICALLY_ADDED_ROUTER_LINK_CLASS) {
        event.preventDefault();

        if (!element) {
          return;
        }

        const route = element.getAttribute("href");
        if (route) {
          // FYI, this seems to give a js error if the route isn't in our list
          // of routes, which should help prevent attackers from tricking users into
          // clicking misleading links
          this.router.navigate([route], { queryParamsHandling: "merge" });
        }
      }
    }
  }

  // This stringifies the user object after first zeroing out fields that make
  // comparisons problematic.
  _cleanStringifyUser(user: any) {
    const userCopy = JSON.parse(JSON.stringify(user));
  }

  _numMessagesToRead(messageResponse: any) {
    if (!this.globalVars.loggedInUser || !messageResponse || !messageResponse.OrderedContactsWithMessages) {
      return;
    }
    let totalMessages = 0;
    let totalRead = 0;
    for (const contact of messageResponse.OrderedContactsWithMessages) {
      totalMessages += contact.Messages.length;
      const numRead = this.globalVars.messageMeta.notificationMap[
        this.globalVars.loggedInUser.PublicKeyBase58Check + contact.PublicKeyBase58Check
      ];
      totalRead += numRead ? numRead : 0;
    }
    const numNotifications = totalMessages - totalRead;
    return numNotifications > 0 ? numNotifications : "";
  }

  _updateTopLevelData() {
    if (this.callingUpdateTopLevelData) {
      return;
    }

    const publicKeys = Object.keys(this.identityService.identityServiceUsers);
    let loggedInUserPublicKey =
      this.globalVars.loggedInUser?.PublicKeyBase58Check ||
      this.backendApi.GetStorage(this.backendApi.LastLoggedInUserKey) ||
      publicKeys[0];

    // If we recently added a new public key, log in the user and clear the value
    if (this.identityService.identityServicePublicKeyAdded) {
      loggedInUserPublicKey = this.identityService.identityServicePublicKeyAdded;
      this.identityService.identityServicePublicKeyAdded = null;
    }

    this.callingUpdateTopLevelData = true;
    const observable = this.backendApi.GetUsersStateless(this.globalVars.localNode, publicKeys);

    observable.subscribe(
      (res: any) => {
        this.problemWithNodeConnection = false;
        this.callingUpdateTopLevelData = false;

        // Only update if things have changed to avoid unnecessary DOM manipulation
        if (!_.isEqual(this.globalVars.userList, res.UserList)) {
          this.globalVars.userList = res.UserList || [];
        }

        // Find the loggedInUser in our results
        const loggedInUser = _.find(res.UserList, { PublicKeyBase58Check: loggedInUserPublicKey });

        // Only update if things have changed to avoid unnecessary DOM manipulation
        if (!_.isEqual(this.globalVars.loggedInUser, loggedInUser)) {
          this.globalVars.setLoggedInUser(loggedInUser);
        }

        // Fetch messages once we've updated the logged in user
        this._updateMessages();

        // Convert the lists of coin balance entries into maps.
        // TODD: I've intermittently seen errors here where UsersYouHODL is null.
        // That's why I added this || [] thing. We should figure
        // out the root cause.
        for (const entry of this.globalVars.loggedInUser?.UsersYouHODL || []) {
          this.globalVars.youHodlMap[entry.CreatorPublicKeyBase58Check] = entry;
        }
        for (const entry of this.globalVars.loggedInUser?.UsersWhoHODLYou || []) {
          this.globalVars.hodlYouMap[entry.HODLerPublicKeyBase58Check] = entry;
        }

        this.globalVars.defaultFeeRateNanosPerKB = res.DefaultFeeRateNanosPerKB;
        this.globalVars.globoMods = res.GloboMods;
        this.ref.detectChanges();
        this.globalVars.loadingInitialAppState = false;
      },
      (error) => {
        this.problemWithNodeConnection = true;
        this.callingUpdateTopLevelData = false;
        this.globalVars.loadingInitialAppState = false;
        console.error(error);
      }
    );

    return observable;
  }

  _updateMessages() {
    if (!this.globalVars.loggedInUser) {
      return;
    }

    this.backendApi.GetMessages(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check).subscribe(
      (res) => {
        if (this.globalVars.pauseMessageUpdates) {
          // We pause message updates when a user sends a messages so that we can
          // wait for it to be sent before updating the thread.  If we do not do this the
          // temporary message place holder would disappear until "GetMessages()" finds it.
        } else {
          if (!this.globalVars.messageResponse) {
            this.globalVars.messageResponse = res;

            // If globalVars already has a messageResponse, we need to consolidate.
          } else if (JSON.stringify(this.globalVars.messageResponse) !== JSON.stringify(res)) {
            // We create maps for the new list of contacts+messages so that we can efficiently
            // check which contacts are missing from the new list. Anything that is missing
            // is a new thread started by the user that should appear at the top of their inbox.
            const responseContacts = {};
            for (const responseContact of res.OrderedContactsWithMessages) {
              responseContacts[responseContact.PublicKeyBase58Check] = responseContact.Messages;
            }

            // Iterate over the current list of contacts and if they are missing from
            // the new list, add them to the top of a list of missing ordered contacts.
            const missingOrderedContacts = [];
            for (const currentContact of this.globalVars.messageResponse.OrderedContactsWithMessages) {
              if (!responseContacts[currentContact.PublicKeyBase58Check]) {
                missingOrderedContacts.push(currentContact);
              }
            }

            // Append the missing contacts to the front of the response contacts.
            this.globalVars.messageResponse.OrderedContactsWithMessages = missingOrderedContacts.concat(
              res.OrderedContactsWithMessages
            );
            this.globalVars.messageResponse.TotalMessagesByContact = res.TotalMessagesByContact;
            this.globalVars.messageResponse.MessageReadStateByContact = res.MessageReadStateByContact;
          }

          // Update the number of messages to read.
          this.globalVars._setNumMessagesToRead();

          this.ref.detectChanges();
        }
      },
      (err) => {
        console.error(this.backendApi.stringifyError(err));
      }
    );
  }

  _updateBitCloutDisplayExchangeRate() {
    // Don't show a value until we've fetched the protocol's exchange rate.
    if (!this.globalVars.satoshisPerBitCloutExchangeRate) {
      return;
    }

    // The exchange rate requires getting the current Bitcoin price in USD.
    this.httpClient.get<any>("https://blockchain.info/ticker").subscribe(
      (res: any) => {
        if (res.USD != null && res.USD.last != null) {
          this.globalVars.usdPerBitcoinExchangeRate = res.USD.last;
          // nonaperunit / satoshiperunit / usdperbitcoin * satoshiperbitcoin
          const nanosPerUnit = 1e9;
          const satoshisPerBitcoin = 1e8;
          this.globalVars.nanosPerUSDExchangeRate =
            (nanosPerUnit /
              this.globalVars.satoshisPerBitCloutExchangeRate /
              this.globalVars.usdPerBitcoinExchangeRate) *
            satoshisPerBitcoin;
          this.bitcloutToUSDExchangeRateToDisplay = this.globalVars.nanosToUSD(1e9, null);
          // TODO: When we get rid of the old app, we will only use the globalVars version of this.
          this.globalVars.bitcloutToUSDExchangeRateToDisplay = this.globalVars.nanosToUSD(1e9, 2);

          this.ref.detectChanges();
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  _updateBitCloutExchangeRate() {
    this.backendApi.GetExchangeRate(this.globalVars.localNode).subscribe(
      (res: any) => {
        // TODO: Delete these fields. They're no longer used.
        this.globalVars.satoshisPerBitCloutExchangeRate = res.SatoshisPerBitCloutExchangeRate;

        this.globalVars.NanosSold = res.NanosSold;
        this.globalVars.ProtocolUSDCentsPerBitcoinExchangeRate = res.USDCentsPerBitcoinExchangeRate;

        // The exchange rate requires getting the current Bitcoin price in USD.
        this._updateBitCloutDisplayExchangeRate();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  _updateAppState() {
    this.backendApi
      .GetAppState(this.globalVars.localNode, this.globalVars.loggedInUser?.PublicKeyBase58Check)
      .subscribe((res: any) => {
        this.globalVars.hasUnreadNotifications = res.HasUnreadNotifications;
        this.globalVars.minSatoshisBurnedForProfileCreation = res.MinSatoshisBurnedForProfileCreation;
        this.globalVars.diamondLevelMap = res.DiamondLevelMap;
        this.globalVars.showProcessingSpinners = res.ShowProcessingSpinners;

        // Setup amplitude on first run
        if (!this.globalVars.amplitude && res.AmplitudeKey) {
          this.globalVars.amplitude = require("amplitude-js");
          this.globalVars.amplitude.init(res.AmplitudeKey, null, {
            apiEndpoint: res.AmplitudeDomain,
          });

          // Store the password if we have one
          if (res.Password) {
            this.globalVars.amplitude.setUserProperties({
              password: res.Password,
            });
          }

          // Track initial app load event so we are aware of every user
          // who visits our site (and not just those who click a button)
          this.globalVars.logEvent("app : load");
        }

        // Store other important app state stuff
        this.globalVars.isTestnet = res.IsTestnet;
        this.identityService.isTestnet = res.IsTestnet;
        this.globalVars.supportEmail = res.SupportEmail;
        this.globalVars.showPhoneNumberVerification = res.HasTwilioAPIKey && res.HasStarterBitCloutSeed;
        this.globalVars.createProfileFeeNanos = res.CreateProfileFeeNanos;
        this.globalVars.isCompProfileCreation = this.globalVars.showPhoneNumberVerification && res.CompProfileCreation;
      });
  }

  repeatForXInterval: number;
  _repeatForX(
    funcToRepeat: () => void,
    timeoutMillis,
    numTries = 10,
    triesExceededCallback: (comp: any) => void,
    comp: any = ""
  ) {
    let attempts = 0;

    // Set an interval to repeat
    this.repeatForXInterval = setInterval(() => {
      if (attempts >= numTries) {
        triesExceededCallback(comp);
        clearInterval(this.repeatForXInterval);
      }
      funcToRepeat();
      attempts++;
    }, timeoutMillis) as any;
  }

  _updateEverything = (
    waitTxn: string = "",
    successCallback: (comp: any) => void = () => {},
    errorCallback: (comp: any) => void = () => {},
    comp: any = ""
  ) => {
    // Refresh the messageMeta periodically.
    this.globalVars.messageMeta = this.backendApi.GetStorage(this.backendApi.MessageMetaKey);
    if (!this.globalVars.messageMeta) {
      this.globalVars.messageMeta = {
        decryptedMessgesMap: {},
        notificationMap: {},
      };
    }

    // If we have a transaction to wait for, we do a GetTxn call for a maximum of 10s (250ms * 40).
    // There is a success and error callback so that the caller gets feedback on the polling.
    if (waitTxn !== "") {
      this._repeatForX(
        () => {
          return this.backendApi.GetTxn(this.globalVars.localNode, waitTxn).subscribe(
            (res: any) => {
              if (!res.TxnFound) {
                return;
              }

              this._updateTopLevelData();
              this._updateBitCloutExchangeRate();
              this._updateAppState();

              clearInterval(this.repeatForXInterval);
              successCallback(comp);
            },
            (error) => {
              clearInterval(this.repeatForXInterval);
              errorCallback(comp);
            }
          );
        },
        750,
        160,
        errorCallback,
        comp
      );
    } else {
      if (this.globalVars.pausePolling) {
        return;
      }
      this._updateBitCloutExchangeRate();
      this._updateAppState();
      return this._updateTopLevelData();
    }
  };

  ngOnInit() {
    // Update the BitClout <-> Bitcoin exchange rate every five minutes. This prevents
    // a stale price from showing in a tab that's been open for a while
    setInterval(() => {
      this._updateBitCloutExchangeRate();
    }, 5 * 60 * 1000);

    this.globalVars.updateEverything = this._updateEverything;

    // We need to fetch this data before we start an import. Can remove once import code is gone.
    this._updateBitCloutExchangeRate();
    this._updateAppState();

    const hasLegacyUserList = this.backendApi.GetStorage(this.backendApi.LegacyUserListKey);
    const identityImportComplete = this.backendApi.GetStorage(this.backendApi.IdentityImportCompleteKey);

    if (hasLegacyUserList && !identityImportComplete) {
      this.backendApi.GetIdentities(this.globalVars.localNode).subscribe((res) => {
        this.identityService.importingIdentities = res.Identities;
        this.globalVars.importingIdentities = true;
      });
    } else {
      this.identityService.info().subscribe((res) => {
        // If the browser is not supported, display the browser not supported screen.
        if (!res.browserSupported) {
          this.globalVars.requestingStorageAccess = true;
          return;
        }

        const isLoggedIn = this.backendApi.GetStorage(this.backendApi.LastLoggedInUserKey);
        if (res.hasStorageAccess || !isLoggedIn) {
          this.loadApp();
        } else {
          this.globalVars.requestingStorageAccess = true;
          this.identityService.storageGranted.subscribe(() => {
            this.globalVars.requestingStorageAccess = false;
            this.loadApp();
          });
        }
      });
    }

    this.installDD();
  }

  loadApp() {
    this.identityService.identityServiceUsers = this.backendApi.GetStorage(this.backendApi.IdentityUsersKey) || {};
    // Filter out invalid public keys
    const publicKeys = Object.keys(this.identityService.identityServiceUsers);
    for (const publicKey of publicKeys) {
      if (!publicKey.match(/^[a-zA-Z0-9]{54,55}$/)) {
        delete this.identityService.identityServiceUsers[publicKey];
      }
    }
    this.backendApi.SetStorage(this.backendApi.IdentityUsersKey, this.identityService.identityServiceUsers);

    this.globalVars.updateEverything();

    // Clean up legacy seedinfo storage. only called when a user visits the site again after a successful import
    this.backendApi.DeleteIdentities(this.globalVars.localNode).subscribe();
    this.backendApi.RemoveStorage(this.backendApi.LegacyUserListKey);
    this.backendApi.RemoveStorage(this.backendApi.LegacySeedListKey);
  }

  launchIdentityImportFlow() {
    this.identityService.launch("/import").subscribe((res) => {
      this.backendApi.setIdentityServiceUsers(res.users, res.publicKeyAdded);

      this.backendApi.SetStorage(this.backendApi.IdentityImportCompleteKey, true);
      this.globalVars.importingIdentities = false;

      this.globalVars.updateEverything();
    });
  }

  installDD() {
    const { apiKey, jsPath, ajaxListenerPath, endpoint } = environment.dd;
    if (!apiKey || !jsPath || !ajaxListenerPath) {
      return;
    }

    // @ts-ignore
    window.ddjskey = apiKey;
    // @ts-ignore
    window.ddoptions = { ajaxListenerPath, endpoint };

    const datadomeScript = document.createElement("script");
    const firstScript = document.getElementsByTagName("script")[0];
    datadomeScript.async = true;
    datadomeScript.src = jsPath;
    firstScript.parentNode.insertBefore(datadomeScript, firstScript);
  }
}
