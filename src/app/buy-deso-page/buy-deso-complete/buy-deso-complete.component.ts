import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GlobalVarsService } from '../../global-vars.service';

@Component({
  selector: 'buy-deso-complete',
  templateUrl: './buy-deso-complete.component.html',
  styleUrls: ['./buy-deso-complete.component.scss'],
})
export class BuyDeSoCompleteComponent implements OnInit {
  @Output() buyMoreDeSoClicked = new EventEmitter();

  globalVars: GlobalVarsService;

  amountOfDeSoBought: number = 0;

  constructor(private _globalVars: GlobalVarsService) {
    this.globalVars = _globalVars;
  }

  triggerBuyMoreDeSo() {
    this.buyMoreDeSoClicked.emit();
  }

  ngOnInit() {
    window.scroll(0, 0);
  }
}
