export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      Activity: {
        Row: {
          contactId: string | null;
          createdAt: string;
          dealId: string | null;
          description: string | null;
          id: string;
          occurredAt: string;
          title: string;
          type: Database["public"]["Enums"]["ActivityType"];
          updatedAt: string;
        };
        Insert: {
          contactId?: string | null;
          createdAt?: string;
          dealId?: string | null;
          description?: string | null;
          id?: string;
          occurredAt?: string;
          title: string;
          type?: Database["public"]["Enums"]["ActivityType"];
          updatedAt: string;
        };
        Update: {
          contactId?: string | null;
          createdAt?: string;
          dealId?: string | null;
          description?: string | null;
          id?: string;
          occurredAt?: string;
          title?: string;
          type?: Database["public"]["Enums"]["ActivityType"];
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Activity_contactId_fkey";
            columns: ["contactId"];
            isOneToOne: false;
            referencedRelation: "Contact";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Activity_dealId_fkey";
            columns: ["dealId"];
            isOneToOne: false;
            referencedRelation: "Deal";
            referencedColumns: ["id"];
          },
        ];
      };
      Contact: {
        Row: {
          company: string | null;
          createdAt: string;
          email: string | null;
          firstName: string;
          id: string;
          lastName: string | null;
          notes: string | null;
          phone: string | null;
          position: string | null;
          status: Database["public"]["Enums"]["ContactStatus"];
          type: Database["public"]["Enums"]["ContactType"];
          updatedAt: string;
          website: string | null;
        };
        Insert: {
          company?: string | null;
          createdAt?: string;
          email?: string | null;
          firstName: string;
          id?: string;
          lastName?: string | null;
          notes?: string | null;
          phone?: string | null;
          position?: string | null;
          status?: Database["public"]["Enums"]["ContactStatus"];
          type?: Database["public"]["Enums"]["ContactType"];
          updatedAt: string;
          website?: string | null;
        };
        Update: {
          company?: string | null;
          createdAt?: string;
          email?: string | null;
          firstName?: string;
          id?: string;
          lastName?: string | null;
          notes?: string | null;
          phone?: string | null;
          position?: string | null;
          status?: Database["public"]["Enums"]["ContactStatus"];
          type?: Database["public"]["Enums"]["ContactType"];
          updatedAt?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      Deal: {
        Row: {
          closedAt: string | null;
          contactId: string;
          createdAt: string;
          currency: string;
          id: string;
          notes: string | null;
          probability: number;
          stageId: string | null;
          title: string;
          updatedAt: string;
          value: number;
        };
        Insert: {
          closedAt?: string | null;
          contactId: string;
          createdAt?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          probability?: number;
          stageId?: string | null;
          title: string;
          updatedAt: string;
          value?: number;
        };
        Update: {
          closedAt?: string | null;
          contactId?: string;
          createdAt?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          probability?: number;
          stageId?: string | null;
          title?: string;
          updatedAt?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Deal_contactId_fkey";
            columns: ["contactId"];
            isOneToOne: false;
            referencedRelation: "Contact";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Deal_stageId_fkey";
            columns: ["stageId"];
            isOneToOne: false;
            referencedRelation: "PipelineStage";
            referencedColumns: ["id"];
          },
        ];
      };
      DealItem: {
        Row: {
          dealId: string;
          id: string;
          notes: string | null;
          productId: string | null;
          quantity: number;
          totalPrice: number;
          unitPrice: number;
        };
        Insert: {
          dealId: string;
          id?: string;
          notes?: string | null;
          productId?: string | null;
          quantity?: number;
          totalPrice?: number;
          unitPrice?: number;
        };
        Update: {
          dealId?: string;
          id?: string;
          notes?: string | null;
          productId?: string | null;
          quantity?: number;
          totalPrice?: number;
          unitPrice?: number;
        };
        Relationships: [
          {
            foreignKeyName: "DealItem_dealId_fkey";
            columns: ["dealId"];
            isOneToOne: false;
            referencedRelation: "Deal";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "DealItem_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
      Invoice: {
        Row: {
          contactId: string | null;
          createdAt: string;
          currency: string;
          dealId: string | null;
          dueAt: string | null;
          id: string;
          issuedAt: string;
          notes: string | null;
          number: string;
          paidAt: string | null;
          status: string;
          stripeInvoiceId: string | null;
          subtotal: number;
          taxAmount: number;
          taxRate: number;
          total: number;
          updatedAt: string;
        };
        Insert: {
          contactId?: string | null;
          createdAt?: string;
          currency?: string;
          dealId?: string | null;
          dueAt?: string | null;
          id?: string;
          issuedAt?: string;
          notes?: string | null;
          number: string;
          paidAt?: string | null;
          status?: string;
          stripeInvoiceId?: string | null;
          subtotal?: number;
          taxAmount?: number;
          taxRate?: number;
          total?: number;
          updatedAt: string;
        };
        Update: {
          contactId?: string | null;
          createdAt?: string;
          currency?: string;
          dealId?: string | null;
          dueAt?: string | null;
          id?: string;
          issuedAt?: string;
          notes?: string | null;
          number?: string;
          paidAt?: string | null;
          status?: string;
          stripeInvoiceId?: string | null;
          subtotal?: number;
          taxAmount?: number;
          taxRate?: number;
          total?: number;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Invoice_contactId_fkey";
            columns: ["contactId"];
            isOneToOne: false;
            referencedRelation: "Contact";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Invoice_dealId_fkey";
            columns: ["dealId"];
            isOneToOne: false;
            referencedRelation: "Deal";
            referencedColumns: ["id"];
          },
        ];
      };
      InvoiceItem: {
        Row: {
          description: string;
          id: string;
          invoiceId: string;
          productId: string | null;
          quantity: number;
          totalPrice: number;
          unitPrice: number;
        };
        Insert: {
          description: string;
          id?: string;
          invoiceId: string;
          productId?: string | null;
          quantity?: number;
          totalPrice?: number;
          unitPrice?: number;
        };
        Update: {
          description?: string;
          id?: string;
          invoiceId?: string;
          productId?: string | null;
          quantity?: number;
          totalPrice?: number;
          unitPrice?: number;
        };
        Relationships: [
          {
            foreignKeyName: "InvoiceItem_invoiceId_fkey";
            columns: ["invoiceId"];
            isOneToOne: false;
            referencedRelation: "Invoice";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "InvoiceItem_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
      Lead: {
        Row: {
          createdAt: string;
          email: string;
          id: string;
          message: string;
          name: string;
          source: string;
          type: string | null;
          utmCampaign: string | null;
          utmContent: string | null;
          utmMedium: string | null;
          utmSource: string | null;
          utmTerm: string | null;
        };
        Insert: {
          createdAt?: string;
          email: string;
          id: string;
          message: string;
          name: string;
          source?: string;
          type?: string | null;
          utmCampaign?: string | null;
          utmContent?: string | null;
          utmMedium?: string | null;
          utmSource?: string | null;
          utmTerm?: string | null;
        };
        Update: {
          createdAt?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          source?: string;
          type?: string | null;
          utmCampaign?: string | null;
          utmContent?: string | null;
          utmMedium?: string | null;
          utmSource?: string | null;
          utmTerm?: string | null;
        };
        Relationships: [];
      };
      Order: {
        Row: {
          amount: number;
          createdAt: string;
          currency: string;
          email: string | null;
          id: string;
          item: string;
          status: string;
          stripeSessionId: string;
        };
        Insert: {
          amount: number;
          createdAt?: string;
          currency?: string;
          email?: string | null;
          id: string;
          item: string;
          status?: string;
          stripeSessionId: string;
        };
        Update: {
          amount?: number;
          createdAt?: string;
          currency?: string;
          email?: string | null;
          id?: string;
          item?: string;
          status?: string;
          stripeSessionId?: string;
        };
        Relationships: [];
      };
      outbox_events: {
        Row: {
          aggregate_id: string;
          aggregate_type: string;
          attempts: number;
          available_at: string;
          created_at: string;
          id: string;
          last_error: string | null;
          locked_at: string | null;
          max_attempts: number;
          payload: Json;
          processed_at: string | null;
          status: string;
          type: string;
        };
        Insert: {
          aggregate_id: string;
          aggregate_type: string;
          attempts?: number;
          available_at?: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          max_attempts?: number;
          payload?: Json;
          processed_at?: string | null;
          status?: string;
          type: string;
        };
        Update: {
          aggregate_id?: string;
          aggregate_type?: string;
          attempts?: number;
          available_at?: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          max_attempts?: number;
          payload?: Json;
          processed_at?: string | null;
          status?: string;
          type?: string;
        };
        Relationships: [];
      };
      PipelineStage: {
        Row: {
          color: string | null;
          createdAt: string;
          description: string | null;
          id: string;
          name: string;
          order: number;
          updatedAt: string;
        };
        Insert: {
          color?: string | null;
          createdAt?: string;
          description?: string | null;
          id?: string;
          name: string;
          order?: number;
          updatedAt: string;
        };
        Update: {
          color?: string | null;
          createdAt?: string;
          description?: string | null;
          id?: string;
          name?: string;
          order?: number;
          updatedAt?: string;
        };
        Relationships: [];
      };
      Product: {
        Row: {
          active: boolean;
          createdAt: string;
          currency: string;
          description: string | null;
          id: string;
          name: string;
          unitPrice: number;
          updatedAt: string;
        };
        Insert: {
          active?: boolean;
          createdAt?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name: string;
          unitPrice?: number;
          updatedAt: string;
        };
        Update: {
          active?: boolean;
          createdAt?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name?: string;
          unitPrice?: number;
          updatedAt?: string;
        };
        Relationships: [];
      };
      Subscriber: {
        Row: {
          confirmed: boolean;
          confirmedAt: string | null;
          createdAt: string;
          email: string;
          id: string;
          token: string | null;
          tokenExpiresAt: string | null;
        };
        Insert: {
          confirmed?: boolean;
          confirmedAt?: string | null;
          createdAt?: string;
          email: string;
          id: string;
          token?: string | null;
          tokenExpiresAt?: string | null;
        };
        Update: {
          confirmed?: boolean;
          confirmedAt?: string | null;
          createdAt?: string;
          email?: string;
          id?: string;
          token?: string | null;
          tokenExpiresAt?: string | null;
        };
        Relationships: [];
      };
      Subscription: {
        Row: {
          canceledAt: string | null;
          contactId: string | null;
          createdAt: string;
          currentPeriodEnd: string;
          currentPeriodStart: string;
          id: string;
          metadata: Json | null;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          updatedAt: string;
        };
        Insert: {
          canceledAt?: string | null;
          contactId?: string | null;
          createdAt?: string;
          currentPeriodEnd: string;
          currentPeriodStart: string;
          id?: string;
          metadata?: Json | null;
          status?: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          updatedAt: string;
        };
        Update: {
          canceledAt?: string | null;
          contactId?: string | null;
          createdAt?: string;
          currentPeriodEnd?: string;
          currentPeriodStart?: string;
          id?: string;
          metadata?: Json | null;
          status?: string;
          stripeCustomerId?: string;
          stripeSubscriptionId?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Subscription_contactId_fkey";
            columns: ["contactId"];
            isOneToOne: false;
            referencedRelation: "Contact";
            referencedColumns: ["id"];
          },
        ];
      };
      Task: {
        Row: {
          contactId: string | null;
          createdAt: string;
          dealId: string | null;
          description: string | null;
          doneAt: string | null;
          dueAt: string | null;
          id: string;
          priority: Database["public"]["Enums"]["TaskPriority"];
          title: string;
          updatedAt: string;
        };
        Insert: {
          contactId?: string | null;
          createdAt?: string;
          dealId?: string | null;
          description?: string | null;
          doneAt?: string | null;
          dueAt?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["TaskPriority"];
          title: string;
          updatedAt: string;
        };
        Update: {
          contactId?: string | null;
          createdAt?: string;
          dealId?: string | null;
          description?: string | null;
          doneAt?: string | null;
          dueAt?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["TaskPriority"];
          title?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Task_contactId_fkey";
            columns: ["contactId"];
            isOneToOne: false;
            referencedRelation: "Contact";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Task_dealId_fkey";
            columns: ["dealId"];
            isOneToOne: false;
            referencedRelation: "Deal";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          attempt_count: number;
          created_at: string;
          event_type: string;
          external_event_id: string;
          id: string;
          last_error: string | null;
          payload_hash: string;
          processed_at: string | null;
          provider: string;
          status: string;
        };
        Insert: {
          attempt_count?: number;
          created_at?: string;
          event_type: string;
          external_event_id: string;
          id?: string;
          last_error?: string | null;
          payload_hash: string;
          processed_at?: string | null;
          provider: string;
          status?: string;
        };
        Update: {
          attempt_count?: number;
          created_at?: string;
          event_type?: string;
          external_event_id?: string;
          id?: string;
          last_error?: string | null;
          payload_hash?: string;
          processed_at?: string | null;
          provider?: string;
          status?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      ActivityType: "EMAIL" | "CALL" | "MEETING" | "NOTE" | "TASK" | "OTHER";
      ContactStatus: "LEAD" | "PROSPECT" | "CLIENT" | "PARTNER" | "INACTIVE";
      ContactType: "INDIVIDUAL" | "COMPANY";
      TaskPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ActivityType: ["EMAIL", "CALL", "MEETING", "NOTE", "TASK", "OTHER"],
      ContactStatus: ["LEAD", "PROSPECT", "CLIENT", "PARTNER", "INACTIVE"],
      ContactType: ["INDIVIDUAL", "COMPANY"],
      TaskPriority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    },
  },
} as const;
