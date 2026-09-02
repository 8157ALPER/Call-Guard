import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CallCenterForm } from "./call-center-form";
import { useAccessibility } from "@/lib/accessibilityContext";

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

export function CallCenterList() {
  const { highContrast } = useAccessibility();
  const [selectedCallCenter, setSelectedCallCenter] = useState<CallCenter | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: callCenters = [], isLoading, error } = useQuery<CallCenter[]>({
    queryKey: ["/api/call-centers"],
    staleTime: 60 * 1000, // 1 minute
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/call-centers/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-centers"] });
      toast({
        title: "Success",
        description: "Call center deleted successfully.",
        variant: "default",
      });
      setIsDeleteOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete call center.",
        variant: "destructive",
      });
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: number; isVerified: boolean }) => {
      await apiRequest(`/api/call-centers/${id}`, "PATCH", { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-centers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update verification status.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (callCenter: CallCenter) => {
    setSelectedCallCenter(callCenter);
    setIsEditOpen(true);
  };

  const handleDelete = (callCenter: CallCenter) => {
    setSelectedCallCenter(callCenter);
    setIsDeleteOpen(true);
  };

  const handleToggleVerification = (callCenter: CallCenter) => {
    toggleVerificationMutation.mutate({
      id: callCenter.id,
      isVerified: !callCenter.isVerified,
    });
  };

  const closeEditDialog = () => {
    setIsEditOpen(false);
    setSelectedCallCenter(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setSelectedCallCenter(null);
  };

  const getCategoryColor = (category: string) => {
    const categories: Record<string, string> = {
      "bank": "bg-blue-500",
      "telecom": "bg-green-500",
      "healthcare": "bg-red-500",
      "government": "bg-purple-500",
      "utility": "bg-yellow-500",
      "insurance": "bg-indigo-500",
      "other": "bg-gray-500"
    };
    
    return categories[category.toLowerCase()] || "bg-gray-500";
  };

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading call centers...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-6 text-red-500">
        <p>Error loading call centers</p>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trusted Call Centers</h2>
          <p className="text-muted-foreground">
            Manage organizations whose calls are automatically trusted
          </p>
        </div>
        <Button onClick={() => setIsEditOpen(true)}>Add Call Center</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No call centers added yet
                </TableCell>
              </TableRow>
            ) : (
              callCenters.map((callCenter: CallCenter) => (
                <TableRow key={callCenter.id}>
                  <TableCell className="font-medium">{callCenter.name}</TableCell>
                  <TableCell>{callCenter.phoneNumber}</TableCell>
                  <TableCell>
                    <Badge className={`${getCategoryColor(callCenter.category)} text-white`}>
                      {callCenter.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={callCenter.isVerified ? "outline" : "secondary"} 
                           className={highContrast && callCenter.isVerified ? "border-green-500 text-green-500" : ""}>
                      {callCenter.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleVerification(callCenter)}
                        title={callCenter.isVerified ? "Mark as unverified" : "Mark as verified"}
                      >
                        {callCenter.isVerified ? <X size={16} /> : <Check size={16} />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(callCenter)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(callCenter)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <CallCenterForm 
        isOpen={isEditOpen} 
        onClose={closeEditDialog} 
        callCenter={selectedCallCenter} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCallCenter?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCallCenter && deleteMutation.mutate(selectedCallCenter.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}