import React from 'react';

import FormQuestion from '../views/FormQuestion';

const FormKpu = () => {
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const parts = pathname.split('/');
  const tryoutId = parts[parts.length - 4];
  const questionType = parts[parts.length - 1];
  return (
    <FormQuestion
      questionType={questionType}
      tryoutId={tryoutId}
      questionLength={30}
      title="Kemampuan Penalaran Umum"
    />
  );
};

export default FormKpu;
