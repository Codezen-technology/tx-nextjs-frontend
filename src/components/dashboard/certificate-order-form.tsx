"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/hooks/useAuth";
import {
  useCertificateOrderConfig,
  useStudentCourses,
  useSubmitCertificateOrder,
} from "@/lib/hooks/useStudentDashboard";
import { certificateOrderSchema, type CertificateOrderInput } from "@/lib/schemas/certificate";
import { cartService } from "@/lib/services/cart";
import type { ApiError } from "@/lib/api/error";

export function CertificateOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = Number(searchParams.get("course_id") ?? 0);

  const { data: me } = useMe();
  const configQuery = useCertificateOrderConfig();
  const coursesQuery = useStudentCourses({
    access: "completed",
    per_page: 100,
    page: 1,
  });
  const submitMutation = useSubmitCertificateOrder();

  const course = coursesQuery.data?.courses.find((c) => c.id === courseId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CertificateOrderInput>({
    resolver: zodResolver(certificateOrderSchema),
    defaultValues: {
      course_id: courseId,
      full_name: "",
      email: "",
      phone: "",
      address_line_1: "",
      city: "",
      postcode: "",
      country: "United Kingdom",
      delivery_notes: "",
      website: "",
    },
  });

  useEffect(() => {
    if (courseId > 0) {
      setValue("course_id", courseId);
    }
  }, [courseId, setValue]);

  useEffect(() => {
    if (me) {
      const name = [me.first_name, me.last_name].filter(Boolean).join(" ").trim();
      reset((prev) => ({
        ...prev,
        full_name: name || prev.full_name,
        email: me.email ?? prev.email,
        course_id: courseId > 0 ? courseId : prev.course_id,
      }));
    }
  }, [me, courseId, reset]);

  const onSubmit = async (data: CertificateOrderInput) => {
    if (data.website) return;

    try {
      const result = await submitMutation.mutateAsync({
        course_id: data.course_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || undefined,
        address_line_1: data.address_line_1,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        delivery_notes: data.delivery_notes || undefined,
      });

      await cartService.addItem(result.product_id, 1);
      toast.success("Certificate added to cart. Complete checkout to receive your credit.");
      router.push("/checkout");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message ?? "Could not submit certificate order.");
    }
  };

  if (courseId <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Certificate</CardTitle>
          <CardDescription>
            Select a completed course from My Learning to order a certificate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/dashboard/my-learning?tab=completed")}>
            Go to Completed Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (coursesQuery.isLoading || configQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course not found</CardTitle>
          <CardDescription>
            This course is not in your completed list or the course ID is invalid.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const config = configQuery.data;
  const priceLabel =
    config?.price != null && config.currency
      ? `${config.currency} ${config.price.toFixed(2)}`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Certificate</CardTitle>
        <CardDescription>
          {course.name}
          {priceLabel ? ` — ${priceLabel}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("course_id", { valueAsNumber: true })} />
          <input
            type="text"
            {...register("website")}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address_line_1">Address</Label>
              <Input id="address_line_1" {...register("address_line_1")} />
              {errors.address_line_1 && (
                <p className="text-sm text-red-600">{errors.address_line_1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" {...register("postcode")} />
              {errors.postcode && <p className="text-sm text-red-600">{errors.postcode.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
              {errors.country && <p className="text-sm text-red-600">{errors.country.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="delivery_notes">Delivery notes (optional)</Label>
              <textarea
                id="delivery_notes"
                rows={3}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-hidden"
                {...register("delivery_notes")}
              />
            </div>
          </div>

          <Button type="submit" disabled={submitMutation.isPending || !config?.enabled}>
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Continue to checkout"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
