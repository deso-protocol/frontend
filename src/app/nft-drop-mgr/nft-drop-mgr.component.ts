import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import { InfiniteScroller } from "../infinite-scroller";
import { IAdapter, IDatasource } from "ngx-ui-scroll";

@Component({
  selector: "nft-drop-mgr",
  templateUrl: "./nft-drop-mgr.component.html",
})
export class NftDropMgrComponent implements OnInit {
  globalVars: GlobalVarsService;

  loading: boolean = false;
  loadingNewDrop: boolean = false;
  settingDate: boolean = false;
  togglingActivation: boolean = false;
  addingNFT: boolean = false;
  hideDateTimeAdjuster: boolean = false;
  dropSelectorError: string = "";

  nftToAdd: string = "";
  nftBeingRemoved: string = "";
  dropNumber: number = 1;
  latestDropNumber: number = 1;
  latestDropEntry: any;
  dropTime: Date = new Date();
  dropEntry: any;
  posts = [];

  isUpdatable = false;

  static PAGE_SIZE = 10;
  static WINDOW_VIEWPORT = true;
  static BUFFER_SIZE = 5;
  static PADDING = 0.5;

  lastPage: number;
  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    NftDropMgrComponent.PAGE_SIZE,
    this.getPage.bind(this),
    NftDropMgrComponent.WINDOW_VIEWPORT,
    NftDropMgrComponent.BUFFER_SIZE,
    NftDropMgrComponent.PADDING
  );

  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    // Get the latest NFT drop
    this.loading = true;
    this.backendApi
      .AdminGetNFTDrop(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, -1 /*DropNumber*/)
      .subscribe(
        (res: any) => {
          this.dropEntry = res.DropEntry;
          if (res.DropEntry.DropNumber === 0) {
            // If the drop number is zero, we could not find any drops and use the defaults.
          } else {
            this.latestDropNumber = res.DropEntry.DropNumber;
            this.latestDropEntry = res.DropEntry;
            this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
          }
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * NftDropMgrComponent.PAGE_SIZE;
    const endIdx = (page + 1) * NftDropMgrComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(this.posts.slice(startIdx, Math.min(endIdx, this.posts.length)));
    });
  }

  isWorking() {
    return this.loading || this.settingDate || this.togglingActivation || this.addingNFT;
  }

  updateStateBasedOnNewDropEntry(dropEntry: any, posts: any) {
    this.posts = posts ? posts : [];
    this.dropEntry = dropEntry;
    this.dropEntry.Date = new Date(this.dropEntry.DropTstampNanos / 1e6);
    this.dropNumber = dropEntry.DropNumber;
    this.dropTime = new Date(dropEntry.DropTstampNanos / 1e6);
    let currentTime = new Date();
    this.hideDateTimeAdjuster = this.dropTime < currentTime;
    this.lastPage = Math.floor(this.posts.length / NftDropMgrComponent.PAGE_SIZE);
    this.setIsUpdatable();
  }

  updateErrorWithTimeout(errorMsg: string) {
    this.dropSelectorError = errorMsg;
    setTimeout(() => {
      this.dropSelectorError = "";
    }, 1500);
  }

  resetDatasource(): void {
    this.infiniteScroller.reset();
    this.datasource.adapter.reset().then(() => {
      this.loadingNewDrop = false;
      this.loading = false;
    });
  }

  nextDrop() {
    if (this.isWorking()) {
      return;
    }
    this.dropSelectorError = "";

    let currentTime = new Date();
    if (this.dropTime > currentTime) {
      this.updateErrorWithTimeout("Cannot make a new drop while this drop is pending.");
      return;
    }

    let nextDropNumber = this.dropNumber + 1;
    if (nextDropNumber == this.latestDropNumber + 1) {
      // If the next drop is a new drop, initialize it.
      this.posts = [];
      this.dropNumber = nextDropNumber;
      this.dropTime = new Date();
      this.dropEntry = null;
      this.hideDateTimeAdjuster = false;
      this.resetDatasource();
      return;
    }

    this.loading = true;
    this.loadingNewDrop = true;
    this.backendApi
      .AdminGetNFTDrop(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        nextDropNumber /*DropNumber*/
      )
      .subscribe(
        (res: any) => {
          this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
        },
        (error) => {
          this.updateErrorWithTimeout("Error getting drop #" + nextDropNumber.toString() + ".");
        }
      )
      .add(() => {
        this.resetDatasource();
      });
  }

  previousDrop() {
    if (this.isWorking()) {
      return;
    }
    this.dropSelectorError = "";

    let prevDropNumber = this.dropNumber - 1;

    this.loading = true;
    this.loadingNewDrop = true;
    this.backendApi
      .AdminGetNFTDrop(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        prevDropNumber /*DropNumber*/
      )
      .subscribe(
        (res: any) => {
          this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
        },
        (error) => {
          this.updateErrorWithTimeout("Error getting drop #" + prevDropNumber.toString() + ".");
        }
      )
      .add(() => {
        this.resetDatasource();
      });
  }

  setDate() {
    if (this.isWorking()) {
      return;
    }

    this.settingDate = true;
    this.backendApi
      .AdminUpdateNFTDrop(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.dropNumber,
        this.dropTime.getTime() * 1e6,
        false /*IsActive*/,
        "" /*NFTHashHexToAdd*/,
        "" /*NFTHashHexToRemove*/
      )
      .subscribe(
        (res: any) => {
          this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
          if (res.DropEntry.DropNumber > this.latestDropNumber) {
            this.latestDropNumber = res.DropEntry.DropNumber;
          }
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      )
      .add(() => {
        this.settingDate = false;
      });
  }

  toggleActivation() {
    if (this.isWorking()) {
      return;
    }

    this.togglingActivation = true;
    this.backendApi
      .AdminUpdateNFTDrop(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.dropEntry.DropNumber,
        this.dropEntry.DropTstampNanos,
        !this.dropEntry.IsActive /*IsActive*/,
        "" /*NFTHashHexToAdd*/,
        "" /*NFTHashHexToRemove*/
      )
      .subscribe(
        (res: any) => {
          this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      )
      .add(() => {
        this.togglingActivation = false;
      });
  }

  addAnNFT() {
    if (this.isWorking()) {
      return;
    }

    this.addingNFT = true;
    this.backendApi
      .AdminUpdateNFTDrop(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.dropEntry.DropNumber,
        this.dropEntry.DropTstampNanos,
        this.dropEntry.IsActive /*IsActive*/,
        this.nftToAdd /*NFTHashHexToAdd*/,
        "" /*NFTHashHexToRemove*/
      )
      .subscribe(
        (res: any) => {
          this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      )
      .add(() => {
        this.addingNFT = false;
      });
  }

  removeNFT(postHashHex: string) {
    if (this.isWorking()) {
      return;
    }

    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      html: `Are you sure you want to remove this NFT from the drop?`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: true,
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        this.nftBeingRemoved = postHashHex;
        this.backendApi
          .AdminUpdateNFTDrop(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.dropEntry.DropNumber,
            this.dropEntry.DropTstampNanos,
            this.dropEntry.IsActive /*IsActive*/,
            "" /*NFTHashHexToAdd*/,
            postHashHex /*NFTHashHexToRemove*/
          )
          .subscribe(
            (res: any) => {
              this.updateStateBasedOnNewDropEntry(res.DropEntry, res.Posts);
            },
            (error) => {
              this.globalVars._alertError(error.error.error);
            }
          )
          .add(() => {
            this.nftBeingRemoved = "";
          });
      }
    });
  }

  setIsUpdatable() {
    // There are only two possible drops that can be updated (you can't update past drops):
    //   - The current "active" drop.
    //   - The next "pending" drop.
    let canUpdateDrop = false;
    let currentTime = new Date();
    let latestDropIsPending = this.latestDropEntry.DropTstampNanos / 1e6 > currentTime.getTime();
    if (latestDropIsPending && this.dropEntry.DropNumber >= this.latestDropEntry.DropNumber - 1) {
      // In this case their is a pending drop so the latest drop and the previous drop are editable.
      canUpdateDrop = true;
    } else if (!latestDropIsPending && this.dropEntry.DropNumber == this.latestDropEntry.DropNumber) {
      // In this case there is no pending drop so you can only update the latest drop.
      canUpdateDrop = true;
    }
    this.isUpdatable = canUpdateDrop;
  }
}
