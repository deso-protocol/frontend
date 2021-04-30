import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "buy-bitclout-complete",
  templateUrl: "./buy-bitclout-complete.component.html",
  styleUrls: ["./buy-bitclout-complete.component.scss"],
})
export class BuyBitcloutCompleteComponent implements OnInit {
  @Output() buyMoreBitcloutClicked = new EventEmitter();

  globalVars: GlobalVarsService;

  amountOfBitCloutBought: number = 0;

  constructor(private _globalVars: GlobalVarsService) {
    this.globalVars = _globalVars;
  }

  triggerBuyMoreBitclout() {
    this.buyMoreBitcloutClicked.emit();
  }

  ngOnInit() {
    window.scroll(0, 0);
  }
}
