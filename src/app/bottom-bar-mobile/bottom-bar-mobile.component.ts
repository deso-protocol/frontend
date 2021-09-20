import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { FeedComponent } from "../feed/feed.component";
import {FeedCreatePostModalComponent} from "../feed/feed-create-post-modal/feed-create-post-modal.component";
import {BsModalService} from "ngx-bootstrap/modal";

@Component({
  selector: "bottom-bar-mobile",
  templateUrl: "./bottom-bar-mobile.component.html",
  styleUrls: ["./bottom-bar-mobile.component.scss"],
})
export class BottomBarMobileComponent {
  @Input() showPostButton = false;
  showcaseTab = FeedComponent.SHOWCASE_TAB;
  globalTab = FeedComponent.GLOBAL_TAB;
  constructor(public globalVars: GlobalVarsService, private modalService: BsModalService) {}

  openCreatePostModal() {
    this.modalService.show(FeedCreatePostModalComponent, {
      class: "modal-dialog-centered",
    });
  }
}
