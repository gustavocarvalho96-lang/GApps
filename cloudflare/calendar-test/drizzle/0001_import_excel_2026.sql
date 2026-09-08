INSERT INTO `monthly_schedules` (`user_email`, `month_key`, `entries_json`, `updated_at`)
VALUES
  ('__excel_seed__', '2026-07', '{"1":"CL 24H","4":"CL 24H","8":"CL 24H","11":"CL 24H","15":"CL 24H","18":"CL D","21":"PAC N","22":"CL 24H","25":"CL 24H","28":"PAC N","29":"CL 24H"}', unixepoch() * 1000),
  ('__excel_seed__', '2026-08', '{"1":"CL 24H","4":"PAC N","5":"CL 24H","8":"CL 24H","11":"PAC N","12":"CL 24H","15":"CL 24H","18":"PAC N","19":"CL 24H","22":"CL 24H","25":"PAC N","26":"CL 24H","29":"CL 24H"}', unixepoch() * 1000),
  ('__excel_seed__', '2026-09', '{"1":"PAC N","2":"CL 24H","5":"CL 24H","8":"PAC N","9":"CL 24H","12":"CL 24H","15":"PAC N","16":"CL 24H","19":"CL 24H","22":"PAC N","23":"CL 24H","26":"CL 24H","29":"PAC N","30":"CL 24H"}', unixepoch() * 1000),
  ('__excel_seed__', '2026-10', '{"3":"CL 24H","6":"PAC N","7":"CL 24H","10":"CL 24H","13":"PAC N","14":"CL 24H","17":"CL 24H","20":"PAC N","21":"CL 24H","24":"CL 24H","27":"PAC N","28":"CL 24H","31":"CL 24H"}', unixepoch() * 1000),
  ('__excel_seed__', '2026-11', '{"3":"PAC N","4":"CL 24H","7":"CL 24H","10":"PAC N","11":"CL 24H","14":"CL 24H","17":"PAC N","18":"CL 24H","21":"CL 24H","24":"PAC N","25":"CL 24H","28":"CL 24H"}', unixepoch() * 1000),
  ('__excel_seed__', '2026-12', '{"1":"PAC N","2":"CL 24H","5":"CL 24H","8":"PAC N","9":"CL 24H","12":"CL 24H","15":"PAC N","16":"CL 24H","19":"CL 24H","22":"PAC N","23":"CL 24H","26":"CL 24H","29":"PAC N","30":"CL 24H"}', unixepoch() * 1000)
ON CONFLICT (`user_email`, `month_key`)
DO UPDATE SET
  `entries_json` = excluded.`entries_json`,
  `updated_at` = excluded.`updated_at`;
