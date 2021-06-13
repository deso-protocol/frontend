import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";

@Component({
  selector: "comment-modal",
  templateUrl: "./comment-modal.component.html",
  styleUrls: ["./comment-modal.component.scss"],
})
export class CommentModalComponent {
  static SHOW_POST_LENGTH_WARNING_THRESHOLD = 260; // show warning at 260 characters

  @Input() parentPost;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() isQuote = false;

  @ViewChild("autosize") autosize: CdkTextareaAutosize;

  GlobalVarsService = GlobalVarsService;
  postContent: string;

  // TODO: post threads: this is copy pasted code. Consolidate with FeedCreatePostComponent later.
  submittingPost = false;
  postInput = "";

  ngOnInit() {
    if (localStorage.getItem("theme") == "light") {
      this.bsModalRef.setClass("lightmodal");
    } else {
      this.bsModalRef.setClass("darkmodal");
    }
  }

  characterCountExceedsMaxLength(): boolean {
    return this.postInput.length > GlobalVarsService.MAX_POST_LENGTH;
  }

  showCharacterCountWarning() {
    return (
      this.postInput.length >= CommentModalComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD &&
      this.postInput.length <= GlobalVarsService.MAX_POST_LENGTH
    );
  }

  showCharacterCountIsFine() {
    return this.postInput.length < CommentModalComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD;
  }

  submitPost() {
    if (this.characterCountExceedsMaxLength()) {
      this.globalVars._alertError(
        `Your reply is ${this.postInput.length} characters long but the max is ${GlobalVarsService.MAX_POST_LENGTH}`
      );
      return;
    }

    if (this.postInput.length == 0) {
      this.globalVars._alertError(`Your reply can't be blank`);
      return;
    }

    if (this.submittingPost) {
      return;
    }

    const bodyObj = { Body: this.postInput };
    let recloutedPostHashHex = "";
    if (this.isQuote) {
      recloutedPostHashHex = this.parentPost.PostHashHex;
    }

    // Call thingie with the post content
    this.submittingPost = true;
    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        "" /*PostHashHexToModify*/,
        this.isQuote ? "" : this.parentPost.PostHashHex /*ParentPostHashHex*/,
        "" /*Title*/,
        bodyObj /*BodyObj*/,
        recloutedPostHashHex,
        {},
        "" /*Sub*/,
        // TODO: Should we have different values for creator basis points and stake multiple?
        // TODO: Also, it may not be reasonable to allow stake multiple to be set in the FE.
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent("post : reply");

          // Refresh the post page.
          if (this.afterCommentCreatedCallback) {
            // afterCommentCreatedCallback's responsibility is to append this comment to the parent
            // post's list of comments
            this.afterCommentCreatedCallback(response.PostEntryResponse);
          }
        },
        (err) => {
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars._alertError(parsedError);
          this.globalVars.logEvent("post : reply : error", { parsedError });

          this.changeRef.detectChanges();
        }
      )
      .add(() => {
        this.submittingPost = false;
        this.bsModalRef.hide();
      });

    return;
  }

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private router: Router,
    private route: ActivatedRoute,
    private changeRef: ChangeDetectorRef,
    public bsModalRef: BsModalRef
  ) {}
}
