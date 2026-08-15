export interface ApolloOrganization {
  id: string
  name: string
  website_url: string | null
  blog_url: string | null
  linkedin_url: string | null
  industry: string | null
  estimated_num_employees: number | null
  city: string | null
  country: string | null
  short_description: string | null
  keywords: string[]
  technology_names: string[]
}

export interface ApolloSearchResponse {
  organizations: ApolloOrganization[]
  pagination: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}
