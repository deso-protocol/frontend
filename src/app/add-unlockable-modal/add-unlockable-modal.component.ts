import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";

@Component({
  selector: 'app-add-unlockable-modal',
  templateUrl: './add-unlockable-modal.component.html',
})
export class AddUnlockableModalComponent implements OnInit {
  @ViewChild("autosize") autosize: CdkTextareaAutosize;

  constructor(
    private modalService: BsModalService,
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

}
