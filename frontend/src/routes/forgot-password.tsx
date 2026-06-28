import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrainFront } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · R-AMS" }] }),
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrainFront className="h-5 w-5" />
          </div>
          <div className="font-semibold">R-AMS</div>
        </div>
        <h2 className="text-2xl font-bold">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll send a recovery link to your registered Railways email.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Recovery link sent to your email");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Employee Email</Label>
            <Input id="email" type="email" placeholder="name@indianrailways.gov.in" required />
          </div>
          <Button type="submit" className="w-full">Send recovery link</Button>
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </form>
      </Card>
    </div>
  ),
});
