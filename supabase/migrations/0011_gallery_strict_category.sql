-- Replaces the freeform "Etiket" badge text with a strict 3-option
-- category select, so the icon and label can never disagree the way a
-- freeform string could drift from its intended icon.
--
-- `kind` already existed purely to pick the chip icon (harvest/unboxing) —
-- renamed to `category` and expanded to 3 values, and `badge_label` (the
-- separately freeform label text added one migration ago) is dropped
-- entirely: label and icon are now both derived from this single column.
ALTER TABLE public.gallery_shots DROP CONSTRAINT IF EXISTS gallery_shots_kind_check;

UPDATE public.gallery_shots SET kind = 'bahceden' WHERE kind = 'harvest';
UPDATE public.gallery_shots SET kind = 'kutu_acilisi' WHERE kind = 'unboxing';

ALTER TABLE public.gallery_shots ALTER COLUMN kind SET DEFAULT 'bahceden';
ALTER TABLE public.gallery_shots ADD CONSTRAINT gallery_shots_kind_check
    CHECK (kind IN ('bahceden', 'kutu_acilisi', 'hasat_ani'));

ALTER TABLE public.gallery_shots RENAME COLUMN kind TO category;

ALTER TABLE public.gallery_shots DROP COLUMN IF EXISTS badge_label;
