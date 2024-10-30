import {GroupCode} from '../db/models/groupCode';

const ALLOWED_CHARACTERS = {
  NUMBERS: '23456789',
  LETTERS: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
};

interface CodeGeneratorOptions {
  length?: number;
  delimiter?: string;
  segmentLength?: number;
}

function generateGroupCode(options: CodeGeneratorOptions = {}): string {
  const {length = 8, delimiter = '-', segmentLength = 4} = options;

  const allCharacters = ALLOWED_CHARACTERS.NUMBERS + ALLOWED_CHARACTERS.LETTERS;
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    code += allCharacters[randomIndex];
  }

  if (delimiter && segmentLength > 0) {
    const segments: string[] = [];
    for (let i = 0; i < code.length; i += segmentLength) {
      segments.push(code.slice(i, i + segmentLength));
    }
    code = segments.join(delimiter);
  }

  return code;
}

async function isCodeUnique(code: string): Promise<boolean> {
  const existingCode = await GroupCode.findOne({code: code});
  if (!existingCode) {
    const newCode = new GroupCode({
      code: code,
    });
    newCode.save();
  }
  return existingCode === null;
}

export function generateUniqueGroupCode(
  options: CodeGeneratorOptions = {}
): string {
  let code: string;
  let attempts = 0;
  const maxAttempts = 1000; // Предохранитель от бесконечного цикла

  do {
    code = generateGroupCode(options);
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error(
        'Не удалось сгенерировать уникальный код после 1000 попыток'
      );
    }
  } while (!isCodeUnique(code));

  return code;
}
