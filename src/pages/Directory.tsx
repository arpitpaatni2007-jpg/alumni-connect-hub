import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonList } from '@/components/common/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Briefcase,
  MapPin,
  GraduationCap,
  Users,
  MessageSquare,
  Send,
  Filter,
  X,
  Linkedin,
  Heart,
} from 'lucide-react';
import { AlumniProfile, Profile } from '@/types/database';

interface AlumniWithProfile extends AlumniProfile {
  profile: Profile;
}

export default function Directory() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<AlumniWithProfile[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniWithProfile[]>([]);
  const [existingConnections, setExistingConnections] = useState<string[]>([]);
  const [existingMentorships, setExistingMentorships] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniWithProfile | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [sendingConnection, setSendingConnection] = useState(false);
  const [sendingMentorship, setSendingMentorship] = useState(false);

  // Filter options
  const [years, setYears] = useState<number[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    fetchAlumni();
    if (user && userRole === 'student') {
      fetchExistingRequests();
    }
  }, [user, userRole]);

  useEffect(() => {
    applyFilters();
  }, [alumni, searchQuery, yearFilter, companyFilter, industryFilter]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const { data: alumniData, error } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('is_profile_complete', true);

      if (error) throw error;

      if (alumniData && alumniData.length > 0) {
        // Fetch profiles for alumni
        const userIds = alumniData.map((a) => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        const alumniWithProfiles: AlumniWithProfile[] = alumniData.map((a) => ({
          ...a,
          profile: profiles?.find((p) => p.user_id === a.user_id) as Profile,
        }));

        setAlumni(alumniWithProfiles);

        // Extract filter options
        const uniqueYears = [...new Set(alumniData.map((a) => a.graduation_year))].sort((a, b) => b - a);
        const uniqueCompanies = [...new Set(alumniData.map((a) => a.current_company))].sort();
        const uniqueIndustries = [...new Set(alumniData.map((a) => a.industry))].sort();

        setYears(uniqueYears);
        setCompanies(uniqueCompanies);
        setIndustries(uniqueIndustries);
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRequests = async () => {
    if (!user) return;

    try {
      // Fetch existing connections
      const { data: connections } = await supabase
        .from('connections')
        .select('alumni_id')
        .eq('student_id', user.id);

      if (connections) {
        setExistingConnections(connections.map((c) => c.alumni_id));
      }

      // Fetch existing mentorship requests
      const { data: mentorships } = await supabase
        .from('mentorship_requests')
        .select('alumni_id')
        .eq('student_id', user.id);

      if (mentorships) {
        setExistingMentorships(mentorships.map((m) => m.alumni_id));
      }
    } catch (error) {
      console.error('Error fetching existing requests:', error);
    }
  };

  const applyFilters = () => {
    let result = [...alumni];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.profile?.full_name?.toLowerCase().includes(query) ||
          a.current_company?.toLowerCase().includes(query) ||
          a.job_role?.toLowerCase().includes(query) ||
          a.industry?.toLowerCase().includes(query)
      );
    }

    // Year filter
    if (yearFilter !== 'all') {
      result = result.filter((a) => a.graduation_year === parseInt(yearFilter));
    }

    // Company filter
    if (companyFilter !== 'all') {
      result = result.filter((a) => a.current_company === companyFilter);
    }

    // Industry filter
    if (industryFilter !== 'all') {
      result = result.filter((a) => a.industry === industryFilter);
    }

    setFilteredAlumni(result);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setYearFilter('all');
    setCompanyFilter('all');
    setIndustryFilter('all');
  };

  const hasActiveFilters = searchQuery || yearFilter !== 'all' || companyFilter !== 'all' || industryFilter !== 'all';

  const sendConnectionRequest = async () => {
    if (!user || !selectedAlumni) return;

    setSendingConnection(true);
    try {
      const { error } = await supabase.from('connections').insert({
        student_id: user.id,
        alumni_id: selectedAlumni.user_id,
        message: connectionMessage || null,
      });

      if (error) throw error;

      setExistingConnections([...existingConnections, selectedAlumni.user_id]);
      setConnectionMessage('');
      setSelectedAlumni(null);

      toast({
        title: 'Connection request sent!',
        description: `Your request has been sent to ${selectedAlumni.profile?.full_name}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send connection request.',
        variant: 'destructive',
      });
    } finally {
      setSendingConnection(false);
    }
  };

  const sendMentorshipRequest = async () => {
    if (!user || !selectedAlumni) return;

    setSendingMentorship(true);
    try {
      const { error } = await supabase.from('mentorship_requests').insert({
        student_id: user.id,
        alumni_id: selectedAlumni.user_id,
        message: mentorshipMessage || null,
      });

      if (error) throw error;

      setExistingMentorships([...existingMentorships, selectedAlumni.user_id]);
      setMentorshipMessage('');
      setSelectedAlumni(null);

      toast({
        title: 'Mentorship request sent!',
        description: `Your request has been sent to ${selectedAlumni.profile?.full_name}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send mentorship request.',
        variant: 'destructive',
      });
    } finally {
      setSendingMentorship(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Alumni Directory
            </h1>
            <p className="mt-1 text-muted-foreground">
              Connect with alumni from various industries and companies
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, role, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    !
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <Card className="animate-fade-in">
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Graduation Year</Label>
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All years</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All companies</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={industryFilter} onValueChange={setIndustryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All industries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All industries</SelectItem>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <p className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAlumni.length} of {alumni.length} alumni
            </p>
          )}

          {/* Alumni Grid */}
          {loading ? (
            <SkeletonList count={6} />
          ) : filteredAlumni.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No alumni found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters or search query'
                  : 'No alumni have completed their profiles yet'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear filters',
                      onClick: clearFilters,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAlumni.map((alumniMember) => (
                <Card key={alumniMember.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                        {alumniMember.profile?.full_name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {alumniMember.profile?.full_name}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {alumniMember.job_role} at {alumniMember.current_company}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{alumniMember.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Class of {alumniMember.graduation_year}</span>
                      </div>
                      {alumniMember.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{alumniMember.location}</span>
                        </div>
                      )}
                      {alumniMember.willing_to_mentor && (
                        <div className="flex items-center gap-2 text-success">
                          <Heart className="h-4 w-4" />
                          <span>Open to mentoring</span>
                        </div>
                      )}
                    </div>

                    {alumniMember.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {alumniMember.bio}
                      </p>
                    )}

                    {userRole === 'student' && user && (
                      <div className="flex gap-2">
                        {/* Connection Button */}
                        {existingConnections.includes(alumniMember.user_id) ? (
                          <Button variant="outline" size="sm" disabled className="flex-1">
                            <Users className="mr-2 h-4 w-4" />
                            Requested
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setSelectedAlumni(alumniMember)}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect with {alumniMember.profile?.full_name}</DialogTitle>
                                <DialogDescription>
                                  Send a connection request with an optional message
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Message (optional)</Label>
                                  <Textarea
                                    placeholder="Introduce yourself and explain why you'd like to connect..."
                                    value={connectionMessage}
                                    onChange={(e) => setConnectionMessage(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                <Button
                                  onClick={sendConnectionRequest}
                                  disabled={sendingConnection}
                                  className="w-full btn-hero"
                                >
                                  {sendingConnection ? (
                                    'Sending...'
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      Send Request
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Mentorship Button */}
                        {alumniMember.willing_to_mentor && (
                          existingMentorships.includes(alumniMember.user_id) ? (
                            <Button variant="outline" size="sm" disabled className="flex-1">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Requested
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setSelectedAlumni(alumniMember)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Mentorship
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Request Mentorship</DialogTitle>
                                  <DialogDescription>
                                    Ask {alumniMember.profile?.full_name} to be your mentor
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Message</Label>
                                    <Textarea
                                      placeholder="Explain what you're looking for in a mentor and your career goals..."
                                      value={mentorshipMessage}
                                      onChange={(e) => setMentorshipMessage(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  <Button
                                    onClick={sendMentorshipRequest}
                                    disabled={sendingMentorship}
                                    className="w-full btn-hero"
                                  >
                                    {sendingMentorship ? (
                                      'Sending...'
                                    ) : (
                                      <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Request
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )
                        )}
                      </div>
                    )}

                    {alumniMember.linkedin_url && (
                      <a
                        href={alumniMember.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        View LinkedIn
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
