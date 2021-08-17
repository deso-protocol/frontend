import { ChangeDetectorRef, Component, HostListener, OnInit } from "@angular/core";
import { BackendApiService, TutorialStatus, User } from "./backend-api.service";
import { GlobalVarsService } from "./global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { IdentityService } from "./identity.service";
import * as _ from "lodash";
import { environment } from "../environments/environment";
import { ThemeService } from "./theme/theme.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    private ref: ChangeDetectorRef,
    private themeService: ThemeService,
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

  _updateTopLevelData(refreshAllUsers: boolean): Subscription {
    if (this.callingUpdateTopLevelData) {
      return new Subscription();
    }

    let publicKeys = Object.keys(this.identityService.identityServiceUsers);

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

    if (!refreshAllUsers) {
      publicKeys = [loggedInUserPublicKey];
    }

    return this.backendApi.GetUsersStateless(this.globalVars.localNode, publicKeys, false).subscribe(
      (res: any) => {
        this.problemWithNodeConnection = false;
        this.callingUpdateTopLevelData = false;

        // Only update if things have changed to avoid unnecessary DOM manipulation. Only reset entire user list if refreshAllUsers is true
        if (refreshAllUsers && !_.isEqual(this.globalVars.userList, res.UserList)) {
          this.globalVars.userList = res.UserList || [];
        }

        // If we are only updating the logged in user, find that user in the user list and replace it.
        if (!refreshAllUsers) {
          this.globalVars.userList.forEach((user, index) => {
            if (user.PublicKeyBase58Check === loggedInUserPublicKey && !_.isEqual(this.globalVars.loggedInUser, user)) {
              this.globalVars.userList[index] = user;
            }
          });
        }

        // Find the loggedInUser in our results
        const loggedInUser: User = _.find(res.UserList, { PublicKeyBase58Check: loggedInUserPublicKey });

        // Only update if things have changed to avoid unnecessary DOM manipulation
        if (!_.isEqual(this.globalVars.loggedInUser, loggedInUser)) {
          this.globalVars.setLoggedInUser(loggedInUser);
        }

        // Setup messages for the logged in user
        this.globalVars.SetupMessages();

        // Convert the lists of coin balance entries into maps.
        // TODD: I've intermittently seen errors here where UsersYouHODL is null.
        // That's why I added this || [] thing. We should figure
        // out the root cause.
        for (const entry of this.globalVars.loggedInUser?.UsersYouHODL || []) {
          this.globalVars.youHodlMap[entry.CreatorPublicKeyBase58Check] = entry;
        }

        if (res.DefaultFeeRateNanosPerKB > 0) {
          this.globalVars.defaultFeeRateNanosPerKB = res.DefaultFeeRateNanosPerKB;
        }
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
  }

  _updateBitCloutExchangeRate() {
    this.globalVars._updateBitCloutExchangeRate();
  }

  _updateAppState() {
    this.backendApi
      .GetAppState(this.globalVars.localNode, this.globalVars.loggedInUser?.PublicKeyBase58Check)
      .subscribe((res: any) => {
        this.globalVars.minSatoshisBurnedForProfileCreation = res.MinSatoshisBurnedForProfileCreation;
        this.globalVars.diamondLevelMap = res.DiamondLevelMap;
        this.globalVars.showProcessingSpinners = res.ShowProcessingSpinners;
        this.globalVars.showBuyWithUSD = res.HasWyreIntegration;
        this.globalVars.showJumio = res.HasJumioIntegration;
        this.globalVars.jumioBitCloutNanos = res.JumioBitCloutNanos;
        // Setup amplitude on first run
        if (!this.globalVars.amplitude && res.AmplitudeKey) {
          this.globalVars.amplitude = require("amplitude-js");
          this.globalVars.amplitude.init(res.AmplitudeKey, null, {
            apiEndpoint: res.AmplitudeDomain,
          });

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

  _updateEverything = (
    refreshAllUsers: boolean = false,
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
      let attempts = 0;
      let numTries = 160;
      let timeoutMillis = 750;
      // Set an interval to repeat
      let interval = setInterval(() => {
        if (attempts >= numTries) {
          errorCallback(comp);
          clearInterval(interval);
        }
        this.backendApi
          .GetTxn(this.globalVars.localNode, waitTxn)
          .subscribe(
            (res: any) => {
              if (!res.TxnFound) {
                return;
              }

              this._updateBitCloutExchangeRate();
              this._updateAppState();

              this._updateTopLevelData(refreshAllUsers).add(() => {
                // We make sure the logged in user is updated before the success callback triggers
                successCallback(comp);
                clearInterval(interval);
              });
            },
            (error) => {
              clearInterval(interval);
              errorCallback(comp);
            }
          )
          .add(() => attempts++);
      }, timeoutMillis) as any;
    } else {
      if (this.globalVars.pausePolling) {
        return;
      }
      this._updateBitCloutExchangeRate();
      this._updateAppState();
      return this._updateTopLevelData(refreshAllUsers);
    }
  };

  ngOnInit() {
    // Load the theme
    this.themeService.init();

    // Update the BitClout <-> Bitcoin exchange rate every five minutes. This prevents
    // a stale price from showing in a tab that's been open for a while
    setInterval(() => {
      this._updateBitCloutExchangeRate();
    }, 5 * 60 * 1000);

    this.globalVars.updateEverything = this._updateEverything;

    // We need to fetch this data before we start an import. Can remove once import code is gone.
    this._updateBitCloutExchangeRate();
    this._updateAppState();

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

    this.globalVars.updateEverything(true);

    // Clean up legacy seedinfo storage. only called when a user visits the site again after a successful import
    this.backendApi.DeleteIdentities(this.globalVars.localNode).subscribe();
    this.backendApi.RemoveStorage(this.backendApi.LegacyUserListKey);
    this.backendApi.RemoveStorage(this.backendApi.LegacySeedListKey);
  }

  installDD() {
    const { apiKey, jsPath, ajaxListenerPath, endpoint } = environment.dd;
    if (!apiKey || !jsPath || !ajaxListenerPath || !endpoint) {
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
