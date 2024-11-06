import {Group} from '../db/models/group';

interface ValidatorOptions {
  allowLowerCase?: boolean;
  requireDelimiter?: boolean;
}

export async function isValidGroupCode(
  code: string,
  options: ValidatorOptions = {}
): Promise<boolean> {
  const {allowLowerCase = false, requireDelimiter = true} = options;

  const normalizedCode = allowLowerCase ? code.toUpperCase() : code;

  if (!normalizedCode || typeof normalizedCode !== 'string') {
    return false;
  }

  const codeWithoutDelimiter = normalizedCode.replace(/-/g, '');

  if (codeWithoutDelimiter.length !== 8) {
    return false;
  }

  if (requireDelimiter && !normalizedCode.includes('-')) {
    return false;
  }

  const validCharacters = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ-]*$/;
  if (!validCharacters.test(normalizedCode)) {
    return false;
  }

  if (normalizedCode.includes('-')) {
    const segments = normalizedCode.split('-');
    if (
      segments.length !== 2 ||
      segments[0].length !== 4 ||
      segments[1].length !== 4
    ) {
      return false;
    }
  }

  try {
    const group = await Group.findOne({uniqueCode: normalizedCode});
    return group !== null;
  } catch (error) {
    console.error('Error validating group code:', error);
    return false;
  }
}
