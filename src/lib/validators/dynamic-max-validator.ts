import { AbstractControl, ValidatorFn } from "@angular/forms";

// Uses a function getMaxFunction to compute the max and evaluates the max against
// the current value
export function dynamicMaxValidator(getMaxFunction: () => number, inclusive: boolean): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      // let some other validator validate whether the field is required
      return null;
    }

    let value = parseFloat(control.value);
    let valid;
    if (isNaN(value) || getMaxFunction() == null) {
      valid = false;
    } else if (inclusive) {
      valid = value <= getMaxFunction();
    } else {
      valid = value < getMaxFunction();
    }
    return !valid ? { dynamicMax: { value: control.value } } : null;
  };
}
