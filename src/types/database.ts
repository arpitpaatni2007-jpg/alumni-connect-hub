// Database types for Student-Alumni Connect
export type AppRole = 'student' | 'alumni';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
export type MentorshipStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  branch: string;
  graduation_year: number;
  skills: string[];
  interests: string[];
  linkedin_url: string | null;
  github_url: string | null;
  bio: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlumniProfile {
  id: string;
  user_id: string;
  graduation_year: number;
  current_company: string;
  job_role: string;
  industry: string;
  willing_to_mentor: boolean;
  linkedin_url: string | null;
  years_of_experience: number | null;
  location: string | null;
  bio: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  student_id: string;
  alumni_id: string;
  status: ConnectionStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRequest {
  id: string;
  student_id: string;
  alumni_id: string;
  status: MentorshipStatus;
  message: string | null;
  areas_of_interest: string[];
  created_at: string;
  updated_at: string;
}

// Extended types for UI display
export interface AlumniWithProfile extends AlumniProfile {
  profile: Profile;
}

export interface StudentWithProfile extends StudentProfile {
  profile: Profile;
}

export interface ConnectionWithProfiles extends Connection {
  student_profile?: Profile;
  alumni_profile?: Profile;
  student_details?: StudentProfile;
  alumni_details?: AlumniProfile;
}

export interface MentorshipWithProfiles extends MentorshipRequest {
  student_profile?: Profile;
  alumni_profile?: Profile;
  student_details?: StudentProfile;
  alumni_details?: AlumniProfile;
}
