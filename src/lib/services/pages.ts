import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { decodeEntities } from "@/lib/api/parsers";
import type { PageBlock, PageContent, PageListItem } from "@/types/page";

export interface RawPage {
  id: number;
  slug: string;
  title?: string;
  template?: string | null;
  is_blocks?: boolean;
  content?: string;
  excerpt?: string;
  blocks?: PageBlock[];
  form_ids?: number[];
  modified?: string | null;
}

export function normalizePage(raw: RawPage): PageContent {
  return {
    id: raw.id,
    slug: raw.slug,
    title: decodeEntities(raw.title ?? ""),
    template: raw.template ?? null,
    isBlocks: Boolean(raw.is_blocks),
    content: raw.content ?? "",
    excerpt: decodeEntities(raw.excerpt ?? ""),
    blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
    formIds: Array.isArray(raw.form_ids) ? raw.form_ids : [],
    modified: raw.modified ?? null,
  };
}

export const pagesService = {
  async getPage(slug: string): Promise<PageContent> {
    const { data } = await api.get<RawPage>(endpoints.pages.detail(slug));
    return normalizePage(data);
  },

  async listPages(template?: string): Promise<PageListItem[]> {
    const path = template ? endpoints.pages.byTemplate(template) : endpoints.pages.list;
    const res = await api.get<{ items?: PageListItem[] }>(path);
    return res.data?.items ?? [];
  },
};
