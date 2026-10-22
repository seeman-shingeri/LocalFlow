import { describe, it, expect } from 'vitest';
import { forecastDailyEquipmentUtilization } from '@/lib/utilizationForecast';
import { Appointment } from '@/types/database';
import { addDays, format } from 'date-fns';

describe('Equipment Daily Utilization Forecast (utilizationForecast)', () => {
  const baseDate = new Date(2026, 9, 22); // Oct 22, 2026

  const mockAppointments: Appointment[] = [
    // Oct 23: 1 booking
    {
      id: 'apt-1',
      workspace_id: 'ws-1',
      customer_id: 'cust-1',
      title: 'Wedding Canopy Setup',
      start_time: '2026-10-23T10:00:00Z',
      end_time: '2026-10-23T18:00:00Z',
      duration_minutes: 480,
      status: 'scheduled',
      location: 'Austin',
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    // Oct 24: 2 bookings (peak)
    {
      id: 'apt-2',
      workspace_id: 'ws-1',
      customer_id: 'cust-2',
      title: 'Gala Night',
      start_time: '2026-10-24T12:00:00Z',
      end_time: '2026-10-24T22:00:00Z',
      duration_minutes: 600,
      status: 'scheduled',
      location: 'Austin',
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'apt-3',
      workspace_id: 'ws-1',
      customer_id: 'cust-3',
      title: 'Outdoor Stage Lighting',
      start_time: '2026-10-24T14:00:00Z',
      end_time: '2026-10-24T20:00:00Z',
      duration_minutes: 360,
      status: 'scheduled',
      location: 'Austin',
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  ];

  it('generates a day-by-day forecast for 7 days', () => {
    // Total capacity = 100 units, 50 units per event
    const forecast = forecastDailyEquipmentUtilization({
      totalFleetCapacity: 100,
      appointments: mockAppointments,
      daysAhead: 7,
      startDate: baseDate,
      averageUnitsPerEvent: 50,
    });

    expect(forecast).toHaveLength(7);

    // Day 0: Oct 22 (0 bookings) -> 0%
    expect(forecast[0].date).toBe('2026-10-22');
    expect(forecast[0].activeEventBookingsCount).toBe(0);
    expect(forecast[0].utilizationRatePercent).toBe(0);
    expect(forecast[0].capacityStatus).toBe('low_demand');

    // Day 1: Oct 23 (1 booking) -> 50%
    expect(forecast[1].date).toBe('2026-10-23');
    expect(forecast[1].activeEventBookingsCount).toBe(1);
    expect(forecast[1].utilizationRatePercent).toBe(50);
    expect(forecast[1].capacityStatus).toBe('moderate');

    // Day 2: Oct 24 (2 bookings) -> 100% peak
    expect(forecast[2].date).toBe('2026-10-24');
    expect(forecast[2].activeEventBookingsCount).toBe(2);
    expect(forecast[2].utilizationRatePercent).toBe(100);
    expect(forecast[2].capacityStatus).toBe('peak_capacity');
  });

  it('ignores cancelled bookings from forecast', () => {
    const cancelledAppt: Appointment = {
      ...mockAppointments[0],
      id: 'apt-cancelled',
      status: 'cancelled',
    };

    const forecast = forecastDailyEquipmentUtilization({
      totalFleetCapacity: 100,
      appointments: [cancelledAppt],
      daysAhead: 3,
      startDate: baseDate,
    });

    expect(forecast.every((f) => f.activeEventBookingsCount === 0)).toBe(true);
  });
});
