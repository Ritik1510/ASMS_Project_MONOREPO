import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { email, z } from "zod";

// seperate timestamps block
export const timestamps = {
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["tenant", "manager", "owner", "visitor", "security"] }).notNull(),
  fullName: text("fullName").notNull(),
  email: text("email").notNull().unique(),

  // new columns for timestamps 
  CratedAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("created_at").notNull().defaultNow()
});

export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  building: text("building").notNull(),
  tenantId: integer("tenant_id").references(() => users.id),
  ownerId: integer("owner_id").references(() => users.id),
  rent: integer("rent").notNull(),
  status: text("status", { enum: ["vacant", "occupied"] }).notNull().default("vacant"),
  area: integer("area").notNull(), // in square feet
  amenities: text("amenities").array(), // list of available amenities
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  societyName: text("society_name").notNull(), // name of the society
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  tenantId: integer("tenant_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed", "denied"] }).notNull(),
  ...timestamps, 
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  tenantId: integer("tenant_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull(),
  type: text("type", { enum: ["rent", "maintenance"] }).notNull(),
});

export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  status: text("status", { enum: ["upcoming", "current", "past", "pending"] }).notNull(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  expectedAt: timestamp("expected_at").notNull(),
  actualEntryAt: timestamp("actual_entry_at"),
  actualExitAt: timestamp("actual_exit_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  contactNumber: text("contact_number").notNull(),
  pendingApproval: boolean("pending_approval").default(false),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  important: boolean("important").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertApartmentSchema = createInsertSchema(apartments).omit({ id: true });
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertVisitorSchema = createInsertSchema(visitors).omit({ id: true, actualEntryAt: true, actualExitAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Apartment = typeof apartments.$inferSelect;
export type InsertApartment = z.infer<typeof insertApartmentSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;