"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssignCoursesPicker } from "@/components/business/learners/assign-courses-picker";
import { CsvImportSection } from "@/components/business/learners/csv-import-section";
import {
  useAddBusinessLearner,
  useAssignBusinessCourse,
  useCheckLearnerEmail,
} from "@/lib/hooks/useBusinessDashboard";
import { EMAIL_REGEX } from "@/lib/utils/business-csv";
import { cn } from "@/lib/utils/cn";

type AddMode = "single" | "csv";

export default function AddBusinessLearnerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AddMode>("single");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const addLearner = useAddBusinessLearner();
  const assignCourse = useAssignBusinessCourse();
  const { data: emailCheck, isFetching: isCheckingEmail } = useCheckLearnerEmail(
    email,
    emailTouched,
  );

  const isExistingUser = emailCheck?.exists === true;
  const isTeamMember = emailCheck?.is_team_member === true;
  const existingLastName = emailCheck?.user_data?.last_name?.trim() ?? "";
  const namesLocked = isExistingUser && !isTeamMember;
  const existingUserMissingLastName = namesLocked && !existingLastName;

  // Auto-fill names when an existing WP user is found (not already on team)
  useEffect(() => {
    if (!emailCheck?.exists || !emailCheck.user_data) return;
    if (emailCheck.is_team_member) return;

    setFirstName(emailCheck.user_data.first_name ?? "");
    setLastName(emailCheck.user_data.last_name ?? "");

    const name =
      [emailCheck.user_data.first_name, emailCheck.user_data.last_name].filter(Boolean).join(" ") ||
      emailCheck.user_data.display_name;

    setInfoMessage(
      name
        ? `User ${name} exists in the system. Name fields have been filled automatically.`
        : "User exists in the system. Name fields have been filled automatically.",
    );
  }, [emailCheck]);

  const onEmailChange = (value: string) => {
    setEmail(value);
    setSubmitError("");
    setInfoMessage("");
    if (isExistingUser || isTeamMember) {
      setFirstName("");
      setLastName("");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setSubmitError("Enter a valid email address.");
      return;
    }

    if (isTeamMember) {
      setSubmitError("This user is already a member of your team.");
      return;
    }

    let created: { user_id?: number; id?: number };

    try {
      created = await addLearner.mutateAsync({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: "learner",
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not add learner");
      return;
    }

    // The learner exists at this point. A course assignment that fails must be
    // reported without losing that, so failures are surfaced in place rather
    // than thrown — navigating away would hide a half-finished setup.
    const userId = created?.user_id ?? created?.id;
    const failed: number[] = [];

    if (userId && courseIds.length > 0) {
      for (const courseId of courseIds) {
        try {
          await assignCourse.mutateAsync({ course_id: courseId, user_ids: [userId] });
        } catch {
          failed.push(courseId);
        }
      }
    }

    if (failed.length > 0) {
      setSubmitError(
        `Learner added, but ${failed.length} course assignment${
          failed.length === 1 ? "" : "s"
        } failed — no licence available. Assign them from the Courses page.`,
      );
      return;
    }

    router.push("/business-dashboard/learners");
  };

  const submitDisabled =
    addLearner.isPending ||
    assignCourse.isPending ||
    isCheckingEmail ||
    isTeamMember ||
    !firstName.trim() ||
    (!isExistingUser && !lastName.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BusinessPageHeader
        title="Add learners"
        description="Add one learner at a time, or import a spreadsheet."
        actions={
          <Button asChild variant="outline">
            <Link href="/business-dashboard/learners">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="border-neutral-30 inline-flex rounded-lg border bg-white p-1">
        {(["single", "csv"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              mode === value ? "bg-[#3F576F] text-white" : "hover:bg-neutral-10 text-neutral-700",
            )}
          >
            {value === "single" ? "One learner" : "Import CSV"}
          </button>
        ))}
      </div>

      {mode === "csv" ? (
        <CsvImportSection onDone={() => router.refresh()} />
      ) : (
        <form
          onSubmit={onSubmit}
          className="border-neutral-40 space-y-4 rounded-xl border bg-white p-6 shadow-xs"
        >
          <div>
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Email address *
            </label>
            <div className="relative mt-1">
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                disabled={addLearner.isPending}
                placeholder="learner@example.com"
                className={cn(isTeamMember && "border-red-400 focus-visible:ring-red-400")}
              />
              {isCheckingEmail && (
                <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-300" />
              )}
            </div>
            {infoMessage && !isTeamMember ? (
              <p className="mt-1.5 text-sm text-[#3F576F]">{infoMessage}</p>
            ) : null}
            {isTeamMember ? (
              <p className="mt-1.5 text-sm text-red-600">
                This user is already a member of your team.
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="first_name" className="text-sm font-medium text-neutral-700">
              First name *
            </label>
            <Input
              id="first_name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={addLearner.isPending || namesLocked}
              placeholder="John"
              className="mt-1"
            />
            {namesLocked ? (
              <p className="mt-1 text-xs text-neutral-300">
                Name is pre-filled from existing user account
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="last_name" className="text-sm font-medium text-neutral-700">
              Last name{isExistingUser ? "" : " *"}
            </label>
            <Input
              id="last_name"
              required={!isExistingUser}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={addLearner.isPending || namesLocked}
              placeholder={existingUserMissingLastName ? "Not on file" : "Doe"}
              className="mt-1"
            />
            {existingUserMissingLastName ? (
              <p className="mt-1 text-xs text-neutral-300">
                No last name on file for this account. You can still add them as a learner.
              </p>
            ) : null}
          </div>

          <div>
            <span className="text-sm font-medium text-neutral-700">Assign courses (optional)</span>
            <div className="mt-1">
              <AssignCoursesPicker
                selected={courseIds}
                onChange={setCourseIds}
                disabled={addLearner.isPending || assignCourse.isPending}
              />
            </div>
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <Button
            type="submit"
            className="w-full bg-[#3F576F] hover:bg-[#33485d]"
            disabled={submitDisabled}
          >
            {addLearner.isPending || assignCourse.isPending ? "Adding…" : "Add learner"}
          </Button>
        </form>
      )}
    </div>
  );
}
