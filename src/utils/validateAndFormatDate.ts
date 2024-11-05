interface DateValidationResult {
  isValid: boolean;
  mongoDate?: Date;
  error?: string;
}

export const validateAndFormatDate = (
  dateString: string
): DateValidationResult => {
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const matches = dateString.match(dateRegex);

  if (!matches) {
    return {
      isValid: false,
      error: 'Неверный формат даты. Используйте ДД.ММ.ГГГГ',
    };
  }

  const [, day, month, year] = matches;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10) - 1;
  const yearNum = parseInt(year, 10);

  const inputDate = new Date(yearNum, monthNum, dayNum, 12, 0, 0, 0);

  if (
    inputDate.getDate() !== dayNum ||
    inputDate.getMonth() !== monthNum ||
    inputDate.getFullYear() !== yearNum
  ) {
    return {
      isValid: false,
      error: 'Недопустимая дата',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    return {
      isValid: false,
      error: 'Дата не может быть в прошлом',
    };
  }

  return {
    isValid: true,
    mongoDate: new Date(Date.UTC(yearNum, monthNum, dayNum, 12, 0, 0, 0)),
  };
};
