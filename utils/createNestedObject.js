const createNestedObject = ( base, names, value ) => {
  // If a value is given, remove the last name and keep it for later:
  var lastName = arguments.length === 3 ? names.pop() : false;

  // Walk the hierarchy, creating new objects where needed.
  // If the lastName was removed, then the last object is not set yet:
  for( var i = 0; i < names.length; i++ ) {
      base = base[ names[i] ] = base[ names[i] ] || {};
  }

  // If a value was given, set it to the last name:
  if( lastName ) base = base[ lastName ] = value;

  // Return the last object in the hierarchy:
  return base;
};

export {
  createNestedObject
}