import { Store } from "express-session";
import {
  User, InsertUser,
  Apartment, InsertApartment,
  MaintenanceRequest, InsertMaintenanceRequest,
  Payment, InsertPayment,
  Visitor, InsertVisitor,
  Announcement, InsertAnnouncement
} from "@shared/schema";

export interface IStorage {
  sessionStore: Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Apartment operations
  getApartment(id: number): Promise<Apartment | undefined>;
  createApartment(apartment: InsertApartment): Promise<Apartment>;
  getApartmentsByTenant(tenantId: number): Promise<Apartment[]>;
  getApartments(ownerId?: number): Promise<Apartment[]>;
  updateApartment(id: number, update: Partial<InsertApartment>): Promise<Apartment | undefined>;
  
  // Maintenance request operations
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  getMaintenanceRequests(tenantId?: number): Promise<MaintenanceRequest[]>;
  updateMaintenanceRequest(id: number, data: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest | null>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByTenant(tenantId: number): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  getPaymentsByOwner(ownerId: number): Promise<Payment[]>;
  
  // Visitor operations
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitors(apartmentId?: number): Promise<Visitor[]>;
  getVisitor(id: number): Promise<Visitor | undefined>;
  updateVisitorStatus(
    id: number,
    status: "upcoming" | "current" | "past",
    entryAt?: Date,
    exitAt?: Date,
    approvedBy?: number,
    pendingApproval?: boolean
  ): Promise<Visitor | undefined>;
  updateVisitorApprovalStatus(id: number, pendingApproval: boolean): Promise<Visitor | undefined>;
  logVisitorNotification(visitorId: number, securityId: number): Promise<void>;
  
  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncements(): Promise<Announcement[]>;
}
