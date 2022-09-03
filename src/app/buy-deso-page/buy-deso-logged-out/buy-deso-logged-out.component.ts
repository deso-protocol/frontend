import { Component } from '@angular/core';
import { GlobalVarsService } from '../../global-vars.service';

@Component({
  selector: 'buy-deso-logged-out',
  templateUrl: './buy-deso-logged-out.component.html',
  styleUrls: ['./buy-deso-logged-out.component.scss'],
})
export class BuyDeSoLoggedOutComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
