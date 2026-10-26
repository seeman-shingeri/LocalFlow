import { describe, it, expect } from 'vitest';
import { generateEventChecklist } from '@/lib/setupChecklist';

describe('Event Setup Checklist Template Generator (setupChecklist)', () => {
  it('generates wedding-tailored checklists with bridal stage setup tasks', () => {
    const list = generateEventChecklist('wedding');

    expect(list.eventType).toBe('wedding');
    expect(list.totalTasks).toBe(6); // 4 base + 2 wedding
    expect(list.completedTasks).toBe(0);
    expect(list.progressPercentage).toBe(0);

    const stageTask = list.tasks.find((t) => t.title.includes('bridal stage backdrop'));
    expect(stageTask).toBeDefined();
    expect(stageTask?.category).toBe('rigging');
  });

  it('calculates completion metrics accurately when task IDs are satisfied', () => {
    // Complete 3 out of 6 tasks
    const list = generateEventChecklist('wedding', [
      'task_wedding_1',
      'task_wedding_2',
      'task_wedding_3',
    ]);

    expect(list.completedTasks).toBe(3);
    expect(list.progressPercentage).toBe(50);
  });

  it('generates high-safety concert checklists with crowd barricade tasks', () => {
    const list = generateEventChecklist('concert');
    const barricadeTask = list.tasks.find((t) => t.title.includes('crowd barricades'));

    expect(barricadeTask).toBeDefined();
    expect(barricadeTask?.priority).toBe('high');
  });
});
