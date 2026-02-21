import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, XCircle, CheckCircle, Plus, LinkIcon, LogOut, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  role: string;
  slug: string;
  created_at: string;
}

interface Stats {
  total: number;
  shortlisted: number;
  knocked_out: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, shortlisted: 0, knocked_out: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, role, slug, created_at")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsData) {
        setJobs(jobsData);
        const jobIds = jobsData.map(j => j.id);

        if (jobIds.length > 0) {
          const { data: candidates } = await supabase
            .from("candidates")
            .select("status")
            .in("job_id", jobIds);

          if (candidates) {
            setStats({
              total: candidates.length,
              shortlisted: candidates.filter(c => c.status === "shortlisted").length,
              knocked_out: candidates.filter(c => c.status === "knocked_out").length,
            });
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this with candidates." });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 px-4 py-8">
      {/* Header */}
      <header className="relative z-10 flex max-w-5xl mx-auto items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">dmless</h1>
        <div className="flex items-center gap-3">
          <Link to="/create-job">
            <Button className="flex items-center gap-1.5 bg-white text-black border border-black hover:bg-gray-100 hover:text-black rounded-xl shadow transition-all">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          </Link>
          <Button
            onClick={handleSignOut}
            className="flex items-center justify-center bg-white text-black border border-black hover:bg-gray-100 hover:text-black rounded-xl shadow transition-all"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card className="rounded-2xl bg-white shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Candidates</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{stats.shortlisted}</p>
              <p className="text-sm text-gray-500">Shortlisted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{stats.knocked_out}</p>
              <p className="text-sm text-gray-500">Knocked Out</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-3">
        <h2 className="mb-4 text-lg font-semibold text-white">Your Jobs</h2>
        {jobs.length === 0 ? (
          <Card className="rounded-2xl bg-white shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-gray-500">No jobs yet. Create your first one!</p>
              <Link to="/create-job">
                <Button className="flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg transition-all">
                  <Plus className="h-4 w-4" />
                  Create Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="rounded-2xl bg-white shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-black">{job.role}</h3>
                  <p className="text-sm text-gray-500">
                    Created {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  className="flex items-center gap-1.5 bg-white text-black border border-black hover:bg-gray-100 hover:text-black rounded-xl shadow transition-all"
                  size="sm"
                  onClick={() => handleCopyLink(job.slug)}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;