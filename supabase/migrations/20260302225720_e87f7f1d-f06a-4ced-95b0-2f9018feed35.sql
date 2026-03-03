
-- Change admin role to gym_admin for the gym
UPDATE public.user_roles 
SET role = 'gym_admin', gym_id = '3e89d237-8ce1-4d0b-bbc0-9474a7e78d14'
WHERE user_id = 'abfe4ce2-9971-4f6b-97a8-20dae5d88479';

-- Also assign the gym to the profile
UPDATE public.profiles 
SET gym_id = '3e89d237-8ce1-4d0b-bbc0-9474a7e78d14'
WHERE user_id = 'abfe4ce2-9971-4f6b-97a8-20dae5d88479';
