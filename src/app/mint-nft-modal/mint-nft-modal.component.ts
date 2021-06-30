import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'app-mint-nft-modal',
  templateUrl: './mint-nft-modal.component.html',
})
export class MintNftModalComponent implements OnInit {
  IS_SINGLE_COPY = "isSingleCopy"
  IS_MULTIPLE_COPIES = "isMultipleCopies"
  @Input() post: any;

  // Settings.
  copiesRadioValue = this.IS_SINGLE_COPY;
  numCopies: number = 1;
  putOnSale: boolean = true;
  creatorRoyaltyPercent: number;
  coinRoyaltyPercent: number;
  includeUnlockable: boolean = false; 

  // Errors.
  unreasonableRoyaltiesSet: boolean = false;
  unreasonableNumCopiesSet: boolean = false;

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

  hasUnreasonableRoyalties() {
    let isEitherUnreasonable = (
      this.creatorRoyaltyPercent < 0 || this.creatorRoyaltyPercent > 100
    ) || (
      this.coinRoyaltyPercent < 0 || this.coinRoyaltyPercent > 100
    )
    let isSumUnreasonable = this.creatorRoyaltyPercent + this.coinRoyaltyPercent > 100;
    return isEitherUnreasonable || isSumUnreasonable
  }

  hasUnreasonableNumCopies() {
    return this.numCopies > 1000 || this.numCopies < 1
  }
}
