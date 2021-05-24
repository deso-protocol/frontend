import { Component, OnInit, Input } from '@angular/core';
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'simple-profile-card',
  templateUrl: './simple-profile-card.component.html',
})
export class SimpleProfileCardComponent implements OnInit {
  @Input() profile;
  @Input() diamondLevel = -1;
  @Input() showHeartIcon = false;
  @Input() showRecloutIcon = false;

  constructor(
    public globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
  }

  counter(num: number) {
    return Array(num);
  }

}
