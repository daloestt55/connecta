import { useState } from "react";
import { CheckCircle, XCircle, Shield, User, Clock } from "lucide-react";
import { Button } from "@/app/components/design-system/Button";
import { cn } from "@/lib/utils";

interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  reason: string;
  links: string[];
  submittedAt: Date;
  status: "pending" | "approved" | "rejected";
}

interface AdminPanelProps {
  verificationRequests: VerificationRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onRevoke: (requestId: string) => void;
}

export function AdminPanel({ verificationRequests, onApprove, onReject, onRevoke }: AdminPanelProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filteredRequests = verificationRequests.filter(req => 
    filter === "all" ? true : req.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-400 bg-yellow-400/10";
      case "approved": return "text-green-400 bg-green-400/10";
      case "rejected": return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0C] text-white overflow-hidden">
      {/* Header */}
      <div className="bg-[#111114] border-b border-white/5 px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-gray-400">Verification Requests Management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-[#18181b] rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{verificationRequests.length}</div>
            <div className="text-xs text-gray-400 uppercase">Total Requests</div>
          </div>
          <div className="bg-[#18181b] rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {verificationRequests.filter(r => r.status === "pending").length}
            </div>
            <div className="text-xs text-gray-400 uppercase">Pending</div>
          </div>
          <div className="bg-[#18181b] rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {verificationRequests.filter(r => r.status === "approved").length}
            </div>
            <div className="text-xs text-gray-400 uppercase">Approved</div>
          </div>
          <div className="bg-[#18181b] rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {verificationRequests.filter(r => r.status === "rejected").length}
            </div>
            <div className="text-xs text-gray-400 uppercase">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0e0e11] px-8 py-4 flex gap-2 border-b border-white/5">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              filter === f 
                ? "bg-blue-600 text-white" 
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <Clock className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400">No {filter !== "all" ? filter : ""} requests found</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[#18181b] rounded-lg p-6 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{request.username}</h3>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium capitalize",
                          getStatusColor(request.status)
                        )}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{request.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {request.submittedAt.toLocaleDateString()} at {request.submittedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Reason for Verification</h4>
                  <p className="text-sm text-gray-300">{request.reason}</p>
                </div>

                {request.links.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Social Links</h4>
                    <div className="space-y-1">
                      {request.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 block truncate"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <Button
                      onClick={() => onApprove(request.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => onReject(request.id)}
                      variant="secondary"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {request.status === "approved" && (
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <Button
                      onClick={() => onRevoke(request.id)}
                      variant="secondary"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-none"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Revoke Verification
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
