import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const contentItems = sqliteTable(
  "content_items",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    body: text("body").notNull().default(""),
    coverKey: text("cover_key"),
    fileKey: text("file_key"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size").notNull().default(0),
    galleryKeys: text("gallery_keys").notNull().default("[]"),
    contentBlocks: text("content_blocks").notNull().default("[]"),
    publishedAt: text("published_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_content_items_slug").on(table.slug),
    index("idx_content_items_type_created").on(table.type, table.createdAt),
  ],
);

export const siteStats = sqliteTable("site_stats", {
  id: integer("id").primaryKey(),
  likes: integer("likes").notNull().default(0),
  visits: integer("visits").notNull().default(0),
});

export const sitePresence = sqliteTable(
  "site_presence",
  {
    visitorId: text("visitor_id").primaryKey(),
    lastSeen: integer("last_seen").notNull(),
  },
  (table) => [index("idx_site_presence_last_seen").on(table.lastSeen)],
);
