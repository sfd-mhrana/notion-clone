import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatabaseProperty, DatabaseRow, PropertyType } from '../database.models';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  rows: DatabaseRow[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calendar-view">
      <!-- Calendar Header -->
      <div class="calendar-header">
        <div class="month-nav">
          <button mat-icon-button (click)="previousMonth()">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="month-title">{{ monthTitle() }}</span>
          <button mat-icon-button (click)="nextMonth()">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
        <button mat-button (click)="goToToday()">Today</button>
      </div>

      <!-- Day Names -->
      <div class="day-names">
        @for (day of dayNames; track day) {
          <div class="day-name">{{ day }}</div>
        }
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        @for (day of calendarDays(); track day.date.toISOString()) {
          <div
            class="calendar-day"
            [class.other-month]="!day.isCurrentMonth"
            [class.today]="day.isToday"
            (click)="onDayClick(day)"
          >
            <span class="day-number">{{ day.date.getDate() }}</span>
            <div class="day-events">
              @for (row of day.rows.slice(0, 3); track row.id) {
                <div class="event-item" (click)="onRowClick(row, $event)">
                  <span class="event-icon">{{ row.icon || '📄' }}</span>
                  <span class="event-title">{{ row.title }}</span>
                </div>
              }
              @if (day.rows.length > 3) {
                <div class="more-events">+{{ day.rows.length - 3 }} more</div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .calendar-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e5e5;
    }

    .month-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .month-title {
      font-size: 18px;
      font-weight: 600;
      min-width: 160px;
      text-align: center;
    }

    .day-names {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
      background: #f7f6f3;
    }

    .day-name {
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.5);
      text-transform: uppercase;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      overflow-y: auto;
    }

    .calendar-day {
      min-height: 120px;
      padding: 4px;
      border-right: 1px solid #e5e5e5;
      border-bottom: 1px solid #e5e5e5;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .calendar-day:hover {
      background: rgba(55, 53, 47, 0.04);
    }

    .calendar-day:nth-child(7n) {
      border-right: none;
    }

    .calendar-day.other-month {
      background: rgba(55, 53, 47, 0.02);
    }

    .calendar-day.other-month .day-number {
      color: rgba(55, 53, 47, 0.3);
    }

    .calendar-day.today .day-number {
      background: #2383e2;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .day-number {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .day-events {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 4px;
      background: rgba(35, 131, 226, 0.1);
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      overflow: hidden;
    }

    .event-item:hover {
      background: rgba(35, 131, 226, 0.2);
    }

    .event-icon {
      flex-shrink: 0;
    }

    .event-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .more-events {
      font-size: 11px;
      color: rgba(55, 53, 47, 0.5);
      padding: 2px 4px;
    }
  `],
})
export class CalendarViewComponent {
  @Input() properties: DatabaseProperty[] = [];
  @Input() rows: DatabaseRow[] = [];
  @Input() datePropertyId = '';

  @Output() rowClick = new EventEmitter<DatabaseRow>();
  @Output() addRow = new EventEmitter<Date>();

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly currentDate = signal(new Date());

  readonly monthTitle = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);

      const dayRows = this.getRowsForDate(dayDate);

      days.push({
        date: dayDate,
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        rows: dayRows,
      });
    }

    return days;
  });

  private getRowsForDate(date: Date): DatabaseRow[] {
    if (!this.datePropertyId) return [];

    const dateStr = date.toISOString().split('T')[0];

    return this.rows.filter(row => {
      const rowDate = row.properties[this.datePropertyId];
      if (!rowDate) return false;

      const rowDateStr = typeof rowDate === 'string'
        ? rowDate.split('T')[0]
        : new Date(rowDate as number).toISOString().split('T')[0];

      return rowDateStr === dateStr;
    });
  }

  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  onDayClick(day: CalendarDay): void {
    this.addRow.emit(day.date);
  }

  onRowClick(row: DatabaseRow, event: Event): void {
    event.stopPropagation();
    this.rowClick.emit(row);
  }
}
