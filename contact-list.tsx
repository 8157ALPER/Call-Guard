import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export function ContactList() {
  const { toast } = useToast();
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been removed successfully.",
      });
    },
  });

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts?.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell>{contact.phoneNumber}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {contact.isEmergency && (
                  <Badge variant="destructive">Emergency</Badge>
                )}
                {contact.isTrusted && (
                  <Badge variant="secondary">Trusted</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteMutation.mutate(contact.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
