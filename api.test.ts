import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../server/storage';
import { analyzeCall } from '../server/lib/openai';
import { sendAlert } from '../server/lib/twilio';

describe('Contact Management', () => {
  beforeEach(() => {
    // Reset in-memory storage
    const contacts = storage.getContacts();
    contacts.forEach(contact => {
      storage.deleteContact(contact.id);
    });
  });

  it('should create and retrieve contacts', async () => {
    const contact = await storage.createContact({
      name: "Test User",
      phoneNumber: "+1234567890",
      isEmergency: true,
      isTrusted: true
    });

    expect(contact.id).toBeDefined();
    expect(contact.name).toBe("Test User");

    const retrieved = await storage.getContact(contact.id);
    expect(retrieved).toEqual(contact);
  });

  it('should update contact information', async () => {
    const contact = await storage.createContact({
      name: "Original Name",
      phoneNumber: "+1234567890",
      isEmergency: false,
      isTrusted: false
    });

    const updated = await storage.updateContact(contact.id, {
      name: "Updated Name",
      isEmergency: true
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.isEmergency).toBe(true);
    expect(updated.phoneNumber).toBe("+1234567890"); // Unchanged
  });
});

describe('Call Analysis', () => {
  it('should analyze call transcript with mood tracking', async () => {
    const analysis = await analyzeCall("Hello, I need to verify your account information immediately.");

    expect(analysis).toMatchObject({
      risk: expect.any(Number),
      summary: expect.any(String),
      keywords: expect.any(Array),
      mood: {
        emoji: expect.any(String),
        stressLevel: expect.any(Number),
        description: expect.any(String)
      }
    });

    // Validate value ranges
    expect(analysis.risk).toBeGreaterThanOrEqual(0);
    expect(analysis.risk).toBeLessThanOrEqual(1);
    expect(analysis.mood.stressLevel).toBeGreaterThanOrEqual(0);
    expect(analysis.mood.stressLevel).toBeLessThanOrEqual(1);
  });

  it('should handle API errors gracefully', async () => {
    // Test with invalid/empty input
    await expect(analyzeCall("")).rejects.toThrow();
  });
});

describe('Alert System', () => {
  it('should send SMS alerts for suspicious calls', async () => {
    const phoneNumber = "+1234567890";
    const message = "Suspicious activity detected in recent call";

    await expect(sendAlert(phoneNumber, message)).resolves.not.toThrow();
  });

  it('should validate phone numbers before sending alerts', async () => {
    const invalidPhone = "not-a-phone";
    const message = "Test alert";

    await expect(sendAlert(invalidPhone, message)).rejects.toThrow();
  });
});