export function generateQueryString(params?: any) {
  if (!params) return '';

  const query = Object.keys(params)
    .map((key) => {
      if (params[key]) {
        return key + '=' + params[key] + '&';
      }
      return null;
    })
    .join('')
    .slice(0, -1);

  return query && '?' + query;
}
