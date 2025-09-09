import { IStorage } from "./types";
import {
  User, InsertUser,
  Apartment, InsertApartment,
  MaintenanceRequest, InsertMaintenanceRequest,
  Payment, InsertPayment,
  Visitor, InsertVisitor,
  Announcement, InsertAnnouncement,
  users,
  apartments,
  maintenanceRequests,
  payments,
  visitors,
  announcements
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();

    // If tenant, create sample data
    if (user.role === 'tenant') {
      // Create an apartment
      const [apartment] = await db.insert(apartments).values({
        number: "101",
        building: "Block A",
        tenantId: newUser.id,
        rent: 1200,
        area: 1000,
        status: "occupied",
        amenities: ["AC", "Parking"],
        lastMaintenanceDate: new Date(),
        societyName: "Society A"
      }).returning();

      // Create maintenance request
      await db.insert(maintenanceRequests).values({
        apartmentId: apartment.id,
        tenantId: newUser.id,
        description: "AC needs servicing",
        status: "pending"
      });

      // Create payment record
      await db.insert(payments).values({
        apartmentId: apartment.id,
        tenantId: newUser.id,
        amount: 1200,
        date: new Date(),
        type: "rent"
      });

      // Create visitor
      await db.insert(visitors).values({
        name: "John Smith",
        purpose: "Friendly visit",
        status: "upcoming",
        apartmentId: apartment.id,
        expectedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        approvedBy: newUser.id,
        contactNumber: "555-0123",
        actualEntryAt: null,
        actualExitAt: null,
        pendingApproval: false
      });
    } else if (user.role === 'manager') {
      // Create welcome announcement
      await db.insert(announcements).values({
        title: "Welcome to the Community",
        content: "Please join us for the monthly community meeting this weekend.",
        createdBy: newUser.id,
        important: true
      });
    }

    return newUser;
  }

  async getApartment(id: number): Promise<Apartment | undefined> {
    const [apartment] = await db.select().from(apartments).where(eq(apartments.id, id));
    return apartment;
  }

  async createApartment(apartment: InsertApartment): Promise<Apartment> {
    const [newApartment] = await db.insert(apartments).values(apartment).returning();
    return newApartment;
  }

  async getApartmentsByTenant(tenantId: number): Promise<Apartment[]> {
    return await db.select().from(apartments).where(eq(apartments.tenantId, tenantId));
  }

  async getApartments(ownerId?: number): Promise<Apartment[]> {
    if (ownerId) {
      return await db.select().from(apartments).where(eq(apartments.ownerId, ownerId));
    }
    return await db.select().from(apartments);
  }

  async updateApartment(id: number, update: Partial<InsertApartment>): Promise<Apartment | undefined> {
    const [apartment] = await db
      .update(apartments)
      .set(update)
      .where(eq(apartments.id, id))
      .returning();
    return apartment;
  }

  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [newRequest] = await db.insert(maintenanceRequests).values(request).returning();
    return newRequest;
  }

  async getMaintenanceRequests(tenantId?: number): Promise<MaintenanceRequest[]> {
    if (tenantId) {
      return await db.select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.tenantId, tenantId));
    }
    return await db.select().from(maintenanceRequests);
  }

  async updateMaintenanceRequest(id: number, data: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest | null> {
    const updated = await db
      .update(maintenanceRequests)
      .set(data)
      .where(eq(maintenanceRequests.id, id))
      .returning();

    return updated.length > 0 ? updated[0] : null;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsByTenant(tenantId: number): Promise<Payment[]> {
    return await db.select()
      .from(payments)
      .where(eq(payments.tenantId, tenantId));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getPaymentsByOwner(ownerId: number): Promise<Payment[]> {
    const ownerApartments = await this.getApartments(ownerId);
    if (ownerApartments.length === 0) {
      return [];
    }
    const apartmentIds = ownerApartments.map(apt => apt.id);
    return await db.select()
      .from(payments)
      .where(inArray(payments.apartmentId, apartmentIds));
  }

  async createVisitor(visitor: InsertVisitor): Promise<Visitor> {
    const [newVisitor] = await db.insert(visitors).values(visitor).returning();
    return newVisitor;
  }

  async getVisitors(apartmentId?: number): Promise<Visitor[]> {
    let result;
    if (apartmentId) {
      result = await db.select()
        .from(visitors)
        .where(eq(visitors.apartmentId, apartmentId));
    } else {
      result = await db.select().from(visitors);
    }

    // Ensure pendingApproval exists for all records
    return result.map(visitor => ({
      ...visitor,
      pendingApproval: visitor.pendingApproval === true
    }));
  }

  async getVisitor(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db.select()
      .from(visitors)
      .where(eq(visitors.id, id));
    return visitor;
  }

  async logVisitorNotification(visitorId: number, securityId: number): Promise<void> {
    // In a production app, you would store this in a notifications table
    // For this demo, we'll just log it
    console.log(`[${new Date().toISOString()}] Security ID ${securityId} notified about visitor ID ${visitorId}`);
  }

  async updateVisitorStatus(
    id: number,
    status: "upcoming" | "current" | "past",
    entryAt?: Date,
    exitAt?: Date,
    approvedBy?: number,
    pendingApproval?: boolean
  ): Promise<Visitor | undefined> {
    const [visitor] = await db
      .update(visitors)
      .set({
        status,
        actualEntryAt: entryAt || undefined,
        actualExitAt: exitAt || undefined,
        approvedBy: approvedBy || undefined,
        pendingApproval: pendingApproval !== undefined ? pendingApproval : undefined
      })
      .where(eq(visitors.id, id))
      .returning();
    return visitor;
  }

  async updateVisitorApprovalStatus(
    id: number,
    pendingApproval: boolean
  ): Promise<Visitor | undefined> {
    const [visitor] = await db
      .update(visitors)
      .set({ pendingApproval })
      .where(eq(visitors.id, id))
      .returning();
    return visitor;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }
}

export const storage = new DatabaseStorage();