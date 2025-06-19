import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(numAmount);
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return format(date, "dd/MM/yyyy");
}

export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return format(date, "dd/MM/yyyy HH:mm");
}

export function formatTimeAgo(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getDaysUntilBirthday(birthdayString: string): number | null {
  if (!birthdayString) return null;
  
  const today = new Date();
  const birthday = new Date(birthdayString);
  
  // Set birthday to this year
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );
  
  // If birthday has passed this year, set it to next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  // Calculate difference in days
  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getRandomGreeting(): string {
  const greetings = [
    "Olá",
    "Bem-vindo(a) de volta",
    "Bom dia",
    "Saudações",
    "Oi",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function getAvailableTimeSlots(startTime: Date, endTime: Date, duration: number, bookedSlots: Date[]): Date[] {
  const slots: Date[] = [];
  const current = new Date(startTime);
  
  while (current < endTime) {
    const slotEnd = new Date(current.getTime() + duration * 60000);
    
    // Check if this slot overlaps with any booked slots
    const isOverlapping = bookedSlots.some(bookedTime => {
      const bookedStart = new Date(bookedTime);
      const bookedEnd = new Date(bookedStart.getTime() + duration * 60000);
      return (
        (current >= bookedStart && current < bookedEnd) ||
        (slotEnd > bookedStart && slotEnd <= bookedEnd) ||
        (current <= bookedStart && slotEnd >= bookedEnd)
      );
    });
    
    if (!isOverlapping) {
      slots.push(new Date(current));
    }
    
    // Move to next slot
    current.setMinutes(current.getMinutes() + duration);
  }
  
  return slots;
}

export function generateAppointmentEventForCalendar(appointment: any) {
  return {
    id: appointment.id.toString(),
    title: `Appointment: ${appointment.clientName}`,
    start: new Date(appointment.startTime),
    end: new Date(appointment.endTime),
    extendedProps: {
      clientId: appointment.clientId,
      staffId: appointment.staffId,
      serviceId: appointment.serviceId,
      status: appointment.status,
      notes: appointment.notes
    }
  };
}

export function calculateAge(birthdayString: string): number | null {
  if (!birthdayString) return null;
  
  const today = new Date();
  const birthDate = new Date(birthdayString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function createColorClass(value: number, isInverted: boolean = false): string {
  if (isInverted) {
    if (value < 0) return "text-success";
    if (value > 0) return "text-destructive";
    return "text-muted-foreground";
  } else {
    if (value > 0) return "text-success";
    if (value < 0) return "text-destructive";
    return "text-muted-foreground";
  }
}

export function getInitials(name: string): string {
  if (!name) return "??";
  
  const nameParts = name.split(" ");
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
}
