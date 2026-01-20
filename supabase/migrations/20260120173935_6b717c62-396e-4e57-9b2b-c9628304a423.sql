-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'alumni');

-- Create enum for connection status
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create enum for mentorship request status
CREATE TYPE public.mentorship_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create student_profiles table
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    branch TEXT NOT NULL,
    graduation_year INTEGER NOT NULL,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    linkedin_url TEXT,
    github_url TEXT,
    bio TEXT,
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create alumni_profiles table
CREATE TABLE public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    graduation_year INTEGER NOT NULL,
    current_company TEXT NOT NULL,
    job_role TEXT NOT NULL,
    industry TEXT NOT NULL,
    willing_to_mentor BOOLEAN DEFAULT false,
    linkedin_url TEXT,
    years_of_experience INTEGER,
    location TEXT,
    bio TEXT,
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create connections table
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    alumni_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status connection_status DEFAULT 'pending' NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (student_id, alumni_id)
);

-- Create mentorship_requests table
CREATE TABLE public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    alumni_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status mentorship_status DEFAULT 'pending' NOT NULL,
    message TEXT,
    areas_of_interest TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (student_id, alumni_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alumni_profiles_updated_at
    BEFORE UPDATE ON public.alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_requests_updated_at
    BEFORE UPDATE ON public.mentorship_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for student_profiles
CREATE POLICY "Anyone authenticated can view student profiles"
    ON public.student_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Students can update own profile"
    ON public.student_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile"
    ON public.student_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for alumni_profiles
CREATE POLICY "Anyone authenticated can view alumni profiles"
    ON public.alumni_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Alumni can update own profile"
    ON public.alumni_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Alumni can insert own profile"
    ON public.alumni_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for connections
CREATE POLICY "Users can view their own connections"
    ON public.connections FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id OR auth.uid() = alumni_id);

CREATE POLICY "Students can create connection requests"
    ON public.connections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Alumni can update connection status"
    ON public.connections FOR UPDATE
    TO authenticated
    USING (auth.uid() = alumni_id);

CREATE POLICY "Users can delete own connections"
    ON public.connections FOR DELETE
    TO authenticated
    USING (auth.uid() = student_id OR auth.uid() = alumni_id);

-- RLS Policies for mentorship_requests
CREATE POLICY "Users can view their own mentorship requests"
    ON public.mentorship_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id OR auth.uid() = alumni_id);

CREATE POLICY "Students can create mentorship requests"
    ON public.mentorship_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Alumni can update mentorship request status"
    ON public.mentorship_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = alumni_id);

CREATE POLICY "Users can delete own mentorship requests"
    ON public.mentorship_requests FOR DELETE
    TO authenticated
    USING (auth.uid() = student_id OR auth.uid() = alumni_id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX idx_student_profiles_graduation_year ON public.student_profiles(graduation_year);
CREATE INDEX idx_alumni_profiles_user_id ON public.alumni_profiles(user_id);
CREATE INDEX idx_alumni_profiles_graduation_year ON public.alumni_profiles(graduation_year);
CREATE INDEX idx_alumni_profiles_company ON public.alumni_profiles(current_company);
CREATE INDEX idx_alumni_profiles_industry ON public.alumni_profiles(industry);
CREATE INDEX idx_connections_student_id ON public.connections(student_id);
CREATE INDEX idx_connections_alumni_id ON public.connections(alumni_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_mentorship_requests_student_id ON public.mentorship_requests(student_id);
CREATE INDEX idx_mentorship_requests_alumni_id ON public.mentorship_requests(alumni_id);