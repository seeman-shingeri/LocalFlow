import { describe, it, expect, beforeEach } from 'vitest';
import { buildCsvString } from '../lib/utils';
import { localDb, INITIAL_WORKSPACE } from '../lib/localStorageDb';
import { enquiryService } from '../services/enquiryService';

const WORKSPACE_ID = INITIAL_WORKSPACE.id;

describe('CSV Export & Enquiry Pipeline Operations', () => {
  beforeEach(() => {
    window.localStorage.clear();
    localDb.resetAll();
  });

  describe('buildCsvString RFC 4180 & Formula Injection Protection', () => {
    it('escapes double quotes, commas, and null values properly', () => {
      const csv = buildCsvString(
        ['Customer Name', 'Notes', 'Amount'],
        [
          ['Sarah "VIP" Jenkins', 'Needs AC check, filter replacement', 250.5],
          ['David Miller', null, undefined],
        ]
      );

      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('"Customer Name","Notes","Amount"');
      expect(lines[1]).toBe('"Sarah ""VIP"" Jenkins","Needs AC check, filter replacement","250.5"');
      expect(lines[2]).toBe('"David Miller","",""');
    });

    it('sanitizes leading formula characters (=, +, -, @) to prevent CSV formula injection', () => {
      const csv = buildCsvString(['Name', 'Note'], [['Malicious', '=CMD|" /C calc"!A0']]);
      const lines = csv.split('\r\n');
      expect(lines[1]).toBe('"Malicious","\'=CMD|"" /C calc""!A0"');
    });
  });

  describe('Enquiry Pipeline Service Lifecycle', () => {
    it('creates, updates status through pipeline stages, filters by status/customer, and deletes enquiries', async () => {
      const created = await enquiryService.create({
        workspace_id: WORKSPACE_ID,
        customer_id: 'cust-001',
        title: 'Whole-Home Dehumidifier Installation',
        notes: 'Customer requested quote for 90-pint whole-home unit',
        service_type: 'Installation',
        estimated_value: 2450,
        status: 'new',
        priority: 'high',
      });

      expect(created.id).toBeTruthy();
      expect(created.customer?.name).toBe('Sarah Jenkins');

      const quoted = await enquiryService.updateStatus(created.id, 'interested');
      expect(quoted.status).toBe('interested');

      const converted = await enquiryService.updateStatus(created.id, 'converted');
      expect(converted.status).toBe('converted');

      const customerEnquiries = await enquiryService.getAll(WORKSPACE_ID, {
        customerId: 'cust-001',
        status: 'converted',
      });
      expect(customerEnquiries.some((e) => e.id === created.id)).toBe(true);

      await enquiryService.delete(created.id, WORKSPACE_ID);
      const afterDelete = await enquiryService.getAll(WORKSPACE_ID);
      expect(afterDelete.some((e) => e.id === created.id)).toBe(false);
    });
  });
});
