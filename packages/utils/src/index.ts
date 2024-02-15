/**
 * Capitalize a the first letter of a string.
 * @param {string} word A string to capitalize.
 * @returns {string} The word parameter with the first letter capitalized.
 */
export function capitalize(word: string | null) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : '';
}

/**
 * Generate a new scope name which does not
 * conflict / overlap with a previous scope name.
 * Really these just need to be unique within the coordination object.
 * So in theory they could be String(Math.random()) or uuidv4() or something.
 * However it may be good to make them more human-readable and memorable
 * since eventually we will want to expose a UI to update the coordination.
 * @param {string[]} prevScopes Previous scope names.
 * @returns {string} The new scope name.
 */
export function getNextScope(prevScopes: string[]) {
  // Keep an ordered list of valid characters.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // Store the value of the next character for each position
  // in the new string.
  // For example, [0] -> "A", [1] -> "B", [0, 1] -> "AB"
  const nextCharIndices = [0];

  // Generate a new scope name,
  // potentially conflicting with an existing name.
  // Reference: https://stackoverflow.com/a/12504061
  function next() {
    const r: string[] = [];
    nextCharIndices.forEach((charIndex) => {
      r.unshift(chars[charIndex]);
    });
    let increment = true;
    for (let i = 0; i < nextCharIndices.length; i++) {
      const val = ++nextCharIndices[i];
      if (val >= chars.length) {
        nextCharIndices[i] = 0;
      } else {
        increment = false;
        break;
      }
    }
    if (increment) {
      nextCharIndices.push(0);
    }
    return r.join('');
  }

  let nextScope;
  do {
    nextScope = next();
  } while (prevScopes.includes(nextScope));
  return nextScope;
}

/**
 * Generate a new scope name which does not
 * conflict / overlap with a previous scope name.
 * Really these just need to be unique within the coordination object.
 * So in theory they could be String(Math.random()) or uuidv4() or something.
 * In this version we use an incrementing integer starting from 0.
 * @param {string[]} prevScopes Previous scope names.
 * @returns {string} The new scope name.
 */
export function getNextScopeNumeric(prevScopes: string[]) {
  let nextScopeInt = 0;
  let nextScopeStr: string;
  do {
    nextScopeStr = `${nextScopeInt}`;
    nextScopeInt += 1;
  } while (prevScopes.includes(nextScopeStr));
  return nextScopeStr;
}

/**
 * Generate a getNextScopeNumeric function which includes a prefix.
 * @param {string} prefix The prefix to use.
 * @returns {Function} The getNextScope function.
 */
export function createPrefixedGetNextScopeNumeric(prefix: string) {
  return (prevScopes: string[]) => {
    let nextScopeInt = 0;
    let nextScopeStr: string;
    do {
      nextScopeStr = `${prefix}${nextScopeInt}`;
      nextScopeInt += 1;
    } while (prevScopes.includes(nextScopeStr));
    return nextScopeStr;
  };
}
