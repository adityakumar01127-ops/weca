"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { CreatePostModal } from "@/components/upload/CreatePostModal";

export default function UploadPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ProtectedRoute>
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        {/* Background placeholder or loader while modal is open */}
        <div className="text-center space-y-3 opacity-60">
          <div className="w-10 h-10 border-2 border-cyan/40 border-t-cyan rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Launching Anomaly Studio...</p>
        </div>

        <CreatePostModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            router.push("/");
          }}
          onPostCreated={() => {
            router.push("/");
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
