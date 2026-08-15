export interface ApolloOrganization {
  id: string
  name: string
  website_url: string | null
  blog_url?: string | null
  linkedin_url?: string | null
  industry: string | null
  estimated_num_employees: number | null
  city: string | null
  country: string | null
  short_description?: string | null
  keywords?: string[]
  technology_names?: string[]
}

export interface IcpProfile {
  description: string
  industries: string[]
  size_range: string
  signals: string[]
  anti_signals: string[]
}

export function buildSystemPrompt(icp: IcpProfile | null): string {
  if (!icp) {
    return `You are a B2B sales intelligence analyst.
You receive structured data about a company and return a precise JSON enrichment object.

Score based on general B2B fit: company size, activity signals, 
and growth indicators.

ICP fit thresholds:
- "high"   -> score 70-100
- "medium" -> score 40-69
- "low"    -> score 0-39

Rules:
- outreach_angle: ONE specific, non-generic sentence referencing 
  concrete company data.
- ai_summary: 2-3 sentences. Data-driven, no fluff.
- Return ONLY valid JSON - no markdown fences, no extra keys.`
  }

  return `You are a B2B sales intelligence analyst.
You receive structured data about a company and score it against 
a specific ICP profile.

ICP PROFILE:
${icp.description}

Target industries: ${icp.industries.join(', ')}
Target size: ${icp.size_range}

Positive signals - increase score:
${icp.signals.map((s: string) => `+ ${s}`).join('\n')}

Anti-signals - decrease score:
${icp.anti_signals.map((s: string) => `- ${s}`).join('\n')}

Scoring rubric (lead_score 0-100):
- 25 pts: Company operates in one of the target industries
- 25 pts: Company size falls within the target size range
- 25 pts: Company shows 2 or more positive signals from the list above
- 25 pts: Company has no anti-signals and shows active growth motion
- Deduct 20 pts for each anti-signal present

Signal confidence check (apply before finalizing the score):
- Only count a positive signal toward the score if you are confident
  it applies to the company itself. If your own reasoning expresses
  doubt about who a signal actually applies to (for example, a
  staffing/recruiting company's "hiring pain" signal may really
  describe their placed candidates or clients, not the company's own
  internal hiring), do NOT count that signal toward the 25-pt signal
  bucket and do NOT let it justify "high" fit — treat it as a concern
  instead and score as if that signal were absent.
- A score and its reasoning must never contradict each other: if any
  sentence in ai_summary, signals, or outreach_angle hedges or casts
  doubt on whether a signal genuinely applies, the lead_score and
  icp_fit must reflect that doubt (drop by at least one fit tier),
  not ignore it.

ICP fit thresholds:
- "high"   -> score 70-100
- "medium" -> score 40-69
- "low"    -> score 0-39

Rules:
- outreach_angle: ONE specific sentence referencing the ICP match
  and something concrete from the company data. Mention the ICP
  fit reason explicitly.
- ai_summary: 2-3 sentences explaining ICP alignment or
  misalignment with specific evidence from the company data.
- Return ONLY valid JSON - no markdown fences, no extra keys.`
}

export function buildUserPrompt(org: ApolloOrganization): string {
  return `Enrich this company:

Name: ${org.name}
Industry: ${org.industry ?? 'Unknown'}
Employees: ${org.estimated_num_employees ?? 'Unknown'}
Location: ${[org.city, org.country].filter(Boolean).join(', ') || 'Unknown'}
Website: ${org.website_url ?? 'N/A'}
Description: ${org.short_description ?? 'N/A'}
Keywords: ${(org.keywords ?? []).join(', ') || 'none'}
Tech stack: ${(org.technology_names ?? []).join(', ') || 'none'}

Return ONLY valid JSON with exactly these keys:
{
"lead_score": <0-100 integer>,
"icp_fit": <"high"|"medium"|"low">,
"ai_summary": <1-2 sentences max, plain overview of the company>,
"signals": [
"specific reason this company fits the ICP",
"another specific signal - reference actual company data",
"third signal if applicable"
],
"concerns": [
"specific reason this company might not fit or risks to consider",
"second concern if applicable"
],
"outreach_angle": <one specific actionable sentence>
}
Rules for signals and concerns:

signals: 2-4 items, each starting with a concrete fact from the data
concerns: 1-3 items, only real gaps or risks - omit if none exist
Never repeat the same point in both signals and concerns
Never use generic phrases like "strong brand" - reference specifics
concerns array can be empty [] if there are no real concerns`
}
