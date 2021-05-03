import RouteNamesService from "../app/route-names.service";
import { SwalHelper } from "./helpers/swal-helper";
import { GlobalVarsService } from "../app/global-vars.service";

const RouteNames = RouteNamesService;
export class SharedDialogs {
  static showCreateAccountToPostDialog(globalVars: GlobalVarsService) {
    return SwalHelper.fire({
      icon: "info",
      title: `Create an account to post`,
      html: `It's totally anonymous and takes under a minute.`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Create an account",
      cancelButtonText: "Nevermind",
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        globalVars.launchSignupFlow();
      }
    });
  }

  static showCreateProfileToPostDialog(router) {
    SwalHelper.fire({
      icon: "info",
      title: `Complete your profile to post`,
      html: `You can be whoever you want to be.`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Complete Your Profile",
      cancelButtonText: "Nevermind",
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        router.navigate(["/" + RouteNames.UPDATE_PROFILE], { queryParamsHandling: "merge" });
      }
    });
  }
}
