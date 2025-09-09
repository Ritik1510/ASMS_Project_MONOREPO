import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMaintenanceRequestSchema, insertPaymentSchema, insertVisitorSchema, insertAnnouncementSchema, insertApartmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Middleware to check if user is admin/manager/security
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !["manager", "owner", "security"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Maintenance Requests
  app.post("/api/maintenance", requireAuth, async (req, res) => {
    const result = insertMaintenanceRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const request = await storage.createMaintenanceRequest({
      ...result.data,
      status: "pending",
    });
    res.status(201).json(request);
  });

  app.get("/api/maintenance", requireAuth, async (req, res) => {
    const user = req.user!;
    const requests = await storage.getMaintenanceRequests(
      user.role === "tenant" ? user.id : undefined
    );
    res.json(requests);
  });
  
  // Endpoint to update maintenance request status
  app.patch("/api/maintenance/:id", requireAuth, async (req, res) => {
    const user = req.user!;
    const requestId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Validate status
    if (!["pending", "in_progress", "completed", "denied"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Only managers can approve, deny or complete maintenance requests
    if ((status === "in_progress" || status === "completed" || status === "denied") && user.role !== "manager") {
      return res.status(403).json({ message: "Only managers can update maintenance request status" });
    }
    
    try {
      const updatedRequest = await storage.updateMaintenanceRequest(requestId, { status });
      if (!updatedRequest) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating maintenance request:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Payments
  app.post("/api/payments", requireAuth, async (req, res) => {
    const result = insertPaymentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid payment data" });
    }

    const payment = await storage.createPayment(result.data);
    res.status(201).json(payment);
  });

  // UPI Payments endpoint
  app.post("/api/payments/upi", requireAuth, async (req, res) => {
    try {
      const { upiId, amount, description, apartmentId } = req.body;
      
      // Validate required fields
      if (!upiId || !amount) {
        return res.status(400).json({ message: "UPI ID and amount are required" });
      }
      
      // In a real application, you would integrate with a UPI payment gateway here
      // and process the payment with proper validation and verification
      
      // For demo purposes, we'll just create a payment record
      const paymentData = {
        apartmentId: apartmentId || (req.body.apartmentId ? Number(req.body.apartmentId) : null),
        tenantId: req.user!.id,
        amount: Number(amount),
        date: new Date(),
        type: req.body.type || "rent",
        // In a real app, you'd store payment method details
        // paymentMethod: "UPI",
        // transactionId: upiTransactionId,
      };
      
      const payment = await storage.createPayment(paymentData);
      res.status(201).json({ success: true, payment });
    } catch (error) {
      console.error("UPI payment error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  app.get("/api/payments", requireAuth, async (req, res) => {
    const user = req.user!;
    
    // If user is manager or owner, return all payments
    if (user.role === 'manager') {
      const payments = await storage.getAllPayments();
      return res.json(payments);
    } else if (user.role === 'owner') {
      const payments = await storage.getPaymentsByOwner(user.id);
      return res.json(payments);
    } else if (user.role === 'security') {
      // Security can see all payments but probably doesn't need to
      const payments = await storage.getAllPayments();
      return res.json(payments);
    }
    

    /*
    // If user is manager or owner, return all payments
    if (user.role === 'manager') {
      const payments = await storage.getAllPayments();
      return res.json(payments);
    } else if (user.role === 'owner') {
      const payments = await storage.getPaymentsByOwner(user.id);
      return res.json(payments);
    } else if (user.role === 'security') {
      // Security can see all payments but probably doesn't need to
      const payments = await storage.getAllPayments();
      return res.json(payments);
    }
    
    */
    
    // For tenants, return only their payments
    const payments = await storage.getPaymentsByTenant(user.id);
    res.json(payments);
  });

  // Apartments
  app.get("/api/apartments", requireAuth, async (req, res) => {
    const user = req.user!;
    const apartments = await storage.getApartmentsByTenant(user.id);
    res.json(apartments);
  });

  // Get all apartments (for managers) or owned apartments (for owners)
  app.get("/api/apartments/all", requireAdmin, async (req, res) => {
    const user = req.user!;
    const apartments = await storage.getApartments(
      user.role === "owner" ? user.id : undefined
    );
    res.json(apartments);
  });

  // Create new apartment (managers and owners only)
  app.post("/api/apartments", requireAdmin, async (req, res) => {
    const result = insertApartmentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid apartment data" });
    }

    const apartment = await storage.createApartment(result.data);
    res.status(201).json(apartment);
  });

  // Update apartment details (managers and owners only)
  app.patch("/api/apartments/:id", requireAdmin, async (req, res) => {
    const apartmentId = parseInt(req.params.id);
    const apartment = await storage.getApartment(apartmentId);

    if (!apartment) {
      return res.status(404).json({ message: "Apartment not found" });
    }

    // If owner, verify they own this apartment
    if (req.user!.role === "owner" && apartment.ownerId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to modify this apartment" });
    }

    const result = insertApartmentSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid apartment data" });
    }

    const updatedApartment = await storage.updateApartment(apartmentId, result.data);
    res.json(updatedApartment);
  });


  // Visitors
  app.post("/api/visitors", requireAuth, async (req, res) => {
    const result = insertVisitorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid visitor data" });
    }

    const visitor = await storage.createVisitor({
      ...result.data,
      status: "upcoming",
    });
    res.status(201).json(visitor);
  });

  app.get("/api/visitors", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      let visitors;
      if (user.role === "tenant") {
        const apartments = await storage.getApartmentsByTenant(user.id);
        visitors = await storage.getVisitors(apartments[0]?.id);
      } else {
        visitors = await storage.getVisitors();
      }
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/visitors/:id/status", requireAuth, async (req, res) => {
    const user = req.user!;
    const { status } = req.body;
    if (!["upcoming", "current", "past"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get the visitor
    const visitorId = parseInt(req.params.id);
    const visitor = await storage.getVisitor(visitorId);
    
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    
    // For status updates from pending to current/past (approvals/denials)
    // Only allow if user is owner, tenant, or manager
    if (visitor.status === "pending" && (status === "current" || status === "past")) {
      if (!["owner", "tenant", "manager"].includes(user.role)) {
        return res.status(403).json({ 
          message: "Only owners, tenants, or managers can approve or deny visitors" 
        });
      }
    }

    const now = new Date();
    const updatedVisitor = await storage.updateVisitorStatus(
      visitorId,
      status,
      status === "current" ? now : undefined,
      status === "past" ? now : undefined,
      user.id,
      false // Clear pendingApproval flag
    );

    if (!updatedVisitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.json(updatedVisitor);
  });
  
  // Endpoint for security to request approval from owner/tenant
  app.post("/api/visitors/:id/request-approval", requireAuth, async (req, res) => {
    const user = req.user!;
    
    // Only security can request approvals
    if (user.role !== "security") {
      return res.status(403).json({ message: "Only security personnel can request approvals" });
    }
    
    const visitorId = parseInt(req.params.id);
    const visitor = await storage.getVisitor(visitorId);
    
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    
    // Set the pendingApproval flag
    const updatedVisitor = await storage.updateVisitorApprovalStatus(visitorId, true);
    
    if (!updatedVisitor) {
      return res.status(500).json({ message: "Failed to update visitor" });
    }
    
    // In a real app, you would send notifications to the owner/tenant here
    
    res.json({ 
      success: true, 
      message: "Approval request sent to owner and tenant",
      visitor: updatedVisitor
    });
  });
  
  // Visitor notification endpoint (for security role)
  app.post("/api/visitors/:id/notify", requireAuth, async (req, res) => {
    const user = req.user!;
    
    // Only security can send notifications
    if (user.role !== "security") {
      return res.status(403).json({ message: "Only security personnel can send notifications" });
    }
    
    const visitorId = parseInt(req.params.id);
    const visitor = await storage.getVisitor(visitorId);
    
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    
    // In a real app, you would send an actual notification here
    // For this demo, we'll just return success
    
    // Log notification in the system
    await storage.logVisitorNotification(visitorId, user.id);
    
    res.json({ success: true, message: "Notification sent successfully" });
  });

  // Announcements
  app.post("/api/announcements", requireAdmin, async (req, res) => {
    const result = insertAnnouncementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid announcement data" });
    }

    const announcement = await storage.createAnnouncement({
      ...result.data,
      createdBy: req.user!.id,
    });
    res.status(201).json(announcement);
  });

  app.get("/api/announcements", requireAuth, async (req, res) => {
    const announcements = await storage.getAnnouncements();
    res.json(announcements);
  });

  const httpServer = createServer(app);
  return httpServer;
}