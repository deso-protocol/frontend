import * as sweetalert2 from "sweetalert2";
import Swal, { SweetAlertOptions } from "sweetalert2";
import * as _ from "lodash";

type Awaited<T> = T extends Promise<infer U> ? U : T;

export class SwalHelper {
  static ESCAPED_FIELDS = [
    "title",
    "text",
    "html",
    "footer",
    "confirmButtonColor",
    "confirmButtonText",
    "cancelButtonText",
    "denyButtonText",
    "target",
  ];

  // These are booleans, so they don't need to be escaped
  static UNESCAPED_FIELDS = [
    "focusConfirm",
    "showConfirmButton",
    "showCancelButton",
    "showDenyButton",
    "reverseButtons",
    "focusCancel",
    "allowOutsideClick",
    "allowEscapeKey",
  ];

  // Only the fields listed in ESCAPED_FIELDS and UNESCAPED_FIELDS are passed to sweetalert.
  // If you pass in an option that isn't in ESCAPED_FIELDS or UNESCAPED_FIELDS above, the option
  // will be ignored. Feel free to add support for more SweetAlertOptions if needed, but be sure
  // to escape them.
  //
  // We can add an htmlSafe option (i.e. do not sanitize) in the future if needed.
  static fire<T = any>(options: SweetAlertOptions): Promise<sweetalert2.SweetAlertResult<Awaited<T>>> {
    // Feel free to add more classes here as needed
    let escapedCustomClass = {
      confirmButton: _.escape(options?.customClass?.confirmButton),
      cancelButton: _.escape(options?.customClass?.cancelButton),
    };

    let escapedIcon = _.escape(options.icon as string) as sweetalert2.SweetAlertIcon;

    let escapedOptions = {
      icon: escapedIcon,
      customClass: escapedCustomClass,
    };

    for (let field of SwalHelper.UNESCAPED_FIELDS) {
      // Only set escapedOptions[field] if it was explicitly set in options by the caller.
      // If we didn't have this if-check, then options that weren't explicitly set would end up
      // in escapedOptions as undefined, e.g. {showConfirmButton: undefined}. Swal would interpret
      // undefined as false, and would not show the confirm button, which isn't what the caller
      // intended (the caller left the field unspecified, i.e. Swal should use its default behavior,
      // which is to show a confirm button).
      if (options[field] !== undefined) {
        escapedOptions[field] = options[field];
      }
    }

    for (let field of SwalHelper.ESCAPED_FIELDS) {
      if (options[field] !== undefined) {
        escapedOptions[field] = _.escape(options[field]);
      }
    }

    return Swal.fire(escapedOptions);
  }
}
