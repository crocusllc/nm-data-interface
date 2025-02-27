/**
 * Verify the input value cover validation specs.
 *
 * @param pass
 * @returns {*[]}
 */
export function passValidation(pass) {
  let validationErrors= [];
  const requirements = [
    { test: pass.length >= 8, errorMessage: "Must be at least 8 characters"},
    { test: /[A-Z]/.test(pass), errorMessage: "Must contain at least 1 uppercase letter"},
    { test: /[a-z]/.test(pass), errorMessage: "Must contain at least 1 lowercase letter"},
    { test: /\d/.test(pass), errorMessage: "Must contain at least 1 number"},
    { test: /[!@#$%^&*()\-+={}[\]:;"'<>,.?\/|\\]/.test(pass), errorMessage: "Must contain at leas 1 special character"},
  ]

  requirements.forEach( requirement => {
    if(!requirement.test) {
      validationErrors.push(requirement.errorMessage);
    }
  })
  return validationErrors;
}