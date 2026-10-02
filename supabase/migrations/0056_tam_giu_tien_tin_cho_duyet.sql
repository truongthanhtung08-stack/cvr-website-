-- ============================================================================
-- 0056 — TẠM GIỮ TIỀN TIN CHỜ DUYỆT (quy trình chuẩn sàn · chủ dự án chốt 02/10/2026)
-- ----------------------------------------------------------------------------
-- Quy định đã công bố giữ nguyên: "Phí trừ vào ví lúc duyệt. Tin bị từ chối không trừ phí."
-- Thêm: gửi tin chờ duyệt là KHOÁ số tiền đó trong ví → tới lúc duyệt ví luôn đủ.
--   · Tạm giữ = tổng phí (đã gồm GTGT 8%, y hệt tachThue) của các tin ĐANG CHỜ DUYỆT,
--     CHƯA trừ ví (da_tru_vi = false). TÍNH TRỰC TIẾP từ bảng tin — không có sổ riêng
--     nên không bao giờ lệch: duyệt (da_tru_vi = true) / từ chối / xoá tin là tự nhả.
--   · Khả dụng = số dư − tạm giữ. Mọi khoản CHI (duyệt tin, đẩy tin, gói đẩy, hội viên)
--     chỉ được tiêu phần khả dụng. Gửi tin chờ duyệt mà khả dụng không đủ → CSDL chặn.
-- ============================================================================

-- Phí một tin theo gói khách đã chọn (details.plan.giaBao chưa gồm GTGT) → tổng phải trả.
create or replace function public.phi_tin_cho_duyet(p_details jsonb)
returns bigint language sql immutable as $$
  select (g + round(g * 0.08))::bigint
    from (select greatest(0, round(coalesce(nullif(p_details->'plan'->>'giaBao', '')::numeric, 0))) g) x;
$$;

-- Tổng tiền đang tạm giữ của một khách (trừ tin p_bo_tin nếu có).
create or replace function public.tien_tam_giu(p_user uuid, p_bo_tin text default null)
returns bigint language sql stable security definer set search_path to 'public' as $$
  select coalesce(sum(public.phi_tin_cho_duyet(details)), 0)::bigint
    from public.listings
   where owner_id = p_user
     and status = 'pending'
     and coalesce(da_tru_vi, false) = false
     and (p_bo_tin is null or id::text <> p_bo_tin);
$$;

-- Ví của CHÍNH người đang đăng nhập: số dư · đang tạm giữ · khả dụng.
create or replace function public.so_du_kha_dung()
returns table(so_du bigint, tam_giu bigint, kha_dung bigint)
language sql stable security definer set search_path to 'public' as $$
  select coalesce(p.balance, 0)::bigint,
         public.tien_tam_giu(p.id),
         (coalesce(p.balance, 0) - public.tien_tam_giu(p.id))::bigint
    from public.profiles p
   where p.id = auth.uid();
$$;
grant execute on function public.so_du_kha_dung() to authenticated;

-- Gửi tin CHỜ DUYỆT (tạo mới / nháp→chờ / đăng lại) mà khả dụng không đủ → chặn.
create or replace function public.tin_cho_duyet_phai_du_tien()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_phi bigint;
  v_kha_dung bigint;
begin
  if new.status <> 'pending' or new.owner_id is null then return new; end if;
  -- Đã chờ duyệt từ trước: chỉ kiểm khi phí TĂNG (sửa lên gói đắt hơn) — phần tăng thêm.
  if tg_op = 'UPDATE' and old.status = 'pending'
     and public.phi_tin_cho_duyet(new.details) <= public.phi_tin_cho_duyet(old.details) then return new; end if;
  if public.is_admin() then return new; end if;                              -- admin thao tác hộ
  v_phi := public.phi_tin_cho_duyet(new.details);
  if v_phi <= 0 then return new; end if;                                     -- tin miễn phí
  select coalesce(balance, 0) - public.tien_tam_giu(new.owner_id, new.id::text)
    into v_kha_dung from public.profiles where id = new.owner_id;
  if coalesce(v_kha_dung, 0) < v_phi then
    raise exception 'VI_KHONG_DU: cần nạp thêm % đ để đăng tin', v_phi - coalesce(v_kha_dung, 0);
  end if;
  return new;
end $$;
drop trigger if exists trg_tin_cho_duyet_phai_du_tien on public.listings;
create trigger trg_tin_cho_duyet_phai_du_tien before insert or update of status, details on public.listings
  for each row execute function public.tin_cho_duyet_phai_du_tien();

-- ── Mọi khoản CHI chỉ tiêu phần KHẢ DỤNG ──────────────────────────────────────
-- Duyệt tin: route duyệt đặt da_tru_vi = true TRƯỚC khi gọi → tin đang duyệt không còn
-- nằm trong tạm giữ, chỉ giữ lại tiền của các tin chờ duyệt khác.
create or replace function public.tru_vi(p_user uuid, p_tien bigint)
returns table(so_du bigint) language plpgsql security definer set search_path to 'public' as $function$
begin
  if p_tien <= 0 then
    raise exception 'So tien tru vi phai lon hon 0';
  end if;
  return query
  update public.profiles
     set balance = coalesce(balance, 0) - p_tien
   where id = p_user
     and coalesce(balance, 0) - public.tien_tam_giu(p_user) >= p_tien
  returning balance::bigint;
end;
$function$;

create or replace function public.mua_goi_up(p_listing text, p_user uuid, p_so_luot integer, p_tien bigint)
returns table(so_du bigint, con_lai integer) language plpgsql security definer set search_path to 'public' as $function$
declare
  v_so_du  bigint;
  v_con_lai integer;
begin
  if p_so_luot <= 0 then
    return;
  end if;
  if not exists (
    select 1 from listings
     where id = p_listing and owner_id = p_user and status = 'approved'
  ) then
    return;
  end if;
  update profiles
     set balance = balance - p_tien
   where id = p_user and balance - public.tien_tam_giu(p_user) >= p_tien
  returning balance into v_so_du;
  if not found then
    raise exception 'VI_KHONG_DU';
  end if;
  update listings
     set bump_credits = bump_credits + p_so_luot
   where id = p_listing
  returning bump_credits into v_con_lai;
  return query select v_so_du, v_con_lai;
end;
$function$;

create or replace function public.day_tin(p_listing text, p_user uuid, p_tien bigint)
returns table(so_du bigint, moc_day timestamp with time zone) language plpgsql security definer set search_path to 'public' as $function$
declare
  v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_so_du bigint;
begin
  if not exists (
    select 1 from listings
     where id = p_listing and owner_id = p_user and status = 'approved'
  ) then
    return;
  end if;
  begin
    insert into listing_bumps (listing_id, user_id, tien, ngay)
    values (p_listing, p_user, p_tien, v_ngay);
  exception when unique_violation then
    return;
  end;
  update profiles
     set balance = balance - p_tien
   where id = p_user and balance - public.tien_tam_giu(p_user) >= p_tien
  returning balance into v_so_du;
  if not found then
    raise exception 'VI_KHONG_DU';
  end if;
  update listings set bumped_at = now() where id = p_listing;
  return query select v_so_du, (select l.bumped_at from listings l where l.id = p_listing);
end;
$function$;

create or replace function public.tao_hoi_vien(p_user uuid, p_goi text, p_ten_goi text, p_so_thang integer, p_voucher jsonb, p_quyen_loi jsonb, p_tong_tra bigint)
returns table(hoi_vien_id bigint, so_du bigint, het_han timestamp with time zone)
language plpgsql security definer set search_path to 'public' as $function$
declare
  v_du  bigint;
  v_id  bigint;
  v_het timestamptz := now() + make_interval(days => p_so_thang * 30);
begin
  if p_tong_tra <= 0 or p_so_thang <= 0 then
    raise exception 'Giá hoặc thời hạn gói không hợp lệ';
  end if;
  select coalesce(balance, 0)::bigint into v_du from public.profiles where id = p_user for update;
  if not found then raise exception 'Không tìm thấy tài khoản'; end if;
  if exists (select 1 from public.hoi_vien h where h.user_id = p_user and h.het_han > now()) then
    raise exception 'DANG_CO_GOI';
  end if;
  if v_du - public.tien_tam_giu(p_user) < p_tong_tra then
    raise exception 'VI_KHONG_DU';
  end if;
  update public.profiles set balance = coalesce(balance, 0) - p_tong_tra where id = p_user;
  insert into public.hoi_vien (user_id, goi, ten_goi, so_thang, het_han, voucher, quyen_loi, tong_tra)
  values (p_user, p_goi, p_ten_goi, p_so_thang, v_het, coalesce(p_voucher, '[]'::jsonb), coalesce(p_quyen_loi, '[]'::jsonb), p_tong_tra)
  returning id into v_id;
  perform public.cap_voucher_hoi_vien(p_user);
  return query select v_id, v_du - p_tong_tra, v_het;
end;
$function$;
