import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedDialogs } from "../../../lib/shared-dialogs";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { EmbedUrlParserService } from "../../../lib/services/embed-url-parser-service/embed-url-parser-service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "feed-create-post",
  templateUrl: "./feed-create-post.component.html",
  styleUrls: ["./feed-create-post.component.sass"],
})
export class FeedCreatePostComponent implements OnInit {
  static SHOW_POST_LENGTH_WARNING_THRESHOLD = 515; // show warning at 515 characters

  EmbedUrlParserService = EmbedUrlParserService;

  @Input() postRefreshFunc: any = null;
  @Input() numberOfRowsInTextArea: number = 2;
  @Input() parentPost: PostEntryResponse = null;
  @Input() isQuote: boolean = false;
  @Input() inTutorial: boolean = false;

  isComment: boolean;

  @ViewChild("autosize") autosize: CdkTextareaAutosize;

  randomMovieQuote = "";
  randomMovieQuotes = [
    "Go ahead, make my day.",
    "The stuff that dreams are made of.",
    "Made it, Ma! Top of the world!",
    "I'll be back.",
    "Open the pod bay doors, HAL.",
    "Who's on first.",
    "What's on second.",
    "I feel the need - the need for speed!",
    "I'm king of the world!",
    "If you build it, they will come.",
    "Roads? Where we're going we don't need roads",
    "To infinity and beyond!",
  ];

  submittingPost = false;
  postInput = "";
  postImageSrc = null;

  showEmbedURL = false;
  showImageLink = false;
  embedURL = "";
  constructedEmbedURL: any;
  // Emits a PostEntryResponse. It would be better if this were typed.
  @Output() postCreated = new EventEmitter();

  globalVars: GlobalVarsService;
  GlobalVarsService = GlobalVarsService;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private changeRef: ChangeDetectorRef,
    private appData: GlobalVarsService
  ) {
    this.globalVars = appData;
  }

  ngOnInit() {
    this.isComment = !this.isQuote && !!this.parentPost;
    this._setRandomMovieQuote();
    if (this.inTutorial) {
      this.postInput = "It's time to CLOUT!";
    }
  }

  onPaste(event: any): void {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let blob = null;

    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        blob = item.getAsFile();
      }
    }

    if (blob) {
      this._handleFileInput(blob);
    }
  }

  uploadFile(event: any): void {
    if (!this.isComment) {
      this._handleFileInput(event[0]);
    }
  }

  showCharacterCountIsFine() {
    return this.postInput.length < FeedCreatePostComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD;
  }

  showCharacterCountWarning() {
    return (
      this.postInput.length >= FeedCreatePostComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD &&
      this.postInput.length <= GlobalVarsService.MAX_POST_LENGTH
    );
  }

  characterCountExceedsMaxLength() {
    return this.postInput.length > GlobalVarsService.MAX_POST_LENGTH;
  }

  getPlaceholderText() {
    // Creating vanilla post
    if (!this.parentPost) {
      return this.randomMovieQuote;
    }
    // Creating comment or quote reclout;
    return this.isQuote ? "Add a quote" : "Post your reply";
  }

  _setRandomMovieQuote() {
    const randomInt = Math.floor(Math.random() * this.randomMovieQuotes.length);
    this.randomMovieQuote = this.randomMovieQuotes[randomInt];
  }

  setEmbedURL() {
    EmbedUrlParserService.getEmbedURL(this.backendApi, this.globalVars, this.embedURL).subscribe(
      (res) => (this.constructedEmbedURL = res)
    );
  }

  submitPost() {
    if (this.postInput.length > GlobalVarsService.MAX_POST_LENGTH) {
      return;
    }

    // post can't be blank
    if (this.postInput.length === 0 && !this.postImageSrc) {
      return;
    }

    if (this.submittingPost) {
      return;
    }

    const postExtraData = {};
    if (this.embedURL) {
      if (EmbedUrlParserService.isValidEmbedURL(this.constructedEmbedURL)) {
        postExtraData["EmbedVideoURL"] = this.constructedEmbedURL;
      }
    }

    const bodyObj = {
      Body: this.postInput,
      // Only submit images if the post is a quoted reclout or a vanilla post.
      ImageURLs: !this.isComment ? [this.postImageSrc].filter((n) => n) : [],
    };
    const recloutedPostHashHex = this.isQuote ? this.parentPost.PostHashHex : "";
    this.submittingPost = true;
    const postType = this.isQuote ? "quote" : this.isComment ? "reply" : "create";

    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        "" /*PostHashHexToModify*/,
        this.isComment ? this.parentPost.PostHashHex : "" /*ParentPostHashHex*/,
        "" /*Title*/,
        bodyObj /*BodyObj*/,
        recloutedPostHashHex,
        postExtraData,
        "" /*Sub*/,
        // TODO: Should we have different values for creator basis points and stake multiple?
        // TODO: Also, it may not be reasonable to allow stake multiple to be set in the FE.
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/,
        this.inTutorial,
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent(`post : ${postType}`);

          this.submittingPost = false;

          this.postInput = "";
          this.postImageSrc = null;
          this.embedURL = "";
          this.constructedEmbedURL = "";
          this.changeRef.detectChanges();

          // Refresh the post page.
          if (this.postRefreshFunc) {
            this.postRefreshFunc(response.PostEntryResponse);
          }

          this.postCreated.emit(response.PostEntryResponse);
        },
        (err) => {
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars._alertError(parsedError);
          this.globalVars.logEvent(`post : ${postType} : error`, { parsedError });

          this.submittingPost = false;
          this.changeRef.detectChanges();
        }
      );
  }

  _createPost() {
    // Check if the user has an account.
    if (!this.globalVars?.loggedInUser) {
      this.globalVars.logEvent("alert : post : account");
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
      return;
    }

    // Check if the user has a profile.
    if (!this.globalVars?.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : post : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }

    // The user has an account and a profile. Let's create a post.
    this.submitPost();
  }

  _handleFilesInput(files: FileList) {
    this.showImageLink = false;
    const fileToUpload = files.item(0);
    this._handleFileInput(fileToUpload);
  }

  _handleFileInput(file: File) {
    if (!file.type || !file.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (file.size > 15 * (1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 15MB");
      return;
    }
    this.backendApi
      .UploadImage(environment.uploadImageHostname, this.globalVars.loggedInUser.PublicKeyBase58Check, file)
      .subscribe(
        (res) => {
          this.postImageSrc = res.ImageURL;
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error.error));
        }
      );
  }
}
