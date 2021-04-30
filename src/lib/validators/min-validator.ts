import { AbstractControl, ValidatorFn } from "@angular/forms";
import { dynamicMinValidator } from "./dynamic-min-validator";

// Angular's Validators.min(0) is >= 0 (i.e. returns true for 0)
// exclusiveMin(0) is > 0 (i.e. returns false for 0)
export function minValidator(minimum: number, inclusive: boolean): ValidatorFn {
  return dynamicMinValidator(() => {
    return minimum;
  }, inclusive);
}
