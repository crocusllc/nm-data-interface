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

/**
 * Add the required formt to dates.
 * 
 * @param dateStr
 * @returns {string}
 */
export function dateFormat(dateStr) {
  if (!dateStr) return ""; // Handle empty/null/undefined inputs

  const date = new Date(dateStr); // Date in UTC

  if (isNaN(date.getTime())) return "";

  // Get UTC components and format them
  const year = date.getUTCFullYear().toString().slice(-2); 
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');

  return `${month}/${day}/${year}`;
}