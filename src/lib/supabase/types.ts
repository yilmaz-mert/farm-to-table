// Hand-authored from supabase/migrations/0000_initial_schema.sql
// Replace with: npx supabase gen types typescript --local > src/lib/supabase/types.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'admin' | 'customer'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          marketing_copy: string | null
          price_per_kg: number
          total_price: number
          package_weight_kg: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          marketing_copy?: string | null
          price_per_kg: number
          total_price: number
          package_weight_kg: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          marketing_copy?: string | null
          price_per_kg?: number
          total_price?: number
          package_weight_kg?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_harvest_logs: {
        Row: {
          id: string
          harvest_date: string
          total_box_quota: number
          remaining_boxes: number
          daily_photos: string[]
          created_at: string
        }
        Insert: {
          id?: string
          harvest_date?: string
          total_box_quota?: number
          remaining_boxes?: number
          daily_photos?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          harvest_date?: string
          total_box_quota?: number
          remaining_boxes?: number
          daily_photos?: string[]
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          shipping_address: string
          city: string
          total_amount: number
          status:
            | 'pending_payment'
            | 'new_order'
            | 'harvesting'
            | 'packed'
            | 'shipped'
            | 'cancelled'
          is_weekend_blackout: boolean
          scheduled_ship_date: string | null
          tracking_number: string | null
          invoice_url: string | null
          reserved_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          shipping_address: string
          city: string
          total_amount: number
          status?:
            | 'pending_payment'
            | 'new_order'
            | 'harvesting'
            | 'packed'
            | 'shipped'
            | 'cancelled'
          is_weekend_blackout?: boolean
          scheduled_ship_date?: string | null
          tracking_number?: string | null
          invoice_url?: string | null
          reserved_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          shipping_address?: string
          city?: string
          total_amount?: number
          status?:
            | 'pending_payment'
            | 'new_order'
            | 'harvesting'
            | 'packed'
            | 'shipped'
            | 'cancelled'
          is_weekend_blackout?: boolean
          scheduled_ship_date?: string | null
          tracking_number?: string | null
          invoice_url?: string | null
          reserved_until?: string | null
          created_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: number
          urgency_blitz_mode: boolean
          hero_image_url: string | null
          hero_video_url: string | null
          products_bg_url: string | null
          features_bg_url: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          urgency_blitz_mode?: boolean
          hero_image_url?: string | null
          hero_video_url?: string | null
          products_bg_url?: string | null
          features_bg_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          urgency_blitz_mode?: boolean
          hero_image_url?: string | null
          hero_video_url?: string | null
          products_bg_url?: string | null
          features_bg_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_shots: {
        Row: {
          id: string
          slot_index: number
          kind: 'harvest' | 'unboxing'
          image_url: string | null
          title: string
          harvest_time: string
          location_tag: string
          updated_at: string
        }
        Insert: {
          id?: string
          slot_index: number
          kind?: 'harvest' | 'unboxing'
          image_url?: string | null
          title?: string
          harvest_time?: string
          location_tag?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slot_index?: number
          kind?: 'harvest' | 'unboxing'
          image_url?: string | null
          title?: string
          harvest_time?: string
          location_tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
