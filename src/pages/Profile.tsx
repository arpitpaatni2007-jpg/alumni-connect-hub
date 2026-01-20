import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { StudentProfile, AlumniProfile } from '@/types/database';

export default function Profile() {
  const { user, profile, userRole, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Student profile state
  const [studentData, setStudentData] = useState({
    branch: '',
    graduation_year: new Date().getFullYear() + 1,
    skills: [] as string[],
    interests: [] as string[],
    linkedin_url: '',
    github_url: '',
    bio: '',
  });

  // Alumni profile state
  const [alumniData, setAlumniData] = useState({
    graduation_year: new Date().getFullYear() - 1,
    current_company: '',
    job_role: '',
    industry: '',
    willing_to_mentor: false,
    linkedin_url: '',
    years_of_experience: 0,
    location: '',
    bio: '',
  });

  // Skill/interest input
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    if (user && userRole) {
      fetchProfileData();
    }
  }, [user, userRole]);

  const fetchProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (userRole === 'student') {
        const { data } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setStudentData({
            branch: data.branch || '',
            graduation_year: data.graduation_year || new Date().getFullYear() + 1,
            skills: data.skills || [],
            interests: data.interests || [],
            linkedin_url: data.linkedin_url || '',
            github_url: data.github_url || '',
            bio: data.bio || '',
          });
        }
      } else {
        const { data } = await supabase
          .from('alumni_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setAlumniData({
            graduation_year: data.graduation_year || new Date().getFullYear() - 1,
            current_company: data.current_company || '',
            job_role: data.job_role || '',
            industry: data.industry || '',
            willing_to_mentor: data.willing_to_mentor || false,
            linkedin_url: data.linkedin_url || '',
            years_of_experience: data.years_of_experience || 0,
            location: data.location || '',
            bio: data.bio || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !studentData.skills.includes(skillInput.trim())) {
      setStudentData({
        ...studentData,
        skills: [...studentData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setStudentData({
      ...studentData,
      skills: studentData.skills.filter((s) => s !== skill),
    });
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !studentData.interests.includes(interestInput.trim())) {
      setStudentData({
        ...studentData,
        interests: [...studentData.interests, interestInput.trim()],
      });
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setStudentData({
      ...studentData,
      interests: studentData.interests.filter((i) => i !== interest),
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      if (userRole === 'student') {
        const isComplete = Boolean(
          studentData.branch &&
          studentData.graduation_year &&
          studentData.bio
        );

        const { error } = await supabase
          .from('student_profiles')
          .upsert({
            user_id: user.id,
            ...studentData,
            is_profile_complete: isComplete,
          });

        if (error) throw error;
      } else {
        const isComplete = Boolean(
          alumniData.current_company &&
          alumniData.job_role &&
          alumniData.industry &&
          alumniData.graduation_year
        );

        const { error } = await supabase
          .from('alumni_profiles')
          .upsert({
            user_id: user.id,
            ...alumniData,
            is_profile_complete: isComplete,
          });

        if (error) throw error;
      }

      await refreshProfile();

      toast({
        title: 'Profile saved!',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: error.message || 'An error occurred while saving your profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Your Profile
            </h1>
            <p className="mt-1 text-muted-foreground">
              {userRole === 'student'
                ? 'Complete your profile to connect with alumni'
                : 'Complete your profile to help students find you'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>This information is visible to other users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profile?.full_name || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-specific Profile */}
            {userRole === 'student' ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch / Department *</Label>
                        <Input
                          id="branch"
                          placeholder="e.g., Computer Science"
                          value={studentData.branch}
                          onChange={(e) =>
                            setStudentData({ ...studentData, branch: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduation_year">Expected Graduation Year *</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          min={2020}
                          max={2035}
                          value={studentData.graduation_year}
                          onChange={(e) =>
                            setStudentData({
                              ...studentData,
                              graduation_year: parseInt(e.target.value) || new Date().getFullYear(),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio *</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself, your goals, and what you're looking for..."
                        value={studentData.bio}
                        onChange={(e) =>
                          setStudentData({ ...studentData, bio: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Interests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill..."
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        />
                        <Button type="button" variant="outline" onClick={handleAddSkill}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {studentData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="hover:text-primary/70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Interests</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add an interest..."
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                        />
                        <Button type="button" variant="outline" onClick={handleAddInterest}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {studentData.interests.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => handleRemoveInterest(interest)}
                              className="hover:opacity-70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>Optional but recommended</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                          id="linkedin"
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          value={studentData.linkedin_url}
                          onChange={(e) =>
                            setStudentData({ ...studentData, linkedin_url: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub URL</Label>
                        <Input
                          id="github"
                          type="url"
                          placeholder="https://github.com/..."
                          value={studentData.github_url}
                          onChange={(e) =>
                            setStudentData({ ...studentData, github_url: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Current Company *</Label>
                        <Input
                          id="company"
                          placeholder="e.g., Google"
                          value={alumniData.current_company}
                          onChange={(e) =>
                            setAlumniData({ ...alumniData, current_company: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Job Role *</Label>
                        <Input
                          id="role"
                          placeholder="e.g., Software Engineer"
                          value={alumniData.job_role}
                          onChange={(e) =>
                            setAlumniData({ ...alumniData, job_role: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry *</Label>
                        <Input
                          id="industry"
                          placeholder="e.g., Technology"
                          value={alumniData.industry}
                          onChange={(e) =>
                            setAlumniData({ ...alumniData, industry: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduation_year">Graduation Year *</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          min={1970}
                          max={new Date().getFullYear()}
                          value={alumniData.graduation_year}
                          onChange={(e) =>
                            setAlumniData({
                              ...alumniData,
                              graduation_year: parseInt(e.target.value) || new Date().getFullYear(),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          min={0}
                          max={50}
                          value={alumniData.years_of_experience}
                          onChange={(e) =>
                            setAlumniData({
                              ...alumniData,
                              years_of_experience: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Bangalore, India"
                          value={alumniData.location}
                          onChange={(e) =>
                            setAlumniData({ ...alumniData, location: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Share your journey, experience, and what advice you can offer..."
                        value={alumniData.bio}
                        onChange={(e) =>
                          setAlumniData({ ...alumniData, bio: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mentorship</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Willing to Mentor</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow students to request mentorship from you
                        </p>
                      </div>
                      <Switch
                        checked={alumniData.willing_to_mentor}
                        onCheckedChange={(checked) =>
                          setAlumniData({ ...alumniData, willing_to_mentor: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={alumniData.linkedin_url}
                        onChange={(e) =>
                          setAlumniData({ ...alumniData, linkedin_url: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving} className="btn-hero">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
