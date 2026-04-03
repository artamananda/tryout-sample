WITH normalized AS (
  SELECT
    bank_soal_id,
    ARRAY(
      SELECT regexp_replace(TRIM(opt), '^[A-E]\.\s*', '', 'i')
      FROM unnest(options) WITH ORDINALITY AS t(opt, ord)
      ORDER BY ord
    ) AS cleaned_options,
    UPPER(TRIM(correct_answer)) AS normalized_answer
  FROM bank_soals
  WHERE options IS NOT NULL
    AND array_length(options, 1) >= 1
    AND (
      UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D', 'E')
      OR EXISTS (
        SELECT 1
        FROM unnest(options) AS o(opt)
        WHERE TRIM(opt) ~* '^[A-E]\.\s*'
      )
    )
)
UPDATE bank_soals bs
SET options = n.cleaned_options,
  correct_answer = CASE n.normalized_answer
    WHEN 'A' THEN n.cleaned_options[1]
    WHEN 'B' THEN n.cleaned_options[2]
    WHEN 'C' THEN n.cleaned_options[3]
    WHEN 'D' THEN n.cleaned_options[4]
    WHEN 'E' THEN n.cleaned_options[5]
    ELSE bs.correct_answer
  END,
  updated_at = NOW()
FROM normalized n
WHERE bs.bank_soal_id = n.bank_soal_id;
