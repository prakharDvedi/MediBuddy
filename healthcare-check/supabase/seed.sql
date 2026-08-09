-- Legacy demo-curated reference dataset for Healthcare Check MVP.
-- The approved real NPPA/NLEM subset is maintained separately in
-- supabase/seed/nppa_reference_items.sql so it is easy to review and apply.
--
-- These prices are ILLUSTRATIVE, hand-curated approximations for demo
-- purposes (informed by typical NPPA ceiling prices / generic market
-- pricing for common Indian formulations, and typical diagnostic/procedure
-- price ranges). They are NOT pulled from a live, verified NPPA/NLEM feed.
-- source_name says "Demo dataset" on every row for exactly this reason —
-- do not treat these as authoritative pricing in a real audit.
insert into public.reference_items
  (category, name, normalized_name, reference_price, unit, source_name, source_url, is_demo_data, notes)
values
  ('medicine', 'Paracetamol 500mg Tablet', 'paracetamol 500mg tablet', 1.50, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, 'Common antipyretic/analgesic'),
  ('medicine', 'Paracetamol 650mg Tablet', 'paracetamol 650mg tablet', 2.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Ceftriaxone 1g Injection', 'ceftriaxone 1g injection', 95.00, 'vial', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, 'Common broad-spectrum antibiotic'),
  ('medicine', 'Amoxicillin 500mg Capsule', 'amoxicillin 500mg capsule', 8.00, 'capsule', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Azithromycin 500mg Tablet', 'azithromycin 500mg tablet', 12.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Pantoprazole 40mg Tablet', 'pantoprazole 40mg tablet', 6.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, 'PPI, commonly co-prescribed'),
  ('medicine', 'Ondansetron 4mg Injection', 'ondansetron 4mg injection', 15.00, 'ampoule', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, 'Antiemetic'),
  ('medicine', 'Metronidazole 400mg Tablet', 'metronidazole 400mg tablet', 2.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Diclofenac 50mg Tablet', 'diclofenac 50mg tablet', 2.50, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Cefixime 200mg Tablet', 'cefixime 200mg tablet', 18.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Normal Saline 500ml IV Fluid', 'normal saline 500ml iv fluid', 35.00, 'bottle', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Ringer Lactate 500ml IV Fluid', 'ringer lactate 500ml iv fluid', 40.00, 'bottle', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Insulin Glargine 100IU/ml', 'insulin glargine 100iu/ml', 45.00, 'ml', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, 'Priced per ml'),
  ('medicine', 'Atorvastatin 10mg Tablet', 'atorvastatin 10mg tablet', 3.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Amlodipine 5mg Tablet', 'amlodipine 5mg tablet', 1.50, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Metformin 500mg Tablet', 'metformin 500mg tablet', 1.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, 'NLEM listed'),
  ('medicine', 'Ibuprofen 400mg Tablet', 'ibuprofen 400mg tablet', 1.50, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Cetirizine 10mg Tablet', 'cetirizine 10mg tablet', 1.00, 'tablet', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Dexamethasone 4mg Injection', 'dexamethasone 4mg injection', 8.00, 'ampoule', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('medicine', 'Tranexamic Acid 500mg Injection', 'tranexamic acid 500mg injection', 20.00, 'ampoule', 'Demo dataset (illustrative, NPPA-informed)', 'https://www.nppaindia.nic.in/', true, null),
  ('test', 'Complete Blood Count (CBC)', 'complete blood count cbc', 250.00, 'test', 'Demo dataset (illustrative market range)', null, true, 'Typical diagnostic lab range'),
  ('test', 'Chest X-Ray (single view)', 'chest x-ray single view', 350.00, 'test', 'Demo dataset (illustrative market range)', null, true, null),
  ('test', 'ECG (12-lead)', 'ecg 12-lead', 200.00, 'test', 'Demo dataset (illustrative market range)', null, true, null),
  ('test', 'Urine Routine Examination', 'urine routine examination', 150.00, 'test', 'Demo dataset (illustrative market range)', null, true, null),
  ('test', 'Blood Glucose (Random)', 'blood glucose random', 80.00, 'test', 'Demo dataset (illustrative market range)', null, true, null),
  ('consumable', 'IV Cannula 18G', 'iv cannula 18g', 45.00, 'piece', 'Demo dataset (illustrative market range)', null, true, null),
  ('consumable', 'Surgical Gloves (pair)', 'surgical gloves pair', 15.00, 'pair', 'Demo dataset (illustrative market range)', null, true, null),
  ('procedure', 'Nebulization (per session)', 'nebulization per session', 120.00, 'session', 'Demo dataset (illustrative market range)', null, true, null),
  ('procedure', 'Appendectomy (Laparoscopic)', 'appendectomy laparoscopic', 35000.00, 'package', 'Demo dataset (illustrative package range)', null, true, 'Illustrative package price, varies widely by hospital/city'),
  ('procedure', 'Normal Delivery', 'normal delivery', 25000.00, 'package', 'Demo dataset (illustrative package range)', null, true, 'Illustrative package price, varies widely by hospital/city');
