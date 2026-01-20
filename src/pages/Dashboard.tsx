import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import {
  User,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Connection, MentorshipRequest, Profile, StudentProfile, AlumniProfile } from '@/types/database';

export default function Dashboard() {
  const { user, profile, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<(Connection & { other_profile?: Profile })[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<(MentorshipRequest & { other_profile?: Profile })[]>([]);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (user && userRole) {
      fetchDashboardData();
    }
  }, [user, userRole]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check profile completion
      if (userRole === 'student') {
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('is_profile_complete')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfileComplete(studentProfile?.is_profile_complete || false);
      } else {
        const { data: alumniProfile } = await supabase
          .from('alumni_profiles')
          .select('is_profile_complete')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfileComplete(alumniProfile?.is_profile_complete || false);
      }

      // Fetch connections
      const connectionsQuery = userRole === 'student'
        ? supabase
            .from('connections')
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        : supabase
            .from('connections')
            .select('*')
            .eq('alumni_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

      const { data: connectionsData } = await connectionsQuery;
      
      // Fetch profiles for connections
      if (connectionsData && connectionsData.length > 0) {
        const otherUserIds = connectionsData.map(c => 
          userRole === 'student' ? c.alumni_id : c.student_id
        );
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', otherUserIds);

        const connectionsWithProfiles = connectionsData.map(conn => ({
          ...conn,
          other_profile: profiles?.find(p => 
            p.user_id === (userRole === 'student' ? conn.alumni_id : conn.student_id)
          )
        }));
        
        setConnections(connectionsWithProfiles);
      } else {
        setConnections([]);
      }

      // Fetch mentorship requests
      const mentorshipQuery = userRole === 'student'
        ? supabase
            .from('mentorship_requests')
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        : supabase
            .from('mentorship_requests')
            .select('*')
            .eq('alumni_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

      const { data: mentorshipData } = await mentorshipQuery;
      
      // Fetch profiles for mentorship requests
      if (mentorshipData && mentorshipData.length > 0) {
        const otherUserIds = mentorshipData.map(m => 
          userRole === 'student' ? m.alumni_id : m.student_id
        );
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', otherUserIds);

        const mentorshipWithProfiles = mentorshipData.map(req => ({
          ...req,
          other_profile: profiles?.find(p => 
            p.user_id === (userRole === 'student' ? req.alumni_id : req.student_id)
          )
        }));
        
        setMentorshipRequests(mentorshipWithProfiles);
      } else {
        setMentorshipRequests([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingConnections = connections.filter(c => c.status === 'pending').length;
  const acceptedConnections = connections.filter(c => c.status === 'accepted').length;
  const pendingMentorships = mentorshipRequests.filter(m => m.status === 'pending').length;
  const approvedMentorships = mentorshipRequests.filter(m => m.status === 'approved').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="mt-1 text-muted-foreground">
              {userRole === 'student'
                ? 'Track your connections and mentorship requests'
                : 'Manage your connections and mentorship requests'}
            </p>
          </div>

          {/* Profile Completion Alert */}
          {!profileComplete && (
            <div className="mb-8 rounded-lg border border-warning/50 bg-warning/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Complete your profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your profile is incomplete. Complete it to get better visibility and connections.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/profile">
                      Complete Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profileComplete ? 'Complete' : 'Incomplete'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {profileComplete ? 'Your profile is visible' : 'Complete to unlock features'}
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connections</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptedConnections}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingConnections} pending request{pendingConnections !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentorships</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedMentorships}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingMentorships} pending request{pendingMentorships !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Role</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{userRole}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'student' ? 'Current student' : 'College alumni'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Connections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Connections</CardTitle>
                    <CardDescription>
                      {userRole === 'student'
                        ? 'Your connection requests to alumni'
                        : 'Connection requests from students'}
                    </CardDescription>
                  </div>
                  {userRole === 'student' && (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/directory">Find Alumni</Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 rounded bg-muted" />
                          <div className="h-3 w-16 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : connections.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No connections yet"
                    description={
                      userRole === 'student'
                        ? 'Start connecting with alumni from our directory'
                        : 'No connection requests from students yet'
                    }
                    action={
                      userRole === 'student'
                        ? {
                            label: 'Browse Alumni',
                            onClick: () => window.location.href = '/directory',
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {connection.other_profile?.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {connection.other_profile?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(connection.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={connection.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mentorship Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mentorship Requests</CardTitle>
                    <CardDescription>
                      {userRole === 'student'
                        ? 'Your mentorship requests'
                        : 'Mentorship requests from students'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 rounded bg-muted" />
                          <div className="h-3 w-16 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : mentorshipRequests.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No mentorship requests"
                    description={
                      userRole === 'student'
                        ? 'Request mentorship from alumni in the directory'
                        : 'No mentorship requests from students yet'
                    }
                    action={
                      userRole === 'student'
                        ? {
                            label: 'Find Mentors',
                            onClick: () => window.location.href = '/directory',
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {mentorshipRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                            {request.other_profile?.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {request.other_profile?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
