import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Page {
  id: string;
  title: string;
  icon: string | null;
  cover_image: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  page_id: string;
  type: 'heading1' | 'heading2' | 'heading3' | 'text' | 'bulletlist' | 'numberlist' | 'checklist' | 'quote';
  content: string;
  position: number;
  properties: any;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://habicmthobanrwwjfrin.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYmljbXRob2JhbnJ3d2pmcmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTkxMTAsImV4cCI6MjA3NTczNTExMH0.sgCyYK4suv-5D2cafa19azTz7cVEcvpyvgu24nCwCUU';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getPages(): Promise<Page[]> {
    const { data, error } = await this.supabase
      .from('pages')
      .select('*')
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getPage(id: string): Promise<Page | null> {
    const { data, error } = await this.supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createPage(page: Partial<Page>): Promise<Page> {
    const { data, error } = await this.supabase
      .from('pages')
      .insert(page)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePage(id: string, updates: Partial<Page>): Promise<Page> {
    const { data, error } = await this.supabase
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePage(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('pages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getBlocks(pageId: string): Promise<Block[]> {
    const { data, error } = await this.supabase
      .from('blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createBlock(block: Partial<Block>): Promise<Block> {
    const { data, error } = await this.supabase
      .from('blocks')
      .insert(block)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBlock(id: string, updates: Partial<Block>): Promise<Block> {
    const { data, error } = await this.supabase
      .from('blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBlock(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async reorderBlocks(blocks: { id: string; position: number }[]): Promise<void> {
    const updates = blocks.map(block =>
      this.supabase
        .from('blocks')
        .update({ position: block.position })
        .eq('id', block.id)
    );

    await Promise.all(updates);
  }
}
