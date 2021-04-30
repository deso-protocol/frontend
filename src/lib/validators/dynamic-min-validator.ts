import { AbstractControl, ValidatorFn } from "@angular/forms";
import { minValidator } from "./min-validator";

// Uses a function getMinFunction to compute the max and evaluates the max against
// the current value
export function dynamicMinValidator(getMinFunction: () => number, inclusive: boolean): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      // let some other validator validate whether the field is required
      return null;
    }

    let minimum = getMinFunction();

    let value = parseFloat(control.value);
    let valid;
    if (isNaN(value) || minimum == null) {
      valid = false;
    } else if (inclusive) {
      valid = value >= minimum;
    } else {
      valid = value > minimum;
    }
    return !valid ? { exclusiveMin: { value: control.value } } : null;
  };
}
