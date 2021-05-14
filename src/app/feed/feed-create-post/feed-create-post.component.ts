import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedDialogs } from "../../../lib/shared-dialogs";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { VideoUrlParserService } from "../../../lib/services/video-url-parser-service/video-url-parser-service";

@Component({
  selector: "feed-create-post",
  templateUrl: "./feed-create-post.component.html",
  styleUrls: ["./feed-create-post.component.sass"],
})
export class FeedCreatePostComponent implements OnInit {
  static SHOW_POST_LENGTH_WARNING_THRESHOLD = 260; // show warning at 260 characters

  // FeedPostComponent = FeedPostComponent;
  VideoUrlParserService = VideoUrlParserService;
  @Input() postRefreshFunc: any = null;
  @Input() numberOfRowsInTextArea: number = 2;

  @ViewChild("postImage") postImage;
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

  showEmbedVideoURL = false;
  embedVideoURL = "";
  constructedEmbedVideoURL: any;
  // Emits a PostEntryResponse. It would be better if this were typed.
  @Output() postCreated = new EventEmitter();

  showCanvas = false;

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
    this._setRandomMovieQuote();
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

  _setRandomMovieQuote() {
    const randomInt = Math.floor(Math.random() * this.randomMovieQuotes.length);
    this.randomMovieQuote = this.randomMovieQuotes[randomInt];
  }

  setEmbedVideoURL() {
    VideoUrlParserService.getEmbedVideoURL(this.backendApi, this.globalVars, this.embedVideoURL).subscribe(
      (res) => (this.constructedEmbedVideoURL = res)
    );
  }

  getEmbedVideoURL() {
    return this.constructedEmbedVideoURL;
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
    if (this.embedVideoURL) {
      const videoURL = this.getEmbedVideoURL();
      if (VideoUrlParserService.isValidEmbedURL(videoURL)) {
        postExtraData["EmbedVideoURL"] = videoURL;
      }
    }
    this.submittingPost = true;

    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        "" /*PostHashHexToModify*/,
        "" /*ParentPostHashHex*/,
        "" /*Title*/,
        {
          Body: this.postInput,
          ImageURLs: [],
          Images: [this.postImageSrc].filter((n) => n),
        } /*BodyObj*/,
        "",
        postExtraData,
        "" /*Sub*/,
        // TODO: Should we have different values for creator basis points and stake multiple?
        // TODO: Also, it may not be reasonable to allow stake multiple to be set in the FE.
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent("post : create");

          this.submittingPost = false;

          this.postInput = "";
          this.postImageSrc = null;
          this.embedVideoURL = "";
          this.constructedEmbedVideoURL = "";
          this.resetCanvas();
          this.showCanvas = false;
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
          this.globalVars.logEvent("post : create : error", { parsedError });

          this.submittingPost = false;
          this.changeRef.detectChanges();
        }
      );

    return;
  }

  _createPost() {
    // Check if the user has an account.
    if (!this.globalVars || !this.globalVars.loggedInUser) {
      this.globalVars.logEvent("alert : post : account");
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
      return;
    }

    // Check if the user has a profile.
    else if (this.globalVars && !this.globalVars.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : post : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }

    // The user has an account and a profile. Let's create a post.
    else {
      this.submitPost();
    }
  }

  _handleFileInput(files: FileList) {
    const fileToUpload = files.item(0);
    if (!fileToUpload.type || !fileToUpload.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (fileToUpload.size > 15 * (1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 15MB");
      return;
    }
    const resetCanvas = this.resetCanvas();
    const imgCanvas = resetCanvas[0];
    const imageContext = resetCanvas[1];
    const fileType = fileToUpload.type;

    const reader = new FileReader();
    reader.readAsDataURL(fileToUpload);
    reader.onload = (event: any) => {
      if (fileType === "image/gif") {
        this.postImageSrc = event.target.result;
      } else {
        const myImage = new Image();
        myImage.src = event.target.result;
        myImage.onload = (e: Event) => {
          let width = myImage.width;
          let height = myImage.height;
          if (width > height) {
            if (width > 1000) {
              height = (1000 / width) * height;
              width = 1000;
            }
          } else {
            if (height > 1000) {
              width = (1000 / height) * width;
              height = 1000 / height;
            }
          }

          imgCanvas.width = width;
          imgCanvas.height = height;
          this.showCanvas = true;
          imageContext.drawImage(myImage, 0, 0, width, height);
          this.postImageSrc = imgCanvas.toDataURL("image/webp", 0.8);
        };
      }
    };
  }

  resetCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    let imgCanvas = document.getElementById("feed-post-image-canvas") as HTMLCanvasElement;
    let imageContext = imgCanvas.getContext("2d");
    imageContext.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
    return [imgCanvas, imageContext]
  }
}
