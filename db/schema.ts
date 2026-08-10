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
    publishedAt: text("published_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_content_items_slug").on(table.slug),
    index("idx_content_items_type_created").on(table.type, table.createdAt),
  ],
);
