-- Data migration: convert resumeUrls from { en?: string } to { en?: { url, name } }
-- Affects profiles where any locale value is still a plain string.

UPDATE profiles
SET "resumeUrls" = (
  SELECT jsonb_object_agg(
    key,
    CASE
      WHEN jsonb_typeof(value) = 'string' THEN
        jsonb_build_object(
          'url', value #>> '{}',
          'name', regexp_replace(value #>> '{}', '^.*/', '')
        )
      ELSE value
    END
  )
  FROM jsonb_each("resumeUrls")
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_each("resumeUrls")
  WHERE jsonb_typeof(value) = 'string'
);
