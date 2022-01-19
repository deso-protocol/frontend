import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, NFTEntryResponse, PostEntryResponse, ProfileEntryResponse } from "../backend-api.service";
import { orderBy } from "lodash";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Location } from "@angular/common";
import { SwalHelper } from "../../lib/helpers/swal-helper";

@Component({
  selector: "transfer-nft-modal",
  templateUrl: "./transfer-nft-modal.component.html",
})
export class TransferNftModalComponent implements OnInit {
  static PAGE_SIZE = 50;
  static BUFFER_SIZE = 10;
  static WINDOW_VIEWPORT = false;
  static PADDING = 0.5;

  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  @Output() closeModal = new EventEmitter<any>();
  @Output() changeTitle = new EventEmitter<string>();

  selectedSerialNumber: NFTEntryResponse = null;
  loading = true;
  transferringNFT: boolean = false;
  isSelectingSerialNumber = true;
  saveSelectionDisabled = false;
  showSelectedSerialNumbers = false;
  transferableSerialNumbers: NFTEntryResponse[];
  SN_FIELD = "SerialNumber";
  LAST_PRICE_FIELD = "LastAcceptedBidAmountNanos";
  sortByField = this.SN_FIELD;
  sortByOrder: "desc" | "asc" = "asc";
  selectedCreator: ProfileEntryResponse;
  unlockableText: string = "";

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private router: Router,
    private toastr: ToastrService,
    private location: Location,
    public bsModalRef: BsModalRef
  ) {}

  ngOnInit(): void {
    this.backendApi
      .GetNFTEntriesForNFTPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex
      )
      .subscribe((res) => {
        this.transferableSerialNumbers = orderBy(
          (res.NFTEntryResponses as NFTEntryResponse[]).filter(
            (nftEntryResponse) =>
              nftEntryResponse.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check &&
              !nftEntryResponse.IsPending &&
              !nftEntryResponse.IsForSale
          ),
          [this.sortByField],
          [this.sortByOrder]
        );
      })
      .add(() => (this.loading = false));
  }

  transferNFT() {
    this.saveSelectionDisabled = true;
    this.transferringNFT = true;
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Transfer NFT",
      html: `You are about to transfer this NFT to ${
        this.selectedCreator?.Username || this.selectedCreator?.PublicKeyBase58Check
      }`,
      showConfirmButton: true,
      showCancelButton: true,
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Ok",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (res.isConfirmed) {
        this.backendApi
          .TransferNFT(
            this.globalVars.localNode,
            this.globalVars.loggedInUser?.PublicKeyBase58Check,
            this.selectedCreator?.PublicKeyBase58Check,
            this.post.PostHashHex,
            this.selectedSerialNumber?.SerialNumber,
            this.unlockableText,
            this.globalVars.defaultFeeRateNanosPerKB
          )
          .subscribe(
            (res) => {
              this.modalService.setDismissReason("nft transferred");
              this.bsModalRef.hide();
              this.showToast();
            },
            (err) => {
              console.error(err);
              this.globalVars._alertError(this.backendApi.parseMessageError(err));
            }
          )
          .add(() => {
            this.transferringNFT = false;
            this.saveSelectionDisabled = false;
          });
      } else {
        this.transferringNFT = false;
        this.saveSelectionDisabled = false;
      }
    });
  }

  showToast(): void {
    const link = `/${this.globalVars.RouteNames.NFT}/${this.post.PostHashHex}`;
    this.toastr.show(`NFT Transferred<a href="${link}" class="toast-link cursor-pointer">View</a>`, null, {
      toastClass: "info-toast",
      enableHtml: true,
      positionClass: "toast-bottom-center",
    });
  }

  saveSelection(): void {
    if (!this.saveSelectionDisabled) {
      this.isSelectingSerialNumber = false;
      this.showSelectedSerialNumbers = true;
      this.changeTitle.emit("Transfer NFT");
    }
  }

  goBackToSerialSelection(): void {
    this.isSelectingSerialNumber = true;
    this.showSelectedSerialNumbers = false;
    this.changeTitle.emit("Choose an edition");
    this.selectedSerialNumber = null;
  }

  selectSerialNumber(serialNumber: NFTEntryResponse) {
    this.selectedSerialNumber = serialNumber;
    this.saveSelection();
  }

  deselectSerialNumber() {
    if (this.transferringNFT) {
      return;
    }
    this.selectedSerialNumber = null;
    this.showSelectedSerialNumbers = false;
  }

  lastPage = null;

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * TransferNftModalComponent.PAGE_SIZE;
    const endIdx = (page + 1) * TransferNftModalComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(this.transferableSerialNumbers.slice(startIdx, Math.min(endIdx, this.transferableSerialNumbers.length)));
    });
  }

  updateSort(sortField: string) {
    if (this.sortByField === sortField) {
      this.sortByOrder = this.sortByOrder === "asc" ? "desc" : "asc";
    } else {
      this.sortByOrder = "asc";
    }
    this.sortByField = sortField;
    this.transferableSerialNumbers = orderBy(this.transferableSerialNumbers, [this.sortByField], [this.sortByOrder]);
  }

  _selectCreator(selectedCreator: ProfileEntryResponse) {
    this.selectedCreator = selectedCreator;
  }
}
