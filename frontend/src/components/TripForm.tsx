import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, MapPin, Package, Flag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LocationInput from "./LocationInput";
import { createTrip } from "../api/tripsApi";
import type { CreateTripPayload } from "../types/trip";

interface FormValues {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
}

interface FieldProps {
  id: keyof FormValues;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}

function FormField({
  id,
  label,
  icon,
  placeholder,
  type = "text",
  step,
  min,
  max,
  error,
  registration,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-medium"
      >
        {icon}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className={
          error ? "border-destructive focus-visible:ring-destructive" : ""
        }
        {...registration}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export default function TripForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { current_cycle_used: 0 } });

  const mutation = useMutation({
    mutationFn: (payload: CreateTripPayload) => createTrip(payload),
    onSuccess: (data) => navigate(`/trips/${data.id}`),
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data;

        if (status === 422) {
          setError("current_cycle_used", {
            message:
              detail?.detail ?? "Cycle hours exceeded the allowed limit.",
          });
        } else if (status === 400) {
          const fieldMap: Record<string, keyof FormValues> = {
            current_location: "current_location",
            pickup_location: "pickup_location",
            dropoff_location: "dropoff_location",
            current_cycle_used: "current_cycle_used",
          };
          let handled = false;
          for (const [key, field] of Object.entries(fieldMap)) {
            if (detail?.[key]) {
              setError(field, {
                message: Array.isArray(detail[key])
                  ? detail[key][0]
                  : detail[key],
              });
              handled = true;
            }
          }
          if (!handled) {
            setError("current_location", {
              message: detail?.detail ?? "Invalid request.",
            });
          }
        }
      }
    },
  });

  const onSubmit = (values: FormValues) =>
    mutation.mutate({
      current_location: values.current_location,
      pickup_location: values.pickup_location,
      dropoff_location: values.dropoff_location,
      current_cycle_used: Number(values.current_cycle_used),
    });

  const isPending = isSubmitting || mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <LocationInput
        control={control}
        name="current_location"
        label="Current Location"
        placeholder="e.g. Chicago, IL"
        icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
        error={errors.current_location?.message}
        required="Current location is required."
      />

      <LocationInput
        control={control}
        name="pickup_location"
        label="Pickup Location"
        placeholder="e.g. Detroit, MI"
        icon={<Package className="w-3.5 h-3.5 text-muted-foreground" />}
        error={errors.pickup_location?.message}
        required="Pickup location is required."
      />

      <LocationInput
        control={control}
        name="dropoff_location"
        label="Dropoff Location"
        placeholder="e.g. Nashville, TN"
        icon={<Flag className="w-3.5 h-3.5 text-muted-foreground" />}
        error={errors.dropoff_location?.message}
        required="Dropoff location is required."
      />

      <FormField
        id="current_cycle_used"
        label="Current Cycle Hours Used (0 – 69.99)"
        icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}
        placeholder="0"
        type="number"
        step="0.01"
        min="0"
        max="69.99"
        error={errors.current_cycle_used?.message}
        registration={register("current_cycle_used", {
          required: "Cycle hours is required.",
          min: { value: 0, message: "Must be at least 0." },
          max: { value: 69.99, message: "Must be 69.99 or less." },
        })}
      />

      <Button type="submit" disabled={isPending} className="mt-1 w-full gap-2">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isPending ? "Planning your route…" : "Plan Route"}
      </Button>
    </form>
  );
}
