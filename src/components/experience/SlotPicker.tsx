import React from 'react';
import { ExperienceSlot } from '../../types';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import cupLogoImg from '../../assets/cup-logo.png';

interface SlotPickerProps {
  slots: ExperienceSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: ExperienceSlot) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        const isFull = slot.bookedCount >= slot.capacity || slot.status === 'fully_booked';
        const spotsLeft = slot.capacity - slot.bookedCount;

        const dateObj = new Date(slot.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return (
          <div
            key={slot.id}
            className="experience-slot-row"
            style={{
              borderColor: isSelected ? 'var(--color-espresso)' : 'var(--color-brown-border-light)',
              opacity: isFull ? 0.6 : 1
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xs)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-espresso)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  <Calendar size={14} style={{ color: 'var(--color-warm-amber)' }} />
                  <span>{formattedDate}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={13} />
                  <span>{slot.time} ({slot.durationMinutes} mins)</span>
                </div>
                <StatusBadge status={isFull ? 'Sold Out' : `${spotsLeft} Seats Left`} />
              </div>

              <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', margin: '0.2rem 0' }}>
                {slot.title}
              </h4>
              <p className="body-small" style={{ marginBottom: 'var(--space-sm)' }}>
                {slot.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  <img src={cupLogoImg} alt="" style={{ width: '13px', height: '13px' }} />
                  {slot.kinkooRequired} Kinkoos
                </span>
                <span style={{ color: 'var(--color-sage)', fontWeight: 600 }}>
                  ★ Eligible for free monthly 6-visit claim
                </span>
              </div>
            </div>

            <div>
              <button
                onClick={() => !isFull && onSelectSlot(slot)}
                disabled={isFull}
                className={`btn ${isFull ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              >
                <span>{isFull ? 'Full' : 'Reserve Seat'}</span>
                {!isFull && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
