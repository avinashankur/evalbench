'use client'

import * as React from 'react'
import {
  Scale,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Binary,
  Sparkles,
  ShieldAlert,
  Copy,
  Check,
  BookOpen,
  CircleDashed,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useEvaluators } from '@/modules/discovery'

export interface EvaluatorMetadata {
  id: string
  name: string
  category: 'Deterministic' | 'LLM-as-a-Judge' | 'RAG Triad' | 'Safety'
  method: string
  description: string
  detailedRubric: string
  requiredInputs: string[]
  scale: string
  defaultThreshold: string
  formula: string
  rationale: string
}

const EVALUATOR_CATALOG: Record<string, EvaluatorMetadata> = {
  exact_match: {
    id: 'exact_match',
    name: 'Exact Match',
    category: 'Deterministic',
    method: 'Normalized String Equality',
    description: 'Tests whether the candidate model response matches the expected ground truth verbatim after normalization.',
    detailedRubric: 'Strips leading and trailing whitespace, normalizes Unicode spaces, lowercases both strings, and checks strict equivalence. Produces binary 1.0 (exact match) or 0.0 (mismatch).',
    requiredInputs: ['response', 'ground_truth'],
    scale: 'Binary (0.0 or 1.0)',
    defaultThreshold: '1.00',
    formula: '1.0 if normalize(response) == normalize(ground_truth) else 0.0',
    rationale: 'Ideal for strict categorization, numeric calculations, standardized codes, and deterministic JSON schemas.',
  },
  levenshtein: {
    id: 'levenshtein',
    name: 'Levenshtein Similarity',
    category: 'Deterministic',
    method: 'Character Edit Distance Ratio',
    description: 'Measures character-level edit distance ratio between candidate output and ground truth reference.',
    detailedRubric: 'Computes the minimum number of single-character operations (insertions, deletions, substitutions) required to transform candidate text into the ground truth, normalized by length.',
    requiredInputs: ['response', 'ground_truth'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.80',
    formula: '1.0 - (edit_distance(candidate, reference) / max(len_c, len_r))',
    rationale: 'Forgiving metric that rewards close phonetic or typographical answers without requiring verbatim character accuracy.',
  },
  rouge: {
    id: 'rouge',
    name: 'ROUGE-L Overlap',
    category: 'Deterministic',
    method: 'Longest Common Subsequence',
    description: 'Calculates the longest common subsequence (LCS) overlap between the candidate response and ground truth references.',
    detailedRubric: 'Evaluates sentence-level structural similarity using LCS. Rewards model generations that preserve the sequential ordering and phrasing of the ground truth without requiring consecutive n-grams.',
    requiredInputs: ['response', 'ground_truth'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.70',
    formula: '2 * (LCS(ref, cand) / len(ref)) * (LCS(ref, cand) / len(cand)) / (P + R)',
    rationale: 'Standard benchmark standard for multi-sentence summarization and freeform factual extraction tasks.',
  },
  faithfulness: {
    id: 'faithfulness',
    name: 'Faithfulness (Grounding)',
    category: 'RAG Triad',
    method: 'LLM Claim Verification',
    description: 'Verifies with an LLM judge that every factual assertion in the response is strictly grounded in retrieved context.',
    detailedRubric: 'Decomposes the candidate output into discrete atomic claims. For each claim, verifies whether it is logically entailed by the retrieved context chunks. Heavily penalizes ungrounded hallucinations.',
    requiredInputs: ['response', 'context'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.75',
    formula: 'count(grounded_claims) / total_extracted_claims',
    rationale: 'Critical core metric of the RAG Triad to guarantee zero external hallucinations in knowledge-base QA.',
  },
  answer_relevancy: {
    id: 'answer_relevancy',
    name: 'Answer Relevancy',
    category: 'LLM-as-a-Judge',
    method: 'LLM Prompt Evaluation',
    description: 'Scores how directly and completely the model response answers the user prompt without tangential filler.',
    detailedRubric: 'Synthesizes reverse questions from the generated answer and calculates semantic similarity against the user prompt. Penalizes verbose tangents, evasive replies, or off-topic hallucinations.',
    requiredInputs: ['query', 'response'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.70',
    formula: 'mean(cosine_similarity(generated_queries, original_query))',
    rationale: 'Ensures the model stays focused on answering the user question concisely rather than generating fluff.',
  },
  context_recall: {
    id: 'context_recall',
    name: 'Context Recall',
    category: 'RAG Triad',
    method: 'Ground Truth Attribution',
    description: 'Estimates what fraction of ground truth reference information was successfully retrieved in the context.',
    detailedRubric: 'Evaluates each sentence in the ground truth against the retrieved context snippets to determine if the reference answer could have been fully composed from retrieved chunks alone.',
    requiredInputs: ['ground_truth', 'context'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.75',
    formula: 'count(reference_sentences_in_context) / total_reference_sentences',
    rationale: 'Diagnoses retriever chunking or semantic search failure where key evidence was missing from the prompt.',
  },
  context_precision: {
    id: 'context_precision',
    name: 'Context Precision',
    category: 'RAG Triad',
    method: 'Ranked Retrieval Precision',
    description: 'Evaluates ranking quality of retrieved passages, rewarding contexts where the most relevant chunks are at the top.',
    detailedRubric: 'Calculates Average Precision at k (AP@k). Passages that contain ground truth answers must rank above noise or peripheral context chunks to avoid dilution of attention in long prompts.',
    requiredInputs: ['query', 'context', 'ground_truth'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.70',
    formula: 'sum(precision@k * relevance@k) / count(relevant_chunks)',
    rationale: 'Guarantees the retriever prioritizes high-value chunks at position 1 and 2 to minimize attention needle-in-haystack degradation.',
  },
  hallucination: {
    id: 'hallucination',
    name: 'Hallucination Detector',
    category: 'Safety',
    method: 'NLI Contradiction Audit',
    description: 'Identifies factual contradictions, fabricated entity names, or unsupported claims against world knowledge.',
    detailedRubric: 'Applies Natural Language Inference (NLI) classification to flag direct factual contradictions, synthetic URLs, fake author citations, or fabricated numerical stats.',
    requiredInputs: ['query', 'response', 'context'],
    scale: '0.00 – 1.00',
    defaultThreshold: '0.85',
    formula: '1.0 - (hallucination_penalty_score)',
    rationale: 'Safety guardrail ensuring model output remains trustworthy and safe for customer-facing deployment.',
  },
}

const CATEGORIES = ['All', 'Deterministic', 'LLM-as-a-Judge', 'RAG Triad', 'Safety'] as const

export function EvaluatorsCatalogPanel() {
  const { data, isLoading, refetch, isRefetching } = useEvaluators()
  const discoveredEvaluators = data?.evaluators ?? []

  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All')
  const [inspectedEvaluator, setInspectedEvaluator] = React.useState<EvaluatorMetadata | null>(null)
  const [copiedSnippet, setCopiedSnippet] = React.useState<string | null>(null)

  // Merge discovered backend keys with catalog definitions
  const allEvaluatorKeys = React.useMemo(() => {
    return Array.from(new Set([...discoveredEvaluators, ...Object.keys(EVALUATOR_CATALOG)]))
  }, [discoveredEvaluators])

  // Filter keys by search and category
  const filteredKeys = React.useMemo(() => {
    return allEvaluatorKeys.filter((key) => {
      const meta = EVALUATOR_CATALOG[key]
      if (selectedCategory !== 'All' && meta?.category !== selectedCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const nameMatch = (meta?.name || key).toLowerCase().includes(q)
        const idMatch = key.toLowerCase().includes(q)
        const descMatch = (meta?.description || '').toLowerCase().includes(q)
        const methodMatch = (meta?.method || '').toLowerCase().includes(q)
        if (!nameMatch && !idMatch && !descMatch && !methodMatch) return false
      }
      return true
    })
  }, [allEvaluatorKeys, selectedCategory, searchQuery])

  // Category item counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: allEvaluatorKeys.length }
    CATEGORIES.forEach((cat) => {
      if (cat === 'All') return
      counts[cat] = allEvaluatorKeys.filter((k) => EVALUATOR_CATALOG[k]?.category === cat).length
    })
    return counts
  }, [allEvaluatorKeys])

  function handleCopySnippet(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(label)
    toast.success(`Copied ${label} to clipboard`)
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

  function getCategoryBadge(category: string) {
    switch (category) {
      case 'LLM-as-a-Judge':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'RAG Triad':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'Safety':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border/60'
    }
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'LLM-as-a-Judge':
        return <Scale className="size-3.5 text-purple-500 shrink-0" />
      case 'RAG Triad':
        return <Sparkles className="size-3.5 text-blue-500 shrink-0" />
      case 'Safety':
        return <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
      default:
        return <Binary className="size-3.5 text-muted-foreground shrink-0" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Evaluator Rubrics
            </h3>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {discoveredEvaluators.length} active in backend
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono font-normal hidden sm:inline-flex">
              {allEvaluatorKeys.length} catalogued
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Scoring algorithms and LLM-as-a-Judge rubrics available for benchmark runs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs gap-1.5 border-border/70 hover:bg-muted cursor-pointer shrink-0"
        >
          <RefreshCw className={isRefetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
          <span>Discover Evaluators</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search rubrics by name, key, method, or criteria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 size-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] ?? 0
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border flex items-center gap-1.5',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                )}
              >
                <span>{cat}</span>
                <span className={cn('text-[10px] opacity-70', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* High-Density Rubric Registry Table */}
      <Card className="border-border/60 shadow-xs overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border/60 text-xs hover:bg-transparent">
                <TableHead className="w-64 font-medium">Evaluator Metric</TableHead>
                <TableHead className="w-36 font-medium">Category</TableHead>
                <TableHead className="w-48 font-medium">Engine & Method</TableHead>
                <TableHead className="w-40 font-medium">Scale & Threshold</TableHead>
                <TableHead className="w-32 font-medium">Backend Status</TableHead>
                <TableHead className="w-24 text-right font-medium">Details</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/40 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-44 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <Filter className="size-5 mx-auto opacity-40 mb-1.5" />
                    <p>No evaluator rubrics found matching this filter.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeys.map((key) => {
                  const meta = EVALUATOR_CATALOG[key] || {
                    id: key,
                    name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    category: 'Deterministic',
                    method: 'Custom Backend Metric',
                    description: 'Custom evaluation metric algorithm registered in backend.',
                    detailedRubric: 'Custom metric algorithm provided by the Python benchmark runtime.',
                    requiredInputs: ['response', 'ground_truth'],
                    scale: '0.00 – 1.00',
                    defaultThreshold: '0.70',
                    formula: 'custom_score_fn(response, ground_truth)',
                    rationale: 'Dynamically discovered metric from backend evaluator registry.',
                  }

                  const isDiscovered = discoveredEvaluators.includes(key)

                  return (
                    <TableRow
                      key={key}
                      onClick={() => setInspectedEvaluator(meta)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Evaluator Name & Key */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-muted border border-border/60 flex items-center justify-center shrink-0">
                            {getCategoryIcon(meta.category)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground text-xs block truncate group-hover:text-primary transition-colors">
                              {meta.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              id: {key}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category Badge */}
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] font-mono px-2 py-0.5 border', getCategoryBadge(meta.category))}
                        >
                          {meta.category}
                        </Badge>
                      </TableCell>

                      {/* Engine & Method */}
                      <TableCell className="py-3">
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-foreground text-xs font-medium block truncate">
                            {meta.method}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block truncate">
                            needs: {meta.requiredInputs.join(', ')}
                          </span>
                        </div>
                      </TableCell>

                      {/* Scale & Threshold */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 font-mono text-[11px] font-bold text-foreground">
                            ≥ {meta.defaultThreshold}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {meta.scale}
                          </span>
                        </div>
                      </TableCell>

                      {/* Backend Status */}
                      <TableCell className="py-3">
                        {isDiscovered ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="size-2.5" />
                            <span>Ready</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-2 py-0.5 text-muted-foreground border-border/60 inline-flex items-center gap-1"
                          >
                            <CircleDashed className="size-2.5 opacity-60" />
                            <span>Configurable</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setInspectedEvaluator(meta)
                          }}
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 border border-transparent hover:border-border/60 hover:bg-muted cursor-pointer"
                        >
                          <Eye className="size-3" />
                          <span>Inspect</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Clean Linear/Vercel-Style Rubric Inspector Sheet */}
      <Sheet
        open={Boolean(inspectedEvaluator)}
        onOpenChange={(open) => !open && setInspectedEvaluator(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 flex flex-col justify-between overflow-hidden bg-card border-l border-border shadow-2xl"
        >
          {inspectedEvaluator && (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Clean Sheet Header */}
              <SheetHeader className="p-6 pb-4 border-b border-border/70 bg-card space-y-1.5 text-left">
                <div className="flex items-center justify-between pr-6">
                  <SheetTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                    {getCategoryIcon(inspectedEvaluator.category)}
                    <span>{inspectedEvaluator.name}</span>
                  </SheetTitle>

                  <Badge
                    variant="secondary"
                    className={cn('text-[10px] font-mono px-2 py-0.5 border', getCategoryBadge(inspectedEvaluator.category))}
                  >
                    {inspectedEvaluator.category}
                  </Badge>
                </div>

                <SheetDescription className="text-xs text-muted-foreground font-mono flex items-center gap-2 pt-0.5">
                  <span>evaluator_name: {inspectedEvaluator.id}</span>
                  <span>•</span>
                  <span>Method: {inspectedEvaluator.method}</span>
                </SheetDescription>
              </SheetHeader>

              {/* Sheet Inner Content Tiles */}
              <div className="p-6 space-y-4">
                {/* Tile 1: Overview */}
                <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <BookOpen className="size-3.5 text-muted-foreground" />
                    <span>Evaluation Description</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {inspectedEvaluator.description}
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed pt-1">
                    {inspectedEvaluator.rationale}
                  </p>
                </div>

                {/* Tile 2: Scoring Rubric & Logic */}
                <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Scoring Rubric & Grading Rules
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {inspectedEvaluator.detailedRubric}
                  </p>
                </div>

                {/* Tile 3: Dataset Input Requirements */}
                <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Required Dataset Parameters
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedEvaluator.requiredInputs.map((input) => (
                      <Badge
                        key={input}
                        variant="secondary"
                        className="text-[11px] font-mono px-2 py-0.5 bg-card border-border/60 text-foreground"
                      >
                        {input}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Test cases must provide these fields in the dataset payload to calculate valid scores.
                  </p>
                </div>

                {/* Tile 4: Scale, Formula & Threshold */}
                <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Evaluation Scale</span>
                    <span className="font-mono text-muted-foreground">{inspectedEvaluator.scale}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                    <span className="font-semibold text-foreground">Default Pass Threshold</span>
                    <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded bg-muted border border-border/60">
                      ≥ {inspectedEvaluator.defaultThreshold}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">Scoring Formula</span>
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(inspectedEvaluator.formula, 'Formula')}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSnippet === 'Formula' ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{copiedSnippet === 'Formula' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-card border border-border/60 font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                      {inspectedEvaluator.formula}
                    </pre>
                  </div>
                </div>

                {/* Tile 5: Configuration Payload Example */}
                <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Run Dispatch JSON Config</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopySnippet(
                          JSON.stringify(
                            {
                              evaluators: [inspectedEvaluator.id],
                              threshold: parseFloat(inspectedEvaluator.defaultThreshold) || 0.7,
                            },
                            null,
                            2
                          ),
                          'JSON'
                        )
                      }
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippet === 'JSON' ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{copiedSnippet === 'JSON' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-card border border-border/60 font-mono text-[11px] text-muted-foreground overflow-x-auto">
                    {JSON.stringify(
                      {
                        evaluators: [inspectedEvaluator.id],
                        threshold: parseFloat(inspectedEvaluator.defaultThreshold) || 0.7,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
