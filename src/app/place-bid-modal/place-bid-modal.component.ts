import { Component, OnInit, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BidPlacedModalComponent } from "../bid-placed-modal/bid-placed-modal.component";
import { BackendApiService, PostEntryResponse } from "../backend-api.service";

@Component({
  selector: "app-place-bid-modal",
  templateUrl: "./place-bid-modal.component.html",
})
export class PlaceBidModalComponent implements OnInit {
  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  bidAmountCLOUT: number;
  bidAmountUSD: number;
  selectedSerialNumber: number = 1;
  loading = false;
  isSelectingSerialNumber = false;
  sampleNftData = [
    { SerialNumber: 1, LastPrice: 0.15 * 1e9 },
    { SerialNumber: 2, LastPrice: 0.01 * 1e9 },
    { SerialNumber: 3, LastPrice: 0.04 * 1e9 },
    { SerialNumber: 4, LastPrice: 0.2 * 1e9 },
    { SerialNumber: 5, LastPrice: 0.21 * 1e9 },
    { SerialNumber: 6, LastPrice: 0.22 * 1e9 },
    { SerialNumber: 7, LastPrice: 0.23 * 1e9 },
  ];

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef
  ) {}

  ngOnInit(): void {
    console.log("set clout amount to min bid amount");
  }

  updateBidAmountUSD(cloutAmount) {
    this.bidAmountUSD = this.globalVars.nanosToUSDNumber(cloutAmount * 1e9);
  }

  updateBidAmountCLOUT(usdAmount) {
    console.log(usdAmount);
    console.log(Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)));
    this.bidAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
    console.log(this.bidAmountCLOUT);
    console.log(this.bidAmountCLOUT * 1e9);
  }

  placeBid() {
    this.backendApi
      .CreateNFTBid(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex,
        this.selectedSerialNumber,
        Math.trunc(this.bidAmountCLOUT * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          // Hide this modal and open the next one.
          this.bsModalRef.hide();
          this.modalService.show(BidPlacedModalComponent, {
            class: "modal-dialog-centered modal-sm",
          });
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(this.backendApi.parseMessageError(err));
        }
      );
  }
}
