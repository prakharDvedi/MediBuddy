alter table public.extracted_items
  drop constraint if exists extracted_items_item_type_check;

alter table public.extracted_items
  add constraint extracted_items_item_type_check
  check (item_type in ('medicine', 'procedure', 'test', 'consumable', 'charge', 'service', 'misc'));
