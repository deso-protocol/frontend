import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "feed-post-image-modal",
  templateUrl: "./feed-post-image-modal.component.html",
  styleUrls: ["./feed-post-image-modal.component.scss"],
})
export class FeedPostImageModalComponent {
  @Input() imageURL: string;

  constructor(public globalVars: GlobalVarsService) {}
}
