export type EventType =
  | 'wedding'
  | 'corporate'
  | 'concert'
  | 'birthday'
  | 'festival'
  | 'general';

export interface ChecklistTask {
  id: string;
  category: 'rigging' | 'electrical_av' | 'safety' | 'teardown';
  title: string;
  priority: 'high' | 'medium';
  isCompleted: boolean;
}

export interface EventChecklist {
  eventType: EventType;
  tasks: ChecklistTask[];
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

const BASE_TASKS: Omit<ChecklistTask, 'id' | 'isCompleted'>[] = [
  {
    category: 'rigging',
    title: 'Inspect ground leveling and anchor tent poles securely',
    priority: 'high',
  },
  {
    category: 'safety',
    title: 'Verify fire extinguisher placement and emergency exit corridors',
    priority: 'high',
  },
  {
    category: 'electrical_av',
    title: 'Check power supply load, circuit breakers, and generator earthing',
    priority: 'high',
  },
  {
    category: 'teardown',
    title: 'Conduct count and physical damage inspection of inventory before loading trucks',
    priority: 'high',
  },
];

const EVENT_SPECIFIC_TASKS: Record<EventType, Omit<ChecklistTask, 'id' | 'isCompleted'>[]> = {
  wedding: [
    {
      category: 'rigging',
      title: 'Assemble bridal stage backdrop and VIP sofa placement',
      priority: 'high',
    },
    {
      category: 'electrical_av',
      title: 'Setup mood lighting, spotlights, and varmala revolving stage power',
      priority: 'high',
    },
  ],
  concert: [
    {
      category: 'rigging',
      title: 'Erect heavy-duty aluminium box truss and line-array speaker towers',
      priority: 'high',
    },
    {
      category: 'safety',
      title: 'Install crowd barricades and barricade perimeter lock pins',
      priority: 'high',
    },
    {
      category: 'electrical_av',
      title: 'Complete sound check, mixer board routing, and backup generator switch test',
      priority: 'high',
    },
  ],
  corporate: [
    {
      category: 'electrical_av',
      title: 'Test projector display, wireless clickers, and podium condenser mics',
      priority: 'high',
    },
  ],
  birthday: [
    {
      category: 'rigging',
      title: 'Erect balloon arch frame and party seating cluster',
      priority: 'medium',
    },
  ],
  festival: [
    {
      category: 'rigging',
      title: 'Erect water-proof German hanger and food stall canopy partitions',
      priority: 'high',
    },
    {
      category: 'safety',
      title: 'Coordinate multi-lane entry gates and rain water drainage trenches',
      priority: 'high',
    },
  ],
  general: [],
};

/**
 * Generates an event-specific logistics checklist.
 */
export function generateEventChecklist(
  eventType: EventType,
  completedTaskIds: string[] = []
): EventChecklist {
  const specific = EVENT_SPECIFIC_TASKS[eventType] || [];
  const rawList = [...BASE_TASKS, ...specific];

  const tasks: ChecklistTask[] = rawList.map((t, idx) => {
    const id = `task_${eventType}_${idx + 1}`;
    return {
      ...t,
      id,
      isCompleted: completedTaskIds.includes(id),
    };
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    eventType,
    tasks,
    totalTasks,
    completedTasks,
    progressPercentage,
  };
}
