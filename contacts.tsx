import { useState } from "react";
import { ContactList } from "@/components/contacts/contact-list";
import { ContactForm } from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";

export default function Contacts() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border">
        <div className="flex justify-center">
          <Users className="h-16 w-16 text-primary drop-shadow-sm" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-wide">
          Your Contacts
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Manage your trusted contacts and emergency contacts for better protection
        </p>
      </div>

      {/* Add Contact Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={() => setOpen(true)}
          className="text-xl py-6 px-8 rounded-xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
        >
          <Plus className="h-6 w-6 mr-3" />
          Add New Contact
        </Button>
      </div>

      {/* Contact List */}
      <div className="bg-white rounded-2xl border-2 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
            📋 Contact Directory
          </h2>
          <p className="text-gray-600 mt-2">
            Your saved contacts for emergency alerts and trusted communication
          </p>
        </div>
        <div className="p-6">
          <ContactList />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-center">
              Add New Contact
            </DialogTitle>
          </DialogHeader>
          <ContactForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
