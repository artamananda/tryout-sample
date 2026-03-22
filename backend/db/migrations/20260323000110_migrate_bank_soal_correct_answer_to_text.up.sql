UPDATE bank_soals
SET correct_answer = CASE UPPER(TRIM(correct_answer))
    WHEN 'A' THEN options[1]
    WHEN 'B' THEN options[2]
    WHEN 'C' THEN options[3]
    WHEN 'D' THEN options[4]
    WHEN 'E' THEN options[5]
    ELSE correct_answer
END,
updated_at = NOW()
WHERE UPPER(TRIM(correct_answer)) IN ('A', 'B', 'C', 'D', 'E')
  AND options IS NOT NULL
  AND array_length(options, 1) >= 1;
