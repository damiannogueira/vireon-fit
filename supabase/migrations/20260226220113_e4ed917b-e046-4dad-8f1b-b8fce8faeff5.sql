-- Update role to admin
UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'abfe4ce2-9971-4f6b-97a8-20dae5d88479';

-- Update display name
UPDATE public.profiles SET display_name = 'Administrador' WHERE user_id = 'abfe4ce2-9971-4f6b-97a8-20dae5d88479';