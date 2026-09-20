export type Resource = {
  id: string
  name: string
  category: string
  region: string
  phone: string | null
  text: string | null
  website: string
  audience: string[]
  issues: string[]
  hours: string
  free: boolean
  description: string
  tags: string[]
}
