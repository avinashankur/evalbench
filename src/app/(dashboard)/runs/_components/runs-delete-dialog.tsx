'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RunSummary } from '@/modules/runs'

interface RunsDeleteDialogProps {
  run: RunSummary | null
  isOpen: boolean
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RunsDeleteDialog({
  run,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: RunsDeleteDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Evaluation Run</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this evaluation run? This action permanently removes the run and all its scored test cases from the database.
          </DialogDescription>
        </DialogHeader>

        {run && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Run ID:</span>
              <span className="font-mono font-medium text-foreground">
                #{run.run_id.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Benchmark:</span>
              <span className="font-medium text-foreground">{run.dataset_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="font-mono font-medium text-foreground">
                {run.provider}/{run.model}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Test Cases:</span>
              <span className="font-mono text-foreground">
                {run.total_test_cases} cases
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs"
          >
            {isDeleting ? 'Deleting…' : 'Delete Run'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
