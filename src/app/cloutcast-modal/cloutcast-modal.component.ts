import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-cloutcast-modal',
  templateUrl: './cloutcast-modal.component.html',
  styleUrls: ['./cloutcast-modal.component.scss']
})
export class CloutCastModalComponent implements OnInit {
  @Input() postHashHex: string;
  loading = false;
  errorLoading = false;

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.loading = true;
  }

}
