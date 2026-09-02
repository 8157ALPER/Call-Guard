import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertTriangle, Phone, Check } from "lucide-react";
import { useState } from "react";

export function CallHistory() {
  const { data: calls, isLoading } = useQuery({
    queryKey: ["/api/calls"],
  });

  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (id: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  if (isLoading) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        Loading call history...
      </div>
    );
  }

  if (!calls?.length) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        No calls recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls?.map((call) => (
        <Collapsible
          key={call.id}
          open={openItems.has(call.id)}
          onOpenChange={() => toggleItem(call.id)}
        >
          <Card className={call.isSuspicious ? "border-red-200 bg-red-50" : ""}>
            <CardHeader className="py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {call.isSuspicious ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <Phone className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                  <div>
                    <CardTitle className="text-base sm:text-lg break-all">
                      {call.phoneNumber}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {format(new Date(call.timestamp), "PPp")}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {call.analysis?.mood && (
                    <div 
                      className="flex items-center gap-2 flex-1 sm:flex-none" 
                      title={call.analysis.mood.description}
                    >
                      <span className="text-2xl">{call.analysis.mood.emoji}</span>
                      <div className="h-2 w-16 sm:w-24 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-yellow-500"
                          style={{ width: `${call.analysis.mood.stressLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Badge 
                    variant={call.isSuspicious ? "destructive" : "secondary"}
                    className="whitespace-nowrap"
                  >
                    {call.isSuspicious ? "Suspicious" : "Safe"}
                  </Badge>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {openItems.has(call.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="pb-3 space-y-6">
                {call.analysis && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Emotional State</div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <span className="text-3xl">{call.analysis.mood.emoji}</span>
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                              {call.analysis.mood.description}
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap">
                              Stress Level: {Math.round(call.analysis.mood.stressLevel * 100)}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-yellow-500"
                              style={{ width: `${call.analysis.mood.stressLevel * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Risk Assessment</div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-red-500"
                            style={{ width: `${call.analysis.risk * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {Math.round(call.analysis.risk * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Analysis Summary</div>
                      <p className="text-sm text-muted-foreground">
                        {call.analysis.summary}
                      </p>
                    </div>

                    {call.analysis.keywords.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Keywords Detected</div>
                        <div className="flex flex-wrap gap-2">
                          {call.analysis.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}