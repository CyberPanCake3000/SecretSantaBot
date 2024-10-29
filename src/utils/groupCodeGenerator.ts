const ALLOWED_CHARACTERS = {
  NUMBERS: '23456789',
  LETTERS: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
};

interface CodeGeneratorOptions {
  length?: number;
  delimiter?: string;
  segmentLength?: number;
}

export function generateGroupCode(options: CodeGeneratorOptions = {}): string {
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

//TODO: ДОБАВИТЬ В БД ДОКУЕНТ УЖЕ СУЩЕСТВУЮЩИХ КОДОВ
function isCodeUnique(code: string, existingCodes: Set<string>): boolean {
  return !existingCodes.has(code);
}

function generateUniqueGroupCode(
  existingCodes: Set<string>,
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
  } while (!isCodeUnique(code, existingCodes));

  return code;
}
