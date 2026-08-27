import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Define types
type CallCenter = {
  id: number;
  name: string;
  phoneNumber: string;
  category: string;
  description: string | null;
  isVerified: boolean;
  addedOn: string;
  updatedOn: string;
};

interface CallCenterFormProps {
  isOpen: boolean;
  onClose: () => void;
  callCenter: CallCenter | null;
}

// Define validation schema
const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable().optional(),
  isVerified: z.boolean().default(true),
});

export function CallCenterForm({ isOpen, onClose, callCenter }: CallCenterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const isEditing = !!callCenter;

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: callCenter
      ? {
          name: callCenter.name,
          phoneNumber: callCenter.phoneNumber,
          category: callCenter.category,
          description: callCenter.description,
          isVerified: callCenter.isVerified,
        }
      : {
          name: "",
          phoneNumber: "",
          category: "other",
          description: "",
          isVerified: true,
        },
  });

  // Define mutations
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("/api/call-centers", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-centers"] });
      toast({
        title: "Success",
        description: "Call center added successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add call center",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!callCenter) return null;
      const response = await apiRequest(`/api/call-centers/${callCenter.id}`, "PATCH", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-centers"] });
      toast({
        title: "Success",
        description: "Call center updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update call center",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Call Center</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bank of America" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., +1 (800) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="telecom">Telecom</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this organization"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Verified Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark this call center as verified to trust their calls
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Add Call Center"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}