import { CallCenterList } from "@/components/call-centers/call-center-list";
import { useAccessibility } from "@/lib/accessibilityContext";

export default function CallCenters() {
  const { highContrast } = useAccessibility();
  
  return (
    <div className={`container py-8 ${highContrast ? "high-contrast" : ""}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Safety Call Center List</h1>
        <p className="text-muted-foreground max-w-3xl">
          Manage trusted organizations whose calls are automatically verified and not screened for fraud.
          Add phone numbers for banks, telecom providers, healthcare providers, and other trusted organizations.
        </p>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-4">Coming Soon!</h3>
          <p className="text-muted-foreground mb-6">
            The Trust List feature is currently under development and will be available in the next update.
            This feature will allow you to manage trusted organizations whose calls are automatically verified.
          </p>
          <div className="inline-block bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-lg p-4">
            <p className="text-sm">
              <strong>Beta Version Notice:</strong> Some features are still in development.
              Check back soon for the full functionality.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-muted rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How Call Center Verification Works</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Trusted Organizations</h3>
            <p>
              When a call or message comes from a verified number in this list, it automatically bypasses
              fraud screening and is marked as safe.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Categories</h3>
            <p>
              Categorize organizations to better organize your trusted list and easily identify
              which trusted organizations are contacting you.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Verification Status</h3>
            <p>
              You can temporarily disable verification for any organization by toggling their
              verification status, without removing them from your list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}