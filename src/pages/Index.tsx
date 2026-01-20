import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  MessageSquare,
  Target,
  ArrowRight,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  const features = [
    {
      icon: Users,
      title: 'Alumni Directory',
      description:
        'Browse and search through our extensive network of alumni from various industries and companies.',
    },
    {
      icon: MessageSquare,
      title: 'Connection Requests',
      description:
        'Send personalized connection requests to alumni and build meaningful professional relationships.',
    },
    {
      icon: Target,
      title: 'Mentorship Program',
      description:
        'Request mentorship from experienced alumni who are willing to guide your career journey.',
    },
    {
      icon: Briefcase,
      title: 'Career Guidance',
      description:
        'Get insights about different industries, roles, and career paths from those who have been there.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Alumni' },
    { value: '1000+', label: 'Students' },
    { value: '50+', label: 'Companies' },
    { value: '200+', label: 'Connections Made' },
  ];

  const benefits = [
    'Direct access to alumni working at top companies',
    'Personalized career advice and mentorship',
    'Internship and placement referrals',
    'Industry insights and guidance',
    'Professional networking opportunities',
    'Skill development resources',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30" />
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                <span>Engineering College Network</span>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Connect with Alumni,{' '}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Shape Your Future
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Bridge the gap between students and alumni. Get mentorship, career guidance,
                internship opportunities, and build lasting professional connections.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Button asChild className="btn-hero">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="btn-hero">
                      <Link to="/auth?mode=signup">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="btn-outline-hero">
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-card/50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to connect
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our platform provides all the tools for meaningful student-alumni interactions.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-soft card-hover"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-card/50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Why join our network?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Our alumni network has helped hundreds of students launch their careers.
                  Join today and unlock these benefits.
                </p>
                <ul className="mt-8 space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 via-accent to-primary/5 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                      <Users className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      Join Today
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Start building your professional network
                    </p>
                    {!user && (
                      <Button asChild className="btn-hero">
                        <Link to="/auth?mode=signup">
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:px-12 sm:py-20 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
              <div className="relative">
                <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
                  Ready to connect?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                  Join thousands of students and alumni who are already building valuable
                  connections through our platform.
                </p>
                <div className="mt-8">
                  {user ? (
                    <Button asChild variant="secondary" size="lg">
                      <Link to="/directory">
                        Explore Alumni
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" size="lg">
                      <Link to="/auth?mode=signup">
                        Get Started for Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
