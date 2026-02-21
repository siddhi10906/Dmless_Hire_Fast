import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

const emptyMCQ = (): MCQ => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [mcqs, setMcqs] = useState<MCQ[]>([
    emptyMCQ(),
    emptyMCQ(),
    emptyMCQ(),
    emptyMCQ(),
    emptyMCQ(),
  ]);
  const [loading, setLoading] = useState(false);

  const updateMCQ = (index: number, field: string, value: any) => {
    setMcqs((prev) => {
      const updated = [...prev];
      if (field === "question") {
        updated[index] = { ...updated[index], question: value };
      } else if (field === "correctAnswer") {
        updated[index] = { ...updated[index], correctAnswer: value };
      } else if (field.startsWith("option-")) {
        const optIdx = parseInt(field.split("-")[1]);
        const newOptions = [...updated[index].options];
        newOptions[optIdx] = value;
        updated[index] = { ...updated[index], options: newOptions };
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    for (let i = 0; i < mcqs.length; i++) {
      if (!mcqs[i].question.trim()) {
        toast({
          title: "Missing question",
          description: `Please fill in question ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!mcqs[i].options[j].trim()) {
          toast({
            title: "Missing option",
            description: `Fill all options for question ${i + 1}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setLoading(true);
    const slug = `${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(
      36
    )}`;

    const { error } = await supabase.from("jobs").insert({
      recruiter_id: user.id,
      role: role.trim(),
      description: description.trim(),
      mcqs: mcqs as any,
      slug,
    });

    if (error) {
      toast({ title: "Error creating job", description: error.message, variant: "destructive" });
    } else {
      const url = `${window.location.origin}/apply/${slug}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Job created!", description: "Link copied to clipboard." });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative flex flex-col items-center justify-start py-8 px-4">
      {/* Glowing circles */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative z-10 flex w-full max-w-3xl items-center gap-3 mb-8">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl bg-white/30 backdrop-blur-md hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Create Job</h1>
      </header>

      {/* Form */}
      <main className="relative z-10 w-full max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Details */}
          <Card className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Job Role</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Frontend Developer Intern"
                  required
                  className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Job Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  required
                  className="rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* MCQs */}
          {mcqs.map((mcq, i) => (
            <Card
              key={i}
              className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl"
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Question {i + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={mcq.question}
                  onChange={(e) => updateMCQ(i, "question", e.target.value)}
                  placeholder="Enter your question..."
                  required
                  className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {mcq.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${i}`}
                        checked={mcq.correctAnswer === j}
                        onChange={() => updateMCQ(i, "correctAnswer", j)}
                        className="h-4 w-4 accent-accent"
                      />
                      <Input
                        value={opt}
                        onChange={(e) => updateMCQ(i, `option-${j}`, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + j)}`}
                        required
                        className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the radio button next to the correct answer
                </p>
              </CardContent>
            </Card>
          ))}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Job & Generate Link"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreateJob;