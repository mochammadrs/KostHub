export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          full_name: string | null
          role: 'tenant' | 'admin'
          tenant_id: string | null
          created_at: string
          updated_at: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
        }
      }
      bills: {
        Row: {
          id: string
          tenant_id: string
          title: string
          amount: number
          due_date: string
          status: 'pending' | 'paid' | 'overdue'
          proof_url: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
      }
      tickets: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          category: string | null
          status: 'menunggu' | 'diproses' | 'selesai'
          created_at: string
          updated_at: string
        }
      }
      announcements: {
        Row: {
          id: string
          tenant_id: string | null
          title: string
          content: string
          created_at: string
        }
      }
    }
  }
}
