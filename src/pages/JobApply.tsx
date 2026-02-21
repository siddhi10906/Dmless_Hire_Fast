import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Upload } from "lucide-react";

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Job {
  id: string;
  role: string;
  description: string;
  mcqs: MCQ[];
}

type Stage =
  | "loading"
  | "info"
  | "quiz"
  | "knocked_out"
  | "upload"
  | "submitted"
  | "not_found";

const JobApply = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, role, description, mcqs")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setStage("not_found");
        return;
      }
      setJob(data as unknown as Job);
      setAnswers(new Array((data.mcqs as any[]).length).fill(null));
      setStage("info");
    };
    fetchJob();
  }, [slug]);

  const handleQuizSubmit = async () => {
    if (!job) return;
    if (answers.some((a) => a === null)) {
      toast({
        title: "Answer all questions",
        description: "Please select an answer for every question.",
        variant: "destructive",
      });
      return;
    }

    const allCorrect = job.mcqs.every((mcq, i) => mcq.correctAnswer === answers[i]);

    if (!allCorrect) {
      await supabase.from("candidates").insert({
        job_id: job.id,
        name: "Anonymous",
        email: "anonymous@knocked.out",
        status: "knocked_out",
        answers: answers as any,
      });
    }

    setStage(allCorrect ? "upload" : "knocked_out");
  };

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !resume) return;

    if (resume.type !== "application/pdf") {
      toast({
        title: "PDF only",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const filePath = `${job.id}/${Date.now()}-${resume.name}`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, resume);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("candidates").insert({
      job_id: job.id,
      name: name.trim(),
      email: email.trim(),
      status: "shortlisted",
      resume_url: filePath,
      answers: answers as any,
    });

    if (insertError) {
      toast({ title: "Submission failed", description: insertError.message, variant: "destructive" });
    } else {
      setStage("submitted");
    }
    setSubmitting(false);
  };

  if (stage === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  if (stage === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-4">
        <Card className="max-w-md w-full text-center bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <CardContent className="py-12">
            <p className="text-lg font-bold text-foreground">Job not found</p>
            <p className="mt-2 text-muted-foreground">This link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6 flex flex-col items-center justify-center">
      {/* Glow Background */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        {/* Job Info */}
        {stage === "info" && (
          <Card className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{job.role}</CardTitle>
              <CardDescription>{job.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                You'll answer {job.mcqs.length} screening questions. All must be correct to proceed.
              </p>
              <Button
                onClick={() => setStage("quiz")}
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
              >
                Start Screening
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quiz */}
        {stage === "quiz" && (
          <div className="space-y-4">
            {job.mcqs.map((mcq, i) => (
              <Card key={i} className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {i + 1}. {mcq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mcq.options.map((opt, j) => (
                    <label
                      key={j}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                        answers[i] === j ? "border-indigo-600 bg-indigo-50" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === j}
                        onChange={() => {
                          const newAnswers = [...answers];
                          newAnswers[i] = j;
                          setAnswers(newAnswers);
                        }}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      <span className="text-sm text-foreground">{opt}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={handleQuizSubmit}
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
            >
              Submit Answers
            </Button>
          </div>
        )}

        {/* Knocked Out */}
        {stage === "knocked_out" && (
          <Card className="text-center rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardContent className="py-12">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h2 className="text-xl font-bold text-foreground">You are Knocked Out</h2>
              <p className="mt-2 text-muted-foreground">
                Unfortunately, one or more of your answers were incorrect.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resume Upload */}
        {stage === "upload" && (
          <Card className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 text-success mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">All answers correct!</span>
              </div>
              <CardTitle className="text-2xl font-bold">Upload Your Resume</CardTitle>
              <CardDescription>
                Complete your application by providing your details and resume.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResumeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cand-name">Full Name</Label>
                  <Input
                    id="cand-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cand-email">Email</Label>
                  <Input
                    id="cand-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume (PDF)</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="resume"
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-indigo-600 hover:text-indigo-600"
                    >
                      <Upload className="h-4 w-4" />
                      {resume ? resume.name : "Choose PDF file"}
                    </label>
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setResume(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Submitted */}
        {stage === "submitted" && (
          <Card className="text-center rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardContent className="py-12">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
              <h2 className="text-xl font-bold text-foreground">Application Submitted!</h2>
              <p className="mt-2 text-muted-foreground">
                Thank you for applying. The recruiter will review your application.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobApply;